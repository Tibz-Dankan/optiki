package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

func TestNativeBlockingDialog(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"confirm in onclick", `<button onclick="return confirm('Sure?')">Delete</button>`, 1},
		{"alert in a javascript: link", `<a href="javascript:alert('hi')">Hi</a>`, 1},
		{"prompt with spaces", `<button onclick="prompt ('Name')">Rename</button>`, 1},
		{"a function merely named confirmDelete", `<button onclick="confirmDelete()">Delete</button>`, 0},
		{"no handler", `<button>Delete</button>`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-107", c.want)
		})
	}
}

func TestNativeBlockingDialogRendered(t *testing.T) {
	snapshot := renderedPage(`<p>Hello</p>`, func(s *engine.Snapshot) { s.Dialogs = []string{"alert"} })
	findings := expectFindings(t, engine.Scan(snapshot, fullSet(t)), "OPT-107", 1)
	if findings[0].SelectorPath != "html" {
		t.Errorf("a load-time dialog is a page-level finding, got %s", findings[0].SelectorPath)
	}
}
