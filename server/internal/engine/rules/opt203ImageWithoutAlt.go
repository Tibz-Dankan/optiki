package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type imageWithoutAlt struct{}

func (imageWithoutAlt) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-203",
		Name:      "Image without alt",
		Category:  engine.CategoryPerceivable,
		Severity:  engine.SeverityModerate,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "An <img> has no alt attribute. alt=\"\" is fine for decoration.",
		Why:       "An image with no alt attribute is announced by its file name or not at all, so agents lose whatever it shows. An empty alt says \"decorative, skip me\", which is fine.",
		Fix:       "Add alt text that says what the image shows, or alt=\"\" if it's decoration.",
		FixBefore: "<img src=\"signups.png\">",
		FixAfter:  "<img src=\"signups.png\" alt=\"Signups doubled in March\">",
		WCAG:      "1.1.1 Non-text Content",
		Origin:    "Baseline",
	}
}

func (imageWithoutAlt) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag != "img" || node.Namespace != "" || engine.IsHiddenFromEveryone(node) {
			continue
		}
		applicable = true
		if _, hasAlt := node.Attrs["alt"]; hasAlt {
			continue
		}
		if node.HiddenBy == engine.HiddenByAriaHidden || node.Role == "none" || node.Role == "presentation" {
			continue
		}
		if node.NameFrom == engine.NameFromAriaLabel || node.NameFrom == engine.NameFromAriaLabelledBy {
			continue
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This image has no alt attribute, so agents don't know what it shows.",
			Evidence: map[string]any{},
		})
	}
	return issues, applicable
}
