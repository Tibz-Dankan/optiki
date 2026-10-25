package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

func TestLookAlikeControls(t *testing.T) {
	cases := []struct {
		name     string
		body     string
		want     int
		severity string
	}{
		{"same name, same role", `<button>Confirm</button><button>Confirm</button><button>Confirm</button>`, 3, engine.SeveritySerious},
		{"case and punctuation are ignored", `<button>Delete!</button><button>delete</button>`, 2, engine.SeveritySerious},
		{"repeated rows are moderate", `<ul><li>A <button>Delete</button></li><li>B <button>Delete</button></li></ul>`, 2, engine.SeverityModerate},
		{"two in one row stay serious", `<ul><li><button>Delete</button><button>Delete</button></li></ul>`, 2, engine.SeveritySerious},
		{"links to the same place are fine", `<a href="/">Home</a><a href="/">Home</a>`, 0, ""},
		{"links to different places are not", `<a href="/a">More</a><a href="/b">More</a>`, 2, engine.SeveritySerious},
		{"a button and a link may share a name", `<button>Docs</button><a href="/docs">Docs</a>`, 0, ""},
		{"distinct names", `<button>Seek to iteration 2</button><button>Open iteration 2</button>`, 0, ""},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			findings := expectFindings(t, scanHTML(t, c.body), "OPT-103", c.want)
			for _, finding := range findings {
				if finding.Severity != c.severity {
					t.Errorf("severity: want %s, got %s", c.severity, finding.Severity)
				}
			}
		})
	}
}
