package rules

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type contentOnlyGraphic struct{}

func (contentOnlyGraphic) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-202",
		Name:      "Content-only graphic",
		Category:  engine.CategoryPerceivable,
		Severity:  engine.SeveritySerious,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "An SVG with <text>, or a <canvas>, carries information but is hidden or has no text equivalent.",
		Why:       "Numbers drawn inside an SVG or a canvas reach people but not the accessibility tree: the chart says 98.2% uptime, the tree says nothing. Agents checking the value come back empty-handed.",
		Fix:       "Give the graphic a <title> or aria-label with the same information, or put a screen-reader-only text block next to it.",
		FixBefore: "<svg role=\"img\" viewBox=\"0 0 120 40\">\n  <text x=\"0\" y=\"30\">98.2%</text>\n</svg>",
		FixAfter:  "<svg role=\"img\" aria-label=\"Uptime 98.2%\" viewBox=\"0 0 120 40\">\n  <text x=\"0\" y=\"30\">98.2%</text>\n</svg>",
		WCAG:      "1.1.1 Non-text Content",
		Origin:    "Ouroboros L8",
	}
}

func (contentOnlyGraphic) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || engine.IsHiddenFromEveryone(node) {
			continue
		}
		switch {
		case node.Tag == "svg" && node.Namespace == "svg":
			text := svgText(s, id)
			if text == "" {
				continue
			}
			applicable = true
			if svgTextIsReadable(s, node, text) || hasTextEquivalent(s, id, text) {
				continue
			}
			issues = append(issues, engine.Issue{
				NodeID:   id,
				Message:  "This SVG shows \"" + text + "\" but gives agents no text for it.",
				Evidence: map[string]any{"graphic": "SVG", "textContent": text},
			})
		case node.Tag == "canvas" && node.Namespace == "":
			if node.HiddenBy == engine.HiddenByAriaHidden {
				continue
			}
			applicable = true
			if node.Name != "" || engine.TextContent(s, id) != "" {
				continue
			}
			issues = append(issues, engine.Issue{
				NodeID:   id,
				Message:  "This canvas has no text equivalent, so agents get nothing from what it draws.",
				Evidence: map[string]any{"graphic": "CANVAS", "textContent": ""},
			})
		}
	}
	return issues, applicable
}

// svgText is the text drawn by <text> elements inside the SVG.
func svgText(s *engine.Snapshot, id int) string {
	var parts []string
	var walk func(current int)
	walk = func(current int) {
		for _, child := range s.Nodes[current].Children {
			node := &s.Nodes[child]
			if node.Tag == "text" && node.Namespace == "svg" {
				if text := engine.TextContent(s, child); text != "" {
					parts = append(parts, text)
				}
				continue
			}
			if node.Tag != engine.TextTag {
				walk(child)
			}
		}
	}
	walk(id)
	return strings.Join(parts, " ")
}

// svgTextIsReadable: an exposed SVG without an image role leaves its <text> in the tree, a named one
// replaces it, and one inside a control whose name already carries the text is covered by that name.
func svgTextIsReadable(s *engine.Snapshot, node *engine.Node, text string) bool {
	if node.Exposed && (node.Name != "" || node.Role != "img") {
		return true
	}
	switch node.HiddenBy {
	case engine.HiddenByRoleImg, engine.HiddenByPresentationalChildren:
		owner := &s.Nodes[node.HiddenByNode]
		return strings.Contains(engine.NormalizeName(owner.Name), engine.NormalizeName(text))
	}
	return false
}

func hasTextEquivalent(s *engine.Snapshot, id int, text string) bool {
	parent := s.Nodes[id].Parent
	if parent < 0 {
		return false
	}
	nearby := engine.NormalizeName(exposedTextExcluding(s, parent, id))
	return nearby != "" && strings.Contains(nearby, engine.NormalizeName(text))
}
