package engine

import "strings"

// Inline elements join their text to their neighbours without a space.
var inlineTags = setOf(
	"a", "abbr", "b", "bdi", "bdo", "cite", "code", "data", "dfn", "em", "i", "kbd", "label", "mark", "q",
	"s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var",
)

type nameComputer struct {
	s      *Snapshot
	ids    map[string][]int
	labels map[string][]int
}

// name computes the static accessible-name subset, in order: aria-labelledby, aria-label, a native source,
// content (for roles that allow it), title, then placeholder (which OPT-106 flags).
func (c *nameComputer) name(id int) (string, string) {
	node := &c.s.Nodes[id]

	if name := c.labelledBy(node); name != "" {
		return name, NameFromAriaLabelledBy
	}
	if label := NormalizeSpace(node.Attrs["aria-label"]); label != "" {
		return label, NameFromAriaLabel
	}
	if native := NormalizeSpace(c.native(id)); native != "" {
		return native, NameFromNative
	}
	if nameFromContentRoles[node.Role] {
		if content := NormalizeSpace(c.content(id)); content != "" {
			return content, NameFromContent
		}
	}
	if title := NormalizeSpace(node.Attrs["title"]); title != "" {
		return title, NameFromTitle
	}
	if node.Tag == "input" || node.Tag == "textarea" {
		if placeholder := NormalizeSpace(node.Attrs["placeholder"]); placeholder != "" {
			return placeholder, NameFromPlaceholder
		}
	}
	return "", ""
}

func (c *nameComputer) labelledBy(node *Node) string {
	var parts []string
	for _, ref := range strings.Fields(node.Attrs["aria-labelledby"]) {
		targets := c.ids[ref]
		if len(targets) == 0 {
			continue
		}
		if text := NormalizeSpace(c.alternative(targets[0], true, true)); text != "" {
			parts = append(parts, text)
		}
	}
	return strings.Join(parts, " ")
}

func (c *nameComputer) native(id int) string {
	node := &c.s.Nodes[id]
	if node.Namespace == "svg" {
		if node.Tag == "svg" {
			return c.childText(id, "title", "svg")
		}
		return ""
	}

	switch node.Tag {
	case "input":
		switch strings.ToLower(node.Attrs["type"]) {
		case "button":
			return node.Attrs["value"]
		case "submit":
			if value, ok := node.Attrs["value"]; ok {
				return value
			}
			return "Submit"
		case "reset":
			if value, ok := node.Attrs["value"]; ok {
				return value
			}
			return "Reset"
		case "image":
			return node.Attrs["alt"]
		}
		return c.fieldLabel(id)
	case "select", "textarea":
		return c.fieldLabel(id)
	case "img", "area":
		return node.Attrs["alt"]
	case "fieldset":
		return c.childText(id, "legend", "")
	case "table":
		return c.childText(id, "caption", "")
	case "figure":
		return c.childText(id, "figcaption", "")
	}
	return ""
}

func (c *nameComputer) fieldLabel(id int) string {
	node := &c.s.Nodes[id]
	var parts []string
	if fieldID := strings.TrimSpace(node.Attrs["id"]); fieldID != "" {
		for _, label := range c.labels[fieldID] {
			parts = append(parts, c.labelText(label, id))
		}
	}
	Ancestors(c.s, id, func(ancestor *Node) bool {
		if ancestor.Tag == "label" && ancestor.Namespace == "" {
			parts = append(parts, c.labelText(ancestor.ID, id))
			return false
		}
		return true
	})
	return NormalizeSpace(strings.Join(parts, " "))
}

// labelText is a label's text without the text of the controls inside it.
func (c *nameComputer) labelText(labelID, fieldID int) string {
	var builder strings.Builder
	var walk func(id int)
	walk = func(id int) {
		node := &c.s.Nodes[id]
		if id == fieldID {
			return
		}
		if node.Tag == TextTag {
			builder.WriteString(node.Text)
			return
		}
		if IsHiddenFromEveryone(node) || node.Tag == "input" || node.Tag == "select" || node.Tag == "textarea" {
			return
		}
		for _, child := range node.Children {
			walk(child)
		}
	}
	walk(labelID)
	return builder.String()
}

func (c *nameComputer) childText(id int, tag, namespace string) string {
	for _, child := range c.s.Nodes[id].Children {
		node := &c.s.Nodes[child]
		if node.Tag == tag && node.Namespace == namespace {
			return TextContent(c.s, child)
		}
	}
	return ""
}

func (c *nameComputer) content(id int) string {
	var builder strings.Builder
	for _, child := range c.s.Nodes[id].Children {
		builder.WriteString(c.alternative(child, false, false))
	}
	return builder.String()
}

// alternative is a node's text alternative while computing another node's name.
// A node referenced directly by aria-labelledby counts even when hidden.
func (c *nameComputer) alternative(id int, referenced, inLabelledBy bool) string {
	node := &c.s.Nodes[id]
	if node.Tag == TextTag {
		return node.Text
	}
	if !referenced && (IsHiddenFromEveryone(node) || node.HiddenBy == HiddenByAriaHidden) {
		return ""
	}
	if !inLabelledBy {
		if name := c.labelledBy(node); name != "" {
			return c.pad(node, name)
		}
	}
	if label := NormalizeSpace(node.Attrs["aria-label"]); label != "" {
		return c.pad(node, label)
	}
	if native := NormalizeSpace(c.native(id)); native != "" {
		return c.pad(node, native)
	}
	if node.Tag == "img" {
		return ""
	}
	var builder strings.Builder
	for _, child := range node.Children {
		builder.WriteString(c.alternative(child, false, inLabelledBy))
	}
	if content := builder.String(); NormalizeSpace(content) != "" {
		return c.pad(node, content)
	}
	if title := NormalizeSpace(node.Attrs["title"]); title != "" {
		return c.pad(node, title)
	}
	return ""
}

func (c *nameComputer) pad(node *Node, text string) string {
	if inlineTags[node.Tag] && node.Namespace == "" {
		return text
	}
	return " " + text + " "
}
