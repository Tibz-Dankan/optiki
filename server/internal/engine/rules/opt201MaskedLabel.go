package rules

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type maskedLabel struct{}

func (maskedLabel) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-201",
		Name:      "Masked label",
		Category:  engine.CategoryPerceivable,
		Severity:  engine.SeveritySerious,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "The accessible name from aria-label or aria-labelledby doesn't contain the visible text.",
		Why:       "When aria-label replaces the visible words, an agent told to click \"Press ? for shortcuts\" looks for a control by that name and finds one called \"Help\" instead. Voice users hit the same wall.",
		Fix:       "Drop the aria-label so the visible text is the name, or include the visible words in it.",
		FixBefore: "<button aria-label=\"Help\">Press ? for shortcuts</button>",
		FixAfter:  "<button>Press ? for shortcuts</button>",
		WCAG:      "2.5.3 Label in Name",
		Origin:    "Ouroboros L7 (tripped twice)",
	}
}

func (maskedLabel) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || !node.Exposed || !engine.AllowsNameFromContent(node.Role) {
			continue
		}
		visible := engine.ExposedText(s, id)
		if engine.NormalizeName(visible) == "" {
			continue
		}
		applicable = true
		if node.NameFrom != engine.NameFromAriaLabel && node.NameFrom != engine.NameFromAriaLabelledBy {
			continue
		}
		if strings.Contains(engine.NormalizeName(node.Name), engine.NormalizeName(visible)) {
			continue
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "The visible text \"" + visible + "\" isn't part of the accessible name \"" + node.Name + "\", so an agent told to click the text won't find it.",
			Evidence: map[string]any{"visibleText": visible, "accessibleName": node.Name},
		})
	}
	return issues, applicable
}
