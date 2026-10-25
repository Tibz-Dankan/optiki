package rules

import (
	"regexp"
	"sort"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

var nativeDialogCall = regexp.MustCompile(`\b(confirm|alert|prompt)\s*\(`)

type nativeBlockingDialog struct{}

func (nativeBlockingDialog) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-107",
		Name:      "Native blocking dialog",
		Category:  engine.CategoryOperable,
		Severity:  engine.SeverityModerate,
		Priority:  engine.PriorityP2,
		Version:   1,
		Modes:     staticAndRendered,
		Summary:   "confirm(), alert() or prompt() appears in an inline handler, or (rendered) is called while the page loads.",
		Why:       "Native dialogs freeze the page in browser chrome that many agents can't see or answer, so the run stalls waiting for a click that never comes.",
		Fix:       "Use an in-page dialog with role=\"dialog\" (or <dialog>) and an accessible name.",
		FixBefore: "<button onclick=\"return confirm('Delete this report?')\">Delete report</button>",
		FixAfter:  "<button onclick=\"deleteDialog.showModal()\">Delete report</button>\n<dialog id=\"deleteDialog\" aria-labelledby=\"deleteTitle\">…</dialog>",
		WCAG:      "",
		Origin:    "Timeora #21",
	}
}

func (nativeBlockingDialog) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	var issues []engine.Issue
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag {
			continue
		}
		for _, key := range node.AttrKeys {
			value := node.Attrs[key]
			isHandler := strings.HasPrefix(key, "on")
			isScriptURL := key == "href" && strings.HasPrefix(strings.ToLower(strings.TrimSpace(value)), "javascript:")
			if !isHandler && !isScriptURL {
				continue
			}
			if match := nativeDialogCall.FindStringSubmatch(value); match != nil {
				issues = append(issues, engine.Issue{
					NodeID:   id,
					Message:  "This " + key + " calls " + match[1] + "(), which opens a browser dialog many agents can't see or answer.",
					Evidence: map[string]any{"call": match[1], "attribute": key},
				})
				break
			}
		}
	}

	if len(s.Dialogs) > 0 {
		dialogs := append([]string(nil), s.Dialogs...)
		sort.Strings(dialogs)
		issues = append(issues, engine.Issue{
			NodeID:   rootNode(s),
			Message:  "The page opened a browser dialog (" + strings.Join(dialogs, ", ") + ") while loading.",
			Evidence: map[string]any{"dialogs": dialogs},
		})
	}
	return issues, true
}
