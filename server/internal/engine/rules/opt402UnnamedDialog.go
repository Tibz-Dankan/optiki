package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type unnamedDialog struct{}

func (unnamedDialog) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-402",
		Name:      "Unnamed dialog",
		Category:  engine.CategoryDiscoverable,
		Severity:  engine.SeverityModerate,
		Priority:  engine.PriorityP1,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "A role=\"dialog\" or <dialog> has no accessible name.",
		Why:       "An unnamed dialog is announced as just \"dialog\". An agent waiting for the \"Delete project\" dialog can't tell it opened, or which one it's in.",
		Fix:       "Point aria-labelledby at the dialog's heading.",
		FixBefore: "<div role=\"dialog\">\n  <h2>Delete project?</h2>\n  …\n</div>",
		FixAfter:  "<div role=\"dialog\" aria-labelledby=\"delete-title\">\n  <h2 id=\"delete-title\">Delete project?</h2>\n  …\n</div>",
		WCAG:      "4.1.2 Name, Role, Value",
		Origin:    "Baseline",
	}
}

func (unnamedDialog) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || (node.Role != "dialog" && node.Role != "alertdialog") || node.HiddenBy == engine.HiddenByAriaHidden {
			continue
		}
		applicable = true
		if node.Name != "" {
			continue
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This dialog has no accessible name, so agents can't tell which dialog opened.",
			Evidence: map[string]any{},
		})
	}
	return issues, applicable
}
