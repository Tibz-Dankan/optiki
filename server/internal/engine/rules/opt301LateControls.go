package rules

import (
	"strconv"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

const firstLookMs = 1000

type lateControls struct{}

func (lateControls) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:           "OPT-301",
		Name:         "Late controls",
		Category:     engine.CategoryStable,
		Severity:     engine.SeveritySerious,
		Priority:     engine.PriorityP1,
		Version:      1,
		Modes:        renderedOnly,
		RenderedOnly: true,
		Summary:      "A control in the final page wasn't visible and enabled at the 1,000 ms sample.",
		Why:          "Agents look at a page soon after it loads. A button that fades in after a two-second entrance animation isn't there at that first look, so the agent reports it missing or clicks something else.",
		Fix:          "Cap entrance animations well under a second, and never gate interactivity on them.",
		FixBefore:    ".start { opacity: 0; animation: appear .3s 2s forwards; }",
		FixAfter:     ".start { animation: appear .2s; }",
		WCAG:         "",
		Origin:       "Ouroboros L6",
	}
}

func (lateControls) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || !node.Interactive || !node.Exposed || node.FirstSeenMs == nil || engine.IsHiddenFromEveryone(node) {
			continue
		}
		applicable = true
		if *node.FirstSeenMs <= firstLookMs {
			continue
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This " + describe(node) + " first became visible at " + strconv.Itoa(*node.FirstSeenMs) + " ms, after an agent's first look at 1,000 ms.",
			Evidence: map[string]any{"firstSeenMs": *node.FirstSeenMs},
		})
	}
	return issues, applicable
}
