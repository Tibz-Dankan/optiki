package rules

import (
	"strconv"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

const minimumFontPx = 12

type tinyMeaningfulText struct{}

func (tinyMeaningfulText) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:           "OPT-204",
		Name:         "Tiny meaningful text",
		Category:     engine.CategoryPerceivable,
		Severity:     engine.SeverityModerate,
		Priority:     engine.PriorityP1,
		Version:      1,
		Modes:        renderedOnly,
		RenderedOnly: true,
		Summary:      "Text in a control, label or heading renders below 12 CSS px.",
		Why:          "Agents that work from screenshots read controls, labels and headings by sight. Below 12px the letters blur into each other, and the agent misreads or skips the control.",
		Fix:          "Raise the size of control, label and heading text to at least 12 CSS px.",
		FixBefore:    "<button style=\"font-size: 10px\">Export</button>",
		FixAfter:     "<button style=\"font-size: 14px\">Export</button>",
		WCAG:         "1.4.4 Resize Text",
		Origin:       "Ouroboros L4",
	}
}

func (tinyMeaningfulText) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || node.FontPx == nil || !node.Exposed || engine.IsHiddenFromEveryone(node) {
			continue
		}
		meaningful := engine.ActionRoles[node.Role] || node.Role == "heading" || node.Tag == "label" || node.Tag == "legend"
		if !meaningful || engine.ExposedText(s, id) == "" {
			continue
		}
		applicable = true
		if *node.FontPx >= minimumFontPx {
			continue
		}
		size := roundTo(*node.FontPx, 1)
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This text renders at " + strconv.FormatFloat(size, 'f', -1, 64) + "px, below the 12px agents need to read it from a screenshot.",
			Evidence: map[string]any{"fontPx": size},
		})
	}
	return issues, applicable
}
