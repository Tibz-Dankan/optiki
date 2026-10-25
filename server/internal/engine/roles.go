package engine

import (
	"strconv"
	"strings"
)

var knownRoles = setOf(
	"alert", "alertdialog", "application", "article", "banner", "blockquote", "button", "caption", "cell",
	"checkbox", "code", "columnheader", "combobox", "complementary", "contentinfo", "definition", "deletion",
	"dialog", "directory", "document", "emphasis", "feed", "figure", "form", "generic", "grid", "gridcell",
	"group", "heading", "img", "image", "insertion", "link", "list", "listbox", "listitem", "log", "main",
	"marquee", "math", "menu", "menubar", "menuitem", "menuitemcheckbox", "menuitemradio", "meter",
	"navigation", "none", "note", "option", "paragraph", "presentation", "progressbar", "radio", "radiogroup",
	"region", "row", "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator", "slider",
	"spinbutton", "status", "strong", "subscript", "superscript", "switch", "tab", "table", "tablist",
	"tabpanel", "term", "textbox", "time", "timer", "toolbar", "tooltip", "tree", "treegrid", "treeitem",
)

// Roles an agent can operate.
var widgetRoles = setOf(
	"button", "checkbox", "combobox", "gridcell", "link", "listbox", "menuitem", "menuitemcheckbox",
	"menuitemradio", "option", "radio", "scrollbar", "searchbox", "slider", "spinbutton", "switch", "tab",
	"textbox", "treeitem",
)

// Roles whose descendants are presentational: anything inside them leaves the accessibility tree.
var presentationalChildrenRoles = setOf(
	"button", "checkbox", "img", "image", "math", "menuitemcheckbox", "menuitemradio", "meter", "option",
	"progressbar", "radio", "scrollbar", "separator", "slider", "switch", "tab",
)

// Roles whose accessible name may come from their content.
var nameFromContentRoles = setOf(
	"button", "cell", "checkbox", "columnheader", "gridcell", "heading", "link", "menuitem",
	"menuitemcheckbox", "menuitemradio", "option", "radio", "row", "rowheader", "switch", "tab", "tooltip",
	"treeitem",
)

// FieldRoles are form fields: OPT-106 checks their labels.
var FieldRoles = setOf(
	"checkbox", "combobox", "listbox", "radio", "searchbox", "slider", "spinbutton", "switch", "textbox",
)

// ActionRoles are controls that trigger an action or navigation: OPT-102 and OPT-103 check their names.
var ActionRoles = setOf(
	"button", "link", "menuitem", "menuitemcheckbox", "menuitemradio", "tab", "treeitem",
)

var nativeInteractiveTags = setOf("a", "button", "input", "select", "textarea", "summary", "option", "area")

var notRenderedTags = setOf("head", "script", "style", "template", "noscript", "meta", "link", "title", "base")

func setOf(values ...string) map[string]bool {
	set := make(map[string]bool, len(values))
	for _, value := range values {
		set[value] = true
	}
	return set
}

func IsWidgetRole(role string) bool {
	return widgetRoles[role]
}

// AllowsNameFromContent reports roles whose visible content is their name unless something overrides it.
func AllowsNameFromContent(role string) bool {
	return nameFromContentRoles[role]
}

// explicitRole returns the first valid token of the role attribute.
func explicitRole(node *Node) string {
	for _, token := range strings.Fields(strings.ToLower(node.Attrs["role"])) {
		if knownRoles[token] {
			if token == "image" {
				return "img"
			}
			return token
		}
	}
	return ""
}

func implicitRole(s *Snapshot, node *Node) string {
	if node.Namespace == "svg" {
		switch node.Tag {
		case "svg":
			return "graphics-document"
		case "a":
			if hasAttr(node, "href") || hasAttr(node, "xlink:href") {
				return "link"
			}
		}
		return ""
	}

	switch node.Tag {
	case "a", "area":
		if hasAttr(node, "href") {
			return "link"
		}
		return "generic"
	case "button", "summary":
		return "button"
	case "input":
		return inputRole(node)
	case "select":
		if hasAttr(node, "multiple") {
			return "listbox"
		}
		if size, err := strconv.Atoi(node.Attrs["size"]); err == nil && size > 1 {
			return "listbox"
		}
		return "combobox"
	case "textarea":
		return "textbox"
	case "option":
		return "option"
	case "img":
		if alt, ok := node.Attrs["alt"]; ok && strings.TrimSpace(alt) == "" {
			return "presentation"
		}
		return "img"
	case "h1", "h2", "h3", "h4", "h5", "h6":
		return "heading"
	case "main":
		return "main"
	case "nav":
		return "navigation"
	case "aside":
		return "complementary"
	case "header":
		if !hasSectioningAncestor(s, node) {
			return "banner"
		}
		return "generic"
	case "footer":
		if !hasSectioningAncestor(s, node) {
			return "contentinfo"
		}
		return "generic"
	case "section":
		if hasAttr(node, "aria-label") || hasAttr(node, "aria-labelledby") {
			return "region"
		}
		return "generic"
	case "form":
		return "form"
	case "article":
		return "article"
	case "dialog":
		return "dialog"
	case "ul", "ol", "menu":
		return "list"
	case "li":
		return "listitem"
	case "table":
		return "table"
	case "tr":
		return "row"
	case "td":
		return "cell"
	case "th":
		return "columnheader"
	case "fieldset":
		return "group"
	case "figure":
		return "figure"
	case "p":
		return "paragraph"
	case "iframe":
		return "iframe"
	case "canvas":
		return "canvas"
	case "hr":
		return "separator"
	case "progress":
		return "progressbar"
	case "meter":
		return "meter"
	case "label", "legend", "caption", "figcaption":
		return ""
	case "div", "span", "b", "i", "em", "strong", "small", "body", "html":
		return "generic"
	}
	return ""
}

func inputRole(node *Node) string {
	inputType := strings.ToLower(strings.TrimSpace(node.Attrs["type"]))
	switch inputType {
	case "hidden":
		return "none"
	case "button", "submit", "reset", "image", "file":
		return "button"
	case "checkbox":
		return "checkbox"
	case "radio":
		return "radio"
	case "range":
		return "slider"
	case "number":
		return "spinbutton"
	case "search":
		if hasAttr(node, "list") {
			return "combobox"
		}
		return "searchbox"
	}
	if hasAttr(node, "list") {
		return "combobox"
	}
	return "textbox"
}

func hasSectioningAncestor(s *Snapshot, node *Node) bool {
	for parent := node.Parent; parent >= 0; parent = s.Nodes[parent].Parent {
		switch s.Nodes[parent].Tag {
		case "article", "aside", "main", "nav", "section":
			return true
		}
	}
	return false
}

func hasAttr(node *Node, name string) bool {
	_, ok := node.Attrs[name]
	return ok
}

// IsNativeInteractive reports whether the element is a control by its tag alone.
func IsNativeInteractive(node *Node) bool {
	if node.Namespace != "" || !nativeInteractiveTags[node.Tag] {
		return false
	}
	switch node.Tag {
	case "a", "area":
		return hasAttr(node, "href")
	case "input":
		return strings.ToLower(node.Attrs["type"]) != "hidden"
	}
	return true
}

// TabIndex returns the parsed tabindex and whether one was set.
func TabIndex(node *Node) (int, bool) {
	value, ok := node.Attrs["tabindex"]
	if !ok {
		return 0, false
	}
	index, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return 0, false
	}
	return index, true
}
