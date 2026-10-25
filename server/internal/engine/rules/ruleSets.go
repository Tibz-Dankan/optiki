package rules

import "github.com/Tibz-Dankan/optiki/internal/engine"

const (
	RuleSetCore = "CORE"
	RuleSetFull = "FULL"
)

// Set returns a named rule set. CORE is exactly the P0 rules; FULL is every rule.
func Set(name string) (engine.RuleSet, bool) {
	switch name {
	case RuleSetCore:
		var core []engine.Rule
		for _, rule := range All() {
			if rule.Meta().Priority == engine.PriorityP0 {
				core = append(core, rule)
			}
		}
		return engine.RuleSet{Name: RuleSetCore, Rules: core}, true
	case RuleSetFull:
		return engine.RuleSet{Name: RuleSetFull, Rules: All()}, true
	}
	return engine.RuleSet{}, false
}

// SetsFor lists the rule sets a rule belongs to.
func SetsFor(meta engine.RuleMeta) []string {
	if meta.Priority == engine.PriorityP0 {
		return []string{RuleSetCore, RuleSetFull}
	}
	return []string{RuleSetFull}
}
