package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/gym"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/static"
)

func fullSet(t *testing.T) engine.RuleSet {
	t.Helper()
	set, ok := Set(RuleSetFull)
	if !ok {
		t.Fatal("FULL rule set missing")
	}
	return set
}

func scanGym(t *testing.T, id string) engine.Report {
	t.Helper()
	page, ok := gym.Page(id)
	if !ok {
		t.Fatalf("gym page %q missing", id)
	}
	return engine.Scan(static.Build(page, "", gym.Route(id)), fullSet(t))
}

// scanHTML wraps a body fragment in a page with a title, h1 and main, so only the fragment can fail.
func scanHTML(t *testing.T, body string) engine.Report {
	t.Helper()
	return engine.Scan(staticPage(body), fullSet(t))
}

func staticPage(body string) engine.Snapshot {
	page := `<!doctype html><html lang="en"><head><title>Test</title></head><body><main><h1>Test</h1>` + body + `</main></body></html>`
	return static.Build(page, "", "/")
}

// renderedPage is a static snapshot marked rendered, for rules that read rendered-only fields.
func renderedPage(body string, prepare func(s *engine.Snapshot)) engine.Snapshot {
	snapshot := staticPage(body)
	snapshot.Mode = engine.ModeRendered
	if prepare != nil {
		prepare(&snapshot)
	}
	return snapshot
}

func findingsFor(report engine.Report, ruleID string) []engine.Finding {
	var findings []engine.Finding
	for _, finding := range report.Findings {
		if finding.RuleID == ruleID {
			findings = append(findings, finding)
		}
	}
	return findings
}

func resultFor(report engine.Report, ruleID string) string {
	for _, result := range report.Rules {
		if result.RuleID == ruleID {
			return result.Result
		}
	}
	return ""
}

func nodeByTagAndText(s *engine.Snapshot, tag, text string) *engine.Node {
	for id := range s.Nodes {
		if s.Nodes[id].Tag == tag && engine.TextContent(s, id) == text {
			return &s.Nodes[id]
		}
	}
	return nil
}

func expectFindings(t *testing.T, report engine.Report, ruleID string, want int) []engine.Finding {
	t.Helper()
	findings := findingsFor(report, ruleID)
	if len(findings) != want {
		t.Fatalf("%s: want %d findings, got %d: %+v", ruleID, want, len(findings), findings)
	}
	return findings
}

func intPtr(value int) *int           { return &value }
func floatPtr(value float64) *float64 { return &value }
func boolPtr(value bool) *bool        { return &value }
func stringPtr(value string) *string  { return &value }
