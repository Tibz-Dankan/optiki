package rules

import (
	"sort"
	"strconv"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type lookAlikeControls struct{}

func (lookAlikeControls) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-103",
		Name:      "Look-alike controls",
		Category:  engine.CategoryOperable,
		Severity:  engine.SeveritySerious,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "Two or more controls share a role and a name but may do different things.",
		Why:       "When nine buttons are all called \"Confirm\", an agent following \"click Confirm\" picks one at random. In repeated rows (a list with a Delete button per item) the row gives some context, so it's moderate; elsewhere it's serious. Links with the same name and the same destination are fine.",
		Fix:       "Make each name say what it does to what: \"Delete invoice #42\", or \"Seek to iteration 2\" vs. \"Open iteration 2\".",
		FixBefore: "<button>Iteration 2</button>\n<button>Iteration 2</button>",
		FixAfter:  "<button>Seek to iteration 2</button>\n<button>Open iteration 2</button>",
		WCAG:      "2.4.6 Headings and Labels",
		Origin:    "Ouroboros L5, Timeora (Confirm among 9 buttons)",
	}
}

func (lookAlikeControls) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	groups := map[string][]int{}
	var keys []string
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || !node.Exposed || !engine.ActionRoles[node.Role] || node.Name == "" {
			continue
		}
		applicable = true
		key := node.Role + "\x1f" + engine.NormalizeName(node.Name)
		if _, exists := groups[key]; !exists {
			keys = append(keys, key)
		}
		groups[key] = append(groups[key], id)
	}

	var issues []engine.Issue
	for _, key := range keys {
		members := groups[key]
		if len(members) < 2 || sameDestination(s, members) {
			continue
		}
		severity := engine.SeveritySerious
		inRepeatedRow := allInDistinctRows(s, members)
		if inRepeatedRow {
			severity = engine.SeverityModerate
		}
		for _, member := range members {
			node := &s.Nodes[member]
			peers := []string{}
			for _, other := range members {
				if other != member {
					peers = append(peers, s.Nodes[other].Path)
				}
			}
			issues = append(issues, engine.Issue{
				NodeID:   member,
				Severity: severity,
				Message:  strconv.Itoa(len(members)) + " " + plural(describe(node)) + " are all named \"" + node.Name + "\", so agents can't tell them apart.",
				Evidence: map[string]any{"sharedName": node.Name, "peerPaths": peers, "inRepeatedRow": inRepeatedRow},
			})
		}
	}
	sort.SliceStable(issues, func(i, j int) bool { return issues[i].NodeID < issues[j].NodeID })
	return issues, applicable
}

func sameDestination(s *engine.Snapshot, members []int) bool {
	first := ""
	for index, member := range members {
		node := &s.Nodes[member]
		if node.Role != "link" {
			return false
		}
		href := strings.TrimSpace(node.Attrs["href"])
		if index == 0 {
			first = href
		} else if href != first {
			return false
		}
	}
	return true
}

func allInDistinctRows(s *engine.Snapshot, members []int) bool {
	rows := map[int]bool{}
	for _, member := range members {
		row := -1
		engine.Ancestors(s, member, func(ancestor *engine.Node) bool {
			switch {
			case ancestor.Tag == "li" || ancestor.Tag == "tr" || ancestor.Tag == "article",
				ancestor.Role == "row" || ancestor.Role == "listitem" || ancestor.Role == "article":
				row = ancestor.ID
				return false
			}
			return true
		})
		if row < 0 || rows[row] {
			return false
		}
		rows[row] = true
	}
	return true
}

func plural(word string) string {
	if strings.HasPrefix(word, "<") {
		return word + " elements"
	}
	return word + "s"
}
