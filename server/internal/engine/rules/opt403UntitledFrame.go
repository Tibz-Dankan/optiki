package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type untitledFrame struct{}

func (untitledFrame) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-403",
		Name:      "Untitled frame",
		Category:  engine.CategoryDiscoverable,
		Severity:  engine.SeverityMinor,
		Priority:  engine.PriorityP1,
		Version:   1,
		Modes:     staticOnly,
		Summary:   "An <iframe> has no title.",
		Why:       "A frame without a title gives agents no idea what's inside before they step into it, so they skip it or waste steps exploring it.",
		Fix:       "Add a title that says what the frame contains.",
		FixBefore: "<iframe src=\"https://maps.example.com/embed?office=kampala\"></iframe>",
		FixAfter:  "<iframe src=\"https://maps.example.com/embed?office=kampala\" title=\"Map of the Kampala office\"></iframe>",
		WCAG:      "4.1.2 Name, Role, Value; 2.4.1 Bypass Blocks",
		Origin:    "Baseline",
	}
}

func (untitledFrame) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag != "iframe" || node.Namespace != "" || engine.IsHiddenFromEveryone(node) || node.HiddenBy == engine.HiddenByAriaHidden {
			continue
		}
		applicable = true
		if node.Name != "" {
			continue
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This frame has no title, so agents don't know what's inside before entering it.",
			Evidence: map[string]any{},
		})
	}
	return issues, applicable
}
