package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/gym"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/static"
)

// Broken pages fail exactly their own rule; fixed pages fail nothing.
func TestGymPairs(t *testing.T) {
	wantCounts := map[string]int{"OPT-103": 2}
	for _, pair := range gym.List() {
		t.Run(pair.ID, func(t *testing.T) {
			broken := scanGym(t, pair.Broken)
			for _, result := range broken.Rules {
				switch {
				case pair.Renders && result.RuleID == pair.RuleID:
					if result.Result != engine.ResultNeedsRendered {
						t.Errorf("%s statically: want NEEDS_RENDERED, got %s", result.RuleID, result.Result)
					}
				case result.RuleID == pair.RuleID:
					if result.Result != engine.ResultFail {
						t.Errorf("%s: want FAIL on its broken page, got %s", result.RuleID, result.Result)
					}
				case result.Result == engine.ResultFail:
					t.Errorf("%s fails on %s's broken page too", result.RuleID, pair.RuleID)
				}
			}
			if !pair.Renders {
				want := wantCounts[pair.RuleID]
				if want == 0 {
					want = 1
				}
				expectFindings(t, broken, pair.RuleID, want)
			}

			fixed := scanGym(t, pair.Fixed)
			if len(fixed.Findings) != 0 {
				t.Errorf("fixed page has findings: %+v", fixed.Findings)
			}
		})
	}
}

func TestKitchenSinkFailsEveryStaticRule(t *testing.T) {
	core, _ := Set(RuleSetCore)
	page, _ := gym.Page(gym.KitchenSink)
	report := scanGym(t, gym.KitchenSink)
	coreReport := engine.Scan(static.Build(page, "", gym.Route(gym.KitchenSink)), core)

	if coreReport.Counts.RulesFailed != 9 || len(coreReport.Rules) != 9 {
		t.Errorf("CORE: want 9 of 9 rules failed, got %d of %d", coreReport.Counts.RulesFailed, len(coreReport.Rules))
	}
	if report.Counts.RulesFailed != 14 || report.Counts.RulesNeedRendered != 3 || len(report.Rules) != 17 {
		t.Errorf("FULL static: want 14 failed + 3 needs rendered of 17, got %+v", report.Counts)
	}
}

func TestPerfectScoresHundred(t *testing.T) {
	report := scanGym(t, gym.Perfect)
	if len(report.Findings) != 0 || report.Scores.Overall == nil || *report.Scores.Overall != 100 {
		t.Fatalf("perfect: want 100 and no findings, got %v %+v", report.Scores.Overall, report.Findings)
	}
	if report.Scores.Stable != nil {
		t.Errorf("a static scan has no Stable score, got %d", *report.Scores.Stable)
	}
}

func TestRuleSets(t *testing.T) {
	core, _ := Set(RuleSetCore)
	full, _ := Set(RuleSetFull)
	if len(core.Rules) != 9 || len(full.Rules) != 17 {
		t.Fatalf("want 9 CORE and 17 FULL rules, got %d and %d", len(core.Rules), len(full.Rules))
	}
	for _, rule := range core.Rules {
		if rule.Meta().Priority != engine.PriorityP0 {
			t.Errorf("%s is in CORE but is %s", rule.Meta().ID, rule.Meta().Priority)
		}
	}
	if engine.RulesetHash(core) == engine.RulesetHash(full) {
		t.Error("CORE and FULL must hash differently")
	}
	if _, ok := Set("NOPE"); ok {
		t.Error("unknown set names must be rejected")
	}
	seen := map[string]bool{}
	for _, rule := range All() {
		meta := rule.Meta()
		if seen[meta.ID] {
			t.Errorf("duplicate rule %s", meta.ID)
		}
		seen[meta.ID] = true
		if meta.Why == "" || meta.Fix == "" || meta.FixBefore == "" || meta.FixAfter == "" || meta.Origin == "" {
			t.Errorf("%s is missing catalog metadata", meta.ID)
		}
	}
}
