package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

func TestTinyMeaningfulText(t *testing.T) {
	body := `<button>Export</button><button>Import</button><p>Fine print</p><h2>Section</h2>`
	snapshot := renderedPage(body, func(s *engine.Snapshot) {
		for id := range s.Nodes {
			node := &s.Nodes[id]
			switch engine.TextContent(s, id) {
			case "Export", "Fine print":
				node.FontPx = floatPtr(10)
			case "Import", "Section":
				node.FontPx = floatPtr(14)
			}
		}
	})
	findings := expectFindings(t, engine.Scan(snapshot, fullSet(t)), "OPT-204", 1)
	if findings[0].AccessibleName != "Export" || findings[0].Evidence["fontPx"] != 10.0 {
		t.Errorf("want the 10px Export button, got %+v", findings[0])
	}
}

func TestTinyMeaningfulTextNeedsRendering(t *testing.T) {
	report := scanHTML(t, `<button style="font-size: 8px">Export</button>`)
	if got := resultFor(report, "OPT-204"); got != engine.ResultNeedsRendered {
		t.Fatalf("statically: want NEEDS_RENDERED, got %s", got)
	}
}
