package rules

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

type missingPageAnchors struct{}

func (missingPageAnchors) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-401",
		Name:      "Missing page anchors",
		Category:  engine.CategoryDiscoverable,
		Severity:  engine.SeverityModerate,
		Priority:  engine.PriorityP0,
		Version:   1,
		Modes:     staticOnly,
		Summary:   "The page has no <title>, no <h1>, or no main landmark.",
		Why:       "A title, one h1 and a main landmark are how an agent confirms it landed on the right page and finds where the content starts. Without them it reads navigation and footers as content.",
		Fix:       "Add a <title>, one <h1>, and wrap the content in <main>.",
		FixBefore: "<body>\n  <div class=\"content\">…</div>\n</body>",
		FixAfter:  "<head><title>Invoices · Acme</title></head>\n<body>\n  <main>\n    <h1>Invoices</h1>\n    …\n  </main>\n</body>",
		WCAG:      "2.4.2 Page Titled; 1.3.1 Info and Relationships",
		Origin:    "Baseline",
	}
}

func (missingPageAnchors) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	hasH1, hasMain := false, false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag || engine.IsHiddenFromEveryone(node) {
			continue
		}
		if node.Role == "heading" && node.Exposed && (node.Tag == "h1" || strings.TrimSpace(node.Attrs["aria-level"]) == "1") {
			hasH1 = true
		}
		if node.Role == "main" && node.Exposed {
			hasMain = true
		}
	}

	missing := []string{}
	labels := []string{}
	if s.Title == "" {
		missing = append(missing, "title")
		labels = append(labels, "no <title>")
	}
	if !hasH1 {
		missing = append(missing, "h1")
		labels = append(labels, "no <h1>")
	}
	if !hasMain {
		missing = append(missing, "main")
		labels = append(labels, "no main landmark")
	}
	if len(missing) == 0 {
		return nil, true
	}
	return []engine.Issue{{
		NodeID:   rootNode(s),
		Message:  "The page has " + strings.Join(labels, ", ") + ", so agents can't confirm where they are or find the content.",
		Evidence: map[string]any{"missing": missing},
	}}, true
}
