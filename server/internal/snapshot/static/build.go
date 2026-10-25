package static

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
	"golang.org/x/net/html"
)

// Elements whose content is raw text or a separate document, not part of this page's tree.
var opaqueTags = map[string]bool{"script": true, "style": true, "noscript": true, "template": true, "iframe": true}

// Build parses HTML into an annotated static snapshot.
func Build(source, url, route string) engine.Snapshot {
	snapshot := Parse(source, url, route)
	engine.Annotate(&snapshot)
	return snapshot
}

// Parse turns HTML into a snapshot's nodes in document order, without annotating them.
func Parse(source, url, route string) engine.Snapshot {
	snapshot := engine.Snapshot{URL: url, Route: route, Mode: engine.ModeStatic}
	document, err := html.Parse(strings.NewReader(source))
	if err != nil {
		return snapshot
	}

	var walk func(node *html.Node, parent int)
	walk = func(node *html.Node, parent int) {
		switch node.Type {
		case html.DocumentNode:
			for child := node.FirstChild; child != nil; child = child.NextSibling {
				walk(child, parent)
			}
		case html.TextNode:
			if parent < 0 {
				return
			}
			appendNode(&snapshot, engine.Node{Tag: engine.TextTag, Text: node.Data}, parent)
		case html.ElementNode:
			attrs := make(map[string]string, len(node.Attr))
			keys := make([]string, 0, len(node.Attr))
			for _, attr := range node.Attr {
				key := strings.ToLower(attr.Key)
				if attr.Namespace != "" {
					key = attr.Namespace + ":" + key
				}
				if _, exists := attrs[key]; exists {
					continue
				}
				attrs[key] = attr.Val
				keys = append(keys, key)
			}
			id := appendNode(&snapshot, engine.Node{
				Tag:       strings.ToLower(node.Data),
				Namespace: node.Namespace,
				Attrs:     attrs,
				AttrKeys:  keys,
			}, parent)
			if node.Namespace == "" && opaqueTags[strings.ToLower(node.Data)] {
				return
			}
			for child := node.FirstChild; child != nil; child = child.NextSibling {
				walk(child, id)
			}
		}
	}
	walk(document, -1)

	for id := range snapshot.Nodes {
		node := &snapshot.Nodes[id]
		if node.Tag == "html" && node.Parent < 0 {
			snapshot.Lang = strings.TrimSpace(node.Attrs["lang"])
		}
		if node.Tag == "title" && node.Namespace == "" && snapshot.Title == "" {
			var builder strings.Builder
			for _, child := range node.Children {
				builder.WriteString(snapshot.Nodes[child].Text)
			}
			snapshot.Title = engine.NormalizeSpace(builder.String())
		}
	}
	return snapshot
}

func appendNode(snapshot *engine.Snapshot, node engine.Node, parent int) int {
	id := len(snapshot.Nodes)
	node.ID = id
	node.Parent = parent
	snapshot.Nodes = append(snapshot.Nodes, node)
	if parent >= 0 {
		snapshot.Nodes[parent].Children = append(snapshot.Nodes[parent].Children, id)
	}
	return id
}
