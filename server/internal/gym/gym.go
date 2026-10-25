package gym

import (
	"embed"
	"regexp"
)

//go:embed pages/*.html
var pages embed.FS

var pageIDPattern = regexp.MustCompile(`^[a-z0-9-]{1,64}$`)

type Pair struct {
	ID      string `json:"id"`
	RuleID  string `json:"ruleID"`
	Scene   string `json:"scene"`
	Broken  string `json:"broken"`
	Fixed   string `json:"fixed"`
	Renders bool   `json:"renders"`
}

var pairs = []Pair{
	{ID: "opt-101", RuleID: "OPT-101", Scene: "A seek button inside a role=\"img\" iteration ring"},
	{ID: "opt-102", RuleID: "OPT-102", Scene: "An icon-only toolbar button"},
	{ID: "opt-103", RuleID: "OPT-103", Scene: "\"Seek to iteration 2\" vs. \"Open iteration 2\" look-alikes"},
	{ID: "opt-104", RuleID: "OPT-104", Scene: "A <div> \"Save draft\" button"},
	{ID: "opt-105", RuleID: "OPT-105", Scene: "A Remove button inside a card link"},
	{ID: "opt-106", RuleID: "OPT-106", Scene: "A placeholder-only email field"},
	{ID: "opt-107", RuleID: "OPT-107", Scene: "A Delete button that calls confirm()"},
	{ID: "opt-201", RuleID: "OPT-201", Scene: "\"Press ? for shortcuts\" masked by aria-label=\"Help\""},
	{ID: "opt-202", RuleID: "OPT-202", Scene: "An SVG-only uptime card"},
	{ID: "opt-203", RuleID: "OPT-203", Scene: "An image link without alt"},
	{ID: "opt-204", RuleID: "OPT-204", Scene: "A 10px Export button", Renders: true},
	{ID: "opt-205", RuleID: "OPT-205", Scene: "aria-describedby pointing at a missing hint"},
	{ID: "opt-301", RuleID: "OPT-301", Scene: "A Start button that fades in after 2 s", Renders: true},
	{ID: "opt-302", RuleID: "OPT-302", Scene: "A promo block that pushes the article down", Renders: true},
	{ID: "opt-401", RuleID: "OPT-401", Scene: "No <title>, <h1> or <main>"},
	{ID: "opt-402", RuleID: "OPT-402", Scene: "An unnamed \"Delete project?\" dialog"},
	{ID: "opt-403", RuleID: "OPT-403", Scene: "A map iframe without a title"},
}

const (
	KitchenSink = "kitchen-sink"
	Perfect     = "perfect"
)

// Page returns one fixture's HTML by id, e.g. "opt-101-broken" or "kitchen-sink".
func Page(id string) (string, bool) {
	if !pageIDPattern.MatchString(id) {
		return "", false
	}
	content, err := pages.ReadFile("pages/" + id + ".html")
	if err != nil {
		return "", false
	}
	return string(content), true
}

// List returns every broken/fixed pair in catalog order.
func List() []Pair {
	list := make([]Pair, len(pairs))
	for index, pair := range pairs {
		pair.Broken = pair.ID + "-broken"
		pair.Fixed = pair.ID + "-fixed"
		list[index] = pair
	}
	return list
}

// Route is the path a fixture is served at, which is also the route its scans are recorded under.
func Route(id string) string {
	return "/gym/pages/" + id + ".html"
}
