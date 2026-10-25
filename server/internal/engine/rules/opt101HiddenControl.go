package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type hiddenControl struct{}

func (hiddenControl) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-101",
		Name:      "Hidden control",
		Category:  engine.CategoryOperable,
		Severity:  engine.SeverityCritical,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "An interactive element is visible but missing from the accessibility tree.",
		Why:       "Agents act through the accessibility tree. A button inside aria-hidden=\"true\", or under role=\"img\" or another role whose children are presentational, is there for people with a mouse but gone for agents and screen readers. A test run that needs it comes back blocked.",
		Fix:       "Remove the masking role or aria-hidden, and put real buttons over the graphic instead of inside it.",
		FixBefore: "<div role=\"img\" aria-label=\"Iteration ring\">\n  <svg>…</svg>\n  <button>Seek to iteration 1</button>\n</div>",
		FixAfter:  "<div>\n  <svg aria-hidden=\"true\">…</svg>\n  <button>Seek to iteration 1</button>\n</div>",
		WCAG:      "4.1.2 Name, Role, Value",
		Origin:    "Ouroboros L1 (baseline)",
	}
}

func (hiddenControl) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || !node.Interactive || engine.IsHiddenFromEveryone(node) {
			continue
		}
		applicable = true

		var message string
		switch {
		case node.HiddenBy == engine.HiddenByAriaHidden:
			message = "This " + describe(node) + " is inside aria-hidden=\"true\", so agents can't see or press it."
		case node.HiddenBy == engine.HiddenByRoleImg:
			message = "This " + describe(node) + " sits inside role=\"img\", so agents can't see or press it."
		case node.HiddenBy == engine.HiddenByPresentationalChildren:
			owner := &s.Nodes[node.HiddenByNode]
			message = "This " + describe(node) + " sits inside a " + describe(owner) + ", whose children are presentational, so agents can't see or press it."
		case s.HasAXTree && !node.Exposed && node.HiddenBy == "" && node.Role != "none" && node.Role != "presentation":
			message = "Chrome leaves this " + describe(node) + " out of the accessibility tree, so agents can't see or press it."
		default:
			continue
		}

		hiddenBy := node.HiddenBy
		hidingPath := node.Path
		if hiddenBy == "" {
			hiddenBy = "IGNORED"
		} else if node.HiddenByNode >= 0 {
			hidingPath = s.Nodes[node.HiddenByNode].Path
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  message,
			Evidence: map[string]any{"hiddenBy": hiddenBy, "hidingAncestorPath": hidingPath},
		})
	}
	return issues, applicable
}
