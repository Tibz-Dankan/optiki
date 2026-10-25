package rules

import (
	"math"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

var staticAndRendered = []string{engine.ModeStatic, engine.ModeRendered}
var renderedOnly = []string{engine.ModeRendered}
var staticOnly = []string{engine.ModeStatic}

// rootNode is where page-level findings attach: the <html> element.
func rootNode(s *engine.Snapshot) int {
	for id := range s.Nodes {
		if s.Nodes[id].Parent < 0 && s.Nodes[id].Tag != engine.TextTag {
			return id
		}
	}
	return 0
}

func describe(node *engine.Node) string {
	if node.Role != "" && node.Role != "generic" {
		return node.Role
	}
	return "<" + node.Tag + ">"
}

func isControl(node *engine.Node) bool {
	return engine.IsNativeInteractive(node) || engine.IsWidgetRole(node.Role)
}

func roundTo(value float64, places int) float64 {
	factor := math.Pow(10, float64(places))
	return math.Round(value*factor) / factor
}

// exposedTextExcluding is the agent-readable text under id, leaving out one subtree.
func exposedTextExcluding(s *engine.Snapshot, id, excluded int) string {
	var builder strings.Builder
	var walk func(current int)
	walk = func(current int) {
		if current == excluded {
			return
		}
		node := &s.Nodes[current]
		if node.Tag == engine.TextTag {
			builder.WriteString(node.Text)
			return
		}
		if engine.IsHiddenFromEveryone(node) || node.HiddenBy == engine.HiddenByAriaHidden {
			return
		}
		for _, child := range node.Children {
			walk(child)
		}
	}
	walk(id)
	return engine.NormalizeSpace(builder.String())
}

func joinQuoted(values []string) string {
	quoted := make([]string, len(values))
	for index, value := range values {
		quoted[index] = `"` + value + `"`
	}
	return strings.Join(quoted, ", ")
}
