package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

// Roles that own their children by design (options in a listbox, cells in a grid) don't count as nesting.
var compositeRoles = map[string]bool{"combobox": true, "listbox": true, "grid": true, "tree": true, "treegrid": true}

type nestedControls struct{}

func (nestedControls) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-105",
		Name:      "Nested controls",
		Category:  engine.CategoryOperable,
		Severity:  engine.SeverityModerate,
		Priority:  engine.PriorityP1,
		Version:   1,
		Modes:     staticOnly,
		Summary:   "A control is inside another control, such as a button inside a link.",
		Why:       "A button inside a card link is two actions in one place. Agents (and browsers) can't tell which one a click means, and the inner control often vanishes from the accessibility tree.",
		Fix:       "Un-nest them: one control per action, side by side.",
		FixBefore: "<a href=\"/items/42\">\n  Item 42 <button>Delete</button>\n</a>",
		FixAfter:  "<a href=\"/items/42\">Item 42</a>\n<button>Delete item 42</button>",
		WCAG:      "4.1.2 Name, Role, Value",
		Origin:    "Baseline",
	}
}

func (nestedControls) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || !nestable(node) || engine.IsHiddenFromEveryone(node) {
			continue
		}
		applicable = true
		outer := -1
		engine.Ancestors(s, id, func(ancestor *engine.Node) bool {
			if compositeRoles[ancestor.Role] || ancestor.Tag == "select" || ancestor.Tag == "datalist" {
				return false
			}
			if nestable(ancestor) {
				outer = ancestor.ID
				return false
			}
			return true
		})
		if outer < 0 {
			continue
		}
		outerNode := &s.Nodes[outer]
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This " + describe(node) + " is inside a " + describe(outerNode) + ", so one click can mean two actions.",
			Evidence: map[string]any{"outerPath": outerNode.Path, "outerRole": outerNode.Role},
		})
	}
	return issues, applicable
}

func nestable(node *engine.Node) bool {
	if node.Tag == "option" || node.Role == "option" || node.Role == "treeitem" || node.Role == "gridcell" {
		return false
	}
	return isControl(node)
}
