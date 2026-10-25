package engine

import (
	"strings"
	"unicode"
)

// NormalizeSpace collapses runs of whitespace into one space and trims the ends.
func NormalizeSpace(value string) string {
	return strings.Join(strings.Fields(value), " ")
}

// NormalizeName lowercases a name and reduces punctuation to spaces, for comparing names.
func NormalizeName(value string) string {
	var builder strings.Builder
	for _, r := range strings.ToLower(value) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(r)
		} else {
			builder.WriteRune(' ')
		}
	}
	return NormalizeSpace(builder.String())
}

// TextContent is the node's descendant text in document order, skipping parts hidden from everyone.
func TextContent(s *Snapshot, id int) string {
	var builder strings.Builder
	collectText(s, id, &builder, false)
	return NormalizeSpace(builder.String())
}

// ExposedText is the descendant text an agent can read: it also skips aria-hidden subtrees.
func ExposedText(s *Snapshot, id int) string {
	var builder strings.Builder
	collectText(s, id, &builder, true)
	return NormalizeSpace(builder.String())
}

func collectText(s *Snapshot, id int, builder *strings.Builder, exposedOnly bool) {
	node := &s.Nodes[id]
	if node.Tag == TextTag {
		builder.WriteString(node.Text)
		return
	}
	if IsHiddenFromEveryone(node) {
		return
	}
	if exposedOnly && node.HiddenBy == HiddenByAriaHidden {
		return
	}
	for _, child := range node.Children {
		collectText(s, child, builder, exposedOnly)
	}
}

// Ancestors calls visit for each ancestor of id, nearest first, until visit returns false.
func Ancestors(s *Snapshot, id int, visit func(ancestor *Node) bool) {
	for parent := s.Nodes[id].Parent; parent >= 0; parent = s.Nodes[parent].Parent {
		if !visit(&s.Nodes[parent]) {
			return
		}
	}
}

// IsElement reports whether the node is an element rather than text.
func IsElement(node *Node) bool {
	return node.Tag != TextTag
}

// IsHiddenFromEveryone reports nodes nobody can see — not a legibility problem, just absent.
func IsHiddenFromEveryone(node *Node) bool {
	switch node.HiddenBy {
	case HiddenByHiddenAttr, HiddenByDisplayNone, HiddenByNotRendered:
		return true
	}
	return node.Visible != nil && !*node.Visible
}
