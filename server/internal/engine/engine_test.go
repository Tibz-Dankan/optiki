package engine_test

import (
	"bytes"
	"encoding/json"
	"flag"
	"os"
	"path/filepath"
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/gym"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/static"
)

var update = flag.Bool("update", false, "rewrite the golden reports in testdata/golden")

func scan(t *testing.T, page, setName string) engine.Report {
	t.Helper()
	set, ok := rules.Set(setName)
	if !ok {
		t.Fatalf("unknown rule set %s", setName)
	}
	return engine.Scan(static.Build(page, "", "/"), set)
}

func gymPage(t *testing.T, id string) string {
	t.Helper()
	page, ok := gym.Page(id)
	if !ok {
		t.Fatalf("gym page %s missing", id)
	}
	return page
}

func TestGoldenReports(t *testing.T) {
	for _, id := range []string{gym.KitchenSink, gym.Perfect} {
		for _, setName := range []string{rules.RuleSetCore, rules.RuleSetFull} {
			name := id + "." + map[string]string{rules.RuleSetCore: "core", rules.RuleSetFull: "full"}[setName] + ".json"
			t.Run(name, func(t *testing.T) {
				report := engine.Scan(static.Build(gymPage(t, id), "", gym.Route(id)), mustSet(t, setName))
				got, err := json.MarshalIndent(report, "", "  ")
				if err != nil {
					t.Fatal(err)
				}
				got = append(got, '\n')
				path := filepath.Join("testdata", "golden", name)
				if *update {
					if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
						t.Fatal(err)
					}
					if err := os.WriteFile(path, got, 0o644); err != nil {
						t.Fatal(err)
					}
					return
				}
				want, err := os.ReadFile(path)
				if err != nil {
					t.Fatalf("missing golden report (run make golden): %v", err)
				}
				if !bytes.Equal(got, want) {
					t.Fatalf("%s changed; review the diff and run make golden if it is intended", path)
				}
			})
		}
	}
}

func TestDeterministic(t *testing.T) {
	page := gymPage(t, gym.KitchenSink)
	first, _ := json.Marshal(scan(t, page, rules.RuleSetFull))
	second, _ := json.Marshal(scan(t, page, rules.RuleSetFull))
	if !bytes.Equal(first, second) {
		t.Fatal("two scans of the same page produced different reports")
	}
	if a, b := scan(t, page, rules.RuleSetFull).ReportHash, scan(t, page, rules.RuleSetFull).ReportHash; a == "" || a != b {
		t.Fatalf("report hash is empty or unstable: %q vs %q", a, b)
	}
}

func TestScoresStayInRange(t *testing.T) {
	ids := []string{gym.KitchenSink, gym.Perfect}
	for _, pair := range gym.List() {
		ids = append(ids, pair.Broken, pair.Fixed)
	}
	for _, id := range ids {
		report := scan(t, gymPage(t, id), rules.RuleSetFull)
		for name, value := range map[string]*int{
			"overall": report.Scores.Overall, "operable": report.Scores.Operable, "perceivable": report.Scores.Perceivable,
			"stable": report.Scores.Stable, "discoverable": report.Scores.Discoverable,
		} {
			if value != nil && (*value < 0 || *value > 100) {
				t.Errorf("%s %s score out of range: %d", id, name, *value)
			}
		}
	}
}

func TestAddingAViolationNeverRaisesTheScore(t *testing.T) {
	base := `<html lang="en"><head><title>T</title></head><body><main><h1>T</h1><button>Save</button>%s</main></body></html>`
	clean := scan(t, sprintf(base, ""), rules.RuleSetFull)
	for _, violation := range []string{
		`<button><svg aria-hidden="true"></svg></button>`,
		`<div onclick="go()">Go</div>`,
		`<img src="x.png">`,
		`<input placeholder="Email">`,
		`<iframe src="https://example.com"></iframe>`,
	} {
		broken := scan(t, sprintf(base, violation), rules.RuleSetFull)
		if *broken.Scores.Overall > *clean.Scores.Overall {
			t.Errorf("adding %s raised the score from %d to %d", violation, *clean.Scores.Overall, *broken.Scores.Overall)
		}
	}
}

func TestFixingARuleNeverLowersTheScore(t *testing.T) {
	for _, pair := range gym.List() {
		broken := scan(t, gymPage(t, pair.Broken), rules.RuleSetFull)
		fixed := scan(t, gymPage(t, pair.Fixed), rules.RuleSetFull)
		if *fixed.Scores.Overall < *broken.Scores.Overall {
			t.Errorf("%s: the fixed page scores %d, below the broken page's %d", pair.ID, *fixed.Scores.Overall, *broken.Scores.Overall)
		}
	}
}

func TestFindingsAreOrderedAndFingerprinted(t *testing.T) {
	report := scan(t, gymPage(t, gym.KitchenSink), rules.RuleSetFull)
	seen := map[string]bool{}
	for index, finding := range report.Findings {
		if finding.Position != index+1 {
			t.Errorf("finding %d has position %d", index, finding.Position)
		}
		if index > 0 {
			previous := report.Findings[index-1]
			if previous.RuleID > finding.RuleID || (previous.RuleID == finding.RuleID && previous.DocumentOrder > finding.DocumentOrder) {
				t.Errorf("findings out of order at %d", index)
			}
		}
		if len(finding.Fingerprint) != 64 || seen[finding.Fingerprint] {
			t.Errorf("fingerprint missing or duplicated: %q", finding.Fingerprint)
		}
		seen[finding.Fingerprint] = true
	}
}

func TestFingerprintSurvivesUnrelatedEdits(t *testing.T) {
	before := `<html><head><title>T</title></head><body><main><h1>T</h1><section id="toolbar"><button><svg aria-hidden="true"></svg></button></section></main></body></html>`
	after := `<html><head><title>T</title></head><body><main><h1>T</h1><p>New intro paragraph</p><div>More</div><section id="toolbar"><button><svg aria-hidden="true"></svg></button></section></main></body></html>`
	a := scan(t, before, rules.RuleSetFull).Findings
	b := scan(t, after, rules.RuleSetFull).Findings
	if len(a) != 1 || len(b) != 1 || a[0].Fingerprint != b[0].Fingerprint {
		t.Fatalf("fingerprint changed after an unrelated edit: %+v vs %+v", a, b)
	}
}

func mustSet(t *testing.T, name string) engine.RuleSet {
	t.Helper()
	set, ok := rules.Set(name)
	if !ok {
		t.Fatalf("unknown rule set %s", name)
	}
	return set
}

func sprintf(format, value string) string {
	return string(bytes.Replace([]byte(format), []byte("%s"), []byte(value), 1))
}
