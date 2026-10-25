package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type unnamedControl struct{}

func (unnamedControl) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-102",
		Name:      "Unnamed control",
		Category:  engine.CategoryOperable,
		Severity:  engine.SeverityCritical,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "A button, link or menu item has no accessible name.",
		Why:       "An icon-only button is announced as just \"button\". An agent told to export, share or close can't tell it from its neighbours, so it guesses or gives up. (Form fields without a label are OPT-106.)",
		Fix:       "Give the control visible text, an aria-label, or a <title> inside its SVG icon.",
		FixBefore: "<button>\n  <svg aria-hidden=\"true\">…</svg>\n</button>",
		FixAfter:  "<button aria-label=\"Export report\">\n  <svg aria-hidden=\"true\">…</svg>\n</button>",
		WCAG:      "4.1.2 Name, Role, Value",
		Origin:    "Baseline",
	}
}

func (unnamedControl) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || !node.Exposed || !engine.ActionRoles[node.Role] {
			continue
		}
		applicable = true
		if node.Name != "" {
			continue
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This " + describe(node) + " has no accessible name, so agents can't tell what it does.",
			Evidence: map[string]any{},
		})
	}
	return issues, applicable
}
