package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
)

var clickHandlers = []string{"onclick", "ondblclick", "onmousedown", "onmouseup", "onpointerdown", "onpointerup", "ontouchstart", "ontouchend"}

// Elements that legitimately carry handlers or a pointer cursor without being controls themselves.
var clickExemptTags = map[string]bool{"html": true, "body": true, "label": true, "option": true, "summary": true}

type clickableNonControl struct{}

func (clickableNonControl) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-104",
		Name:      "Clickable non-control",
		Category:  engine.CategoryOperable,
		Severity:  engine.SeveritySerious,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "Something is clickable but isn't a control: a click handler or tabindex on a plain element, an <a> without href, or (rendered) a pointer cursor on a non-control.",
		Why:       "A <div> with an onclick handler looks like a button but isn't one in the accessibility tree. Agents looking for a button called \"Save\" don't find it, and keyboard users can't reach it.",
		Fix:       "Use <button> or <a href>. If you really can't, give the element a role, tabindex=\"0\" and a keyboard handler.",
		FixBefore: "<div class=\"btn\" onclick=\"save()\">Save</div>",
		FixAfter:  "<button type=\"button\" onclick=\"save()\">Save</button>",
		WCAG:      "4.1.2 Name, Role, Value; 2.1.1 Keyboard",
		Origin:    "Agent-failure",
	}
}

func (clickableNonControl) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || clickExemptTags[node.Tag] || engine.IsHiddenFromEveryone(node) || isControl(node) {
			continue
		}

		trigger, message := "", ""
		if handler := firstClickHandler(node); handler != "" {
			trigger = "ONCLICK"
			message = "This " + describe(node) + " has an " + handler + " handler but isn't a control, so agents can't find it as one."
		} else if index, ok := engine.TabIndex(node); ok && index >= 0 && (node.Role == "" || node.Role == "generic" || node.Role == "paragraph") && node.Attrs["aria-label"] == "" {
			trigger = "TABINDEX"
			message = "This " + describe(node) + " is focusable (tabindex=\"" + node.Attrs["tabindex"] + "\") but has no control role."
		} else if node.Tag == "a" && node.Namespace == "" && node.Attrs["role"] == "" && engine.TextContent(s, id) != "" {
			trigger = "ANCHOR_WITHOUT_HREF"
			message = "This <a> has no href, so it isn't a link to agents or keyboards."
		} else if pointerWithoutControl(s, id) {
			trigger = "CURSOR_POINTER"
			message = "This " + describe(node) + " shows a pointer cursor but isn't a control, so agents don't know it's clickable."
		}
		if trigger == "" {
			continue
		}
		issues = append(issues, engine.Issue{NodeID: id, Message: message, Evidence: map[string]any{"trigger": trigger}})
	}
	return issues, true
}

func firstClickHandler(node *engine.Node) string {
	for _, handler := range clickHandlers {
		if _, ok := node.Attrs[handler]; ok {
			return handler
		}
	}
	return ""
}

// pointerWithoutControl finds the element that sets cursor:pointer itself (not by inheritance), outside
// any control, with no control inside it.
func pointerWithoutControl(s *engine.Snapshot, id int) bool {
	node := &s.Nodes[id]
	if node.Cursor == nil || *node.Cursor != "pointer" || engine.ExposedText(s, id) == "" {
		return false
	}
	if node.Parent >= 0 {
		if parentCursor := s.Nodes[node.Parent].Cursor; parentCursor != nil && *parentCursor == "pointer" {
			return false
		}
	}
	insideControl := false
	engine.Ancestors(s, id, func(ancestor *engine.Node) bool {
		if isControl(ancestor) || ancestor.Tag == "label" {
			insideControl = true
			return false
		}
		return true
	})
	if insideControl {
		return false
	}
	return !hasControlDescendant(s, id)
}

func hasControlDescendant(s *engine.Snapshot, id int) bool {
	for _, child := range s.Nodes[id].Children {
		node := &s.Nodes[child]
		if node.Tag == engine.TextTag {
			continue
		}
		if isControl(node) || hasControlDescendant(s, child) {
			return true
		}
	}
	return false
}
