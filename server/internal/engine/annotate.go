package engine

import (
	"regexp"
	"strconv"
	"strings"
)

var displayNonePattern = regexp.MustCompile(`(?i)(^|;)\s*(display\s*:\s*none|visibility\s*:\s*hidden)\s*(!important)?\s*(;|$)`)
var cssIdentPattern = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_-]*$`)

// Annotate computes, in document order, every node's exposure, role, interactivity, accessible name,
// own text and stable selector path. Nodes must be in document order with parents before children.
func Annotate(s *Snapshot) {
	for id := range s.Nodes {
		node := &s.Nodes[id]
		node.DocumentOrder = id
		node.HiddenBy, node.HiddenByNode = hiddenBy(s, id)
		if node.Tag == TextTag {
			node.Exposed = node.HiddenBy == ""
			continue
		}
		node.Role = resolveRole(s, node)
		node.Interactive = isInteractive(node)
		node.Exposed = node.HiddenBy == "" && node.Role != "none" && node.Role != "presentation"
	}

	ids := indexIDs(s)
	labels := indexLabels(s)
	computer := nameComputer{s: s, ids: ids, labels: labels}
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == TextTag {
			continue
		}
		node.Text = ownText(s, node)
		node.Name, node.NameFrom = computer.name(id)
		node.Path = selectorPath(s, id)
	}
}

func hiddenBy(s *Snapshot, id int) (string, int) {
	node := &s.Nodes[id]
	if node.Parent >= 0 {
		parent := &s.Nodes[node.Parent]
		switch parent.HiddenBy {
		case HiddenByHiddenAttr, HiddenByDisplayNone, HiddenByNotRendered, HiddenByAriaHidden:
			return parent.HiddenBy, parent.HiddenByNode
		}
		if node.Tag != TextTag {
			if reason, owner := selfHidden(node, id); reason != "" && reason != HiddenByAriaHidden {
				return reason, owner
			}
			if parent.Tag == "details" && !hasAttr(parent, "open") && node.Tag != "summary" {
				return HiddenByNotRendered, node.Parent
			}
		}
		switch parent.HiddenBy {
		case HiddenByRoleImg, HiddenByPresentationalChildren:
			if reason, owner := selfHidden(node, id); reason == HiddenByAriaHidden {
				return reason, owner
			}
			return parent.HiddenBy, parent.HiddenByNode
		}
		if presentationalChildrenRoles[parent.Role] && parent.Exposed {
			if reason, owner := selfHidden(node, id); reason == HiddenByAriaHidden {
				return reason, owner
			}
			if parent.Role == "img" {
				return HiddenByRoleImg, node.Parent
			}
			return HiddenByPresentationalChildren, node.Parent
		}
	}
	if node.Tag == TextTag {
		return "", -1
	}
	return selfHidden(node, id)
}

func selfHidden(node *Node, id int) (string, int) {
	if node.Namespace == "" && notRenderedTags[node.Tag] {
		return HiddenByNotRendered, id
	}
	if node.Namespace == "" && node.Tag == "input" && strings.EqualFold(node.Attrs["type"], "hidden") {
		return HiddenByNotRendered, id
	}
	if node.Namespace == "" && node.Tag == "dialog" && !hasAttr(node, "open") {
		return HiddenByNotRendered, id
	}
	if hasAttr(node, "hidden") {
		return HiddenByHiddenAttr, id
	}
	if displayNonePattern.MatchString(node.Attrs["style"]) {
		return HiddenByDisplayNone, id
	}
	if node.Visible != nil && !*node.Visible && node.Box != nil && node.Box.Width == 0 && node.Box.Height == 0 {
		return HiddenByDisplayNone, id
	}
	if strings.EqualFold(strings.TrimSpace(node.Attrs["aria-hidden"]), "true") {
		return HiddenByAriaHidden, id
	}
	return "", -1
}

func resolveRole(s *Snapshot, node *Node) string {
	implicit := implicitRole(s, node)
	role := explicitRole(node)
	if role == "" {
		return implicit
	}
	if role == "none" || role == "presentation" {
		// A focusable element keeps its native role: the presentation hint is ignored.
		if IsNativeInteractive(node) {
			return implicit
		}
		if index, ok := TabIndex(node); ok && index >= -1 {
			return implicit
		}
	}
	return role
}

func isInteractive(node *Node) bool {
	if IsNativeInteractive(node) || widgetRoles[node.Role] {
		return true
	}
	if index, ok := TabIndex(node); ok && index >= 0 {
		return true
	}
	if editable, ok := node.Attrs["contenteditable"]; ok && !strings.EqualFold(editable, "false") {
		return true
	}
	return false
}

func ownText(s *Snapshot, node *Node) string {
	var builder strings.Builder
	for _, child := range node.Children {
		if s.Nodes[child].Tag == TextTag {
			builder.WriteString(s.Nodes[child].Text)
		}
	}
	return NormalizeSpace(builder.String())
}

func indexIDs(s *Snapshot) map[string][]int {
	ids := make(map[string][]int)
	for id := range s.Nodes {
		if value := strings.TrimSpace(s.Nodes[id].Attrs["id"]); value != "" && s.Nodes[id].Tag != TextTag {
			ids[value] = append(ids[value], id)
		}
	}
	return ids
}

func indexLabels(s *Snapshot) map[string][]int {
	labels := make(map[string][]int)
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == "label" && node.Namespace == "" {
			if target := strings.TrimSpace(node.Attrs["for"]); target != "" {
				labels[target] = append(labels[target], id)
			}
		}
	}
	return labels
}

// IDIndex returns every id attribute and the nodes carrying it, for rules that check references.
func IDIndex(s *Snapshot) map[string][]int {
	return indexIDs(s)
}

func selectorPath(s *Snapshot, id int) string {
	var segments []string
	for current := id; current >= 0; current = s.Nodes[current].Parent {
		node := &s.Nodes[current]
		if value := strings.TrimSpace(node.Attrs["id"]); value != "" {
			segments = append(segments, idSelector(value))
			break
		}
		segment := node.Tag
		if node.Parent >= 0 {
			position, total := 0, 0
			for _, sibling := range s.Nodes[node.Parent].Children {
				if s.Nodes[sibling].Tag == node.Tag {
					total++
					if sibling == current {
						position = total
					}
				}
			}
			if total > 1 {
				segment += ":nth-of-type(" + strconv.Itoa(position) + ")"
			}
		}
		segments = append(segments, segment)
	}
	for left, right := 0, len(segments)-1; left < right; left, right = left+1, right-1 {
		segments[left], segments[right] = segments[right], segments[left]
	}
	return strings.Join(segments, " > ")
}

func idSelector(value string) string {
	if cssIdentPattern.MatchString(value) {
		return "#" + value
	}
	return `[id="` + strings.ReplaceAll(value, `"`, `\"`) + `"]`
}
