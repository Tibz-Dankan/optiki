package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type unlabeledField struct{}

func (unlabeledField) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-106",
		Name:      "Unlabeled field",
		Category:  engine.CategoryOperable,
		Severity:  engine.SeveritySerious,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "A form field has no programmatic label. A placeholder alone counts as unlabeled.",
		Why:       "Agents fill forms by label: \"type the email into Email\". A field whose only hint is its placeholder has no label once something is typed, and none at all for an agent reading the tree.",
		Fix:       "Add a <label for> pointing at the field, or wrap the field in a <label>.",
		FixBefore: "<input type=\"email\" placeholder=\"Email\">",
		FixAfter:  "<label for=\"email\">Email</label>\n<input id=\"email\" type=\"email\">",
		WCAG:      "1.3.1 Info and Relationships; 3.3.2 Labels or Instructions",
		Origin:    "Baseline",
	}
}

func (unlabeledField) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || !node.Exposed || !engine.FieldRoles[node.Role] {
			continue
		}
		applicable = true
		switch {
		case node.NameFrom == engine.NameFromPlaceholder:
			issues = append(issues, engine.Issue{
				NodeID:   id,
				Message:  "This field's only label is its placeholder \"" + node.Name + "\", which disappears as soon as something is typed.",
				Evidence: map[string]any{"placeholderOnly": true},
			})
		case node.Name == "":
			issues = append(issues, engine.Issue{
				NodeID:   id,
				Message:  "This field has no label, so agents can't tell what to type into it.",
				Evidence: map[string]any{"placeholderOnly": false},
			})
		}
	}
	return issues, applicable
}
