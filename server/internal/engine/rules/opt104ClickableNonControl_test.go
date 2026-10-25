package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

func TestClickableNonControl(t *testing.T) {
	cases := []struct {
		name    string
		body    string
		want    int
		trigger string
	}{
		{"div with onclick", `<div onclick="go()">Go</div>`, 1, "ONCLICK"},
		{"span with tabindex", `<span tabindex="0">Menu</span>`, 1, "TABINDEX"},
		{"anchor without href", `<a onclick="go()">Go</a>`, 1, "ONCLICK"},
		{"anchor without href or handler", `<a>Go somewhere</a>`, 1, "ANCHOR_WITHOUT_HREF"},
		{"empty anchor target", `<a id="top"></a>`, 0, ""},
		{"button with onclick", `<button onclick="go()">Go</button>`, 0, ""},
		{"div with a widget role", `<div role="button" tabindex="0" onclick="go()">Go</div>`, 0, ""},
		{"tabindex -1 is programmatic focus", `<div tabindex="-1">Panel</div>`, 0, ""},
		{"labelled scrollable region", `<div role="region" aria-label="Log" tabindex="0">…</div>`, 0, ""},
		{"body onload", ``, 0, ""},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			findings := expectFindings(t, scanHTML(t, c.body), "OPT-104", c.want)
			if c.want > 0 && findings[0].Evidence["trigger"] != c.trigger {
				t.Errorf("trigger: want %s, got %v", c.trigger, findings[0].Evidence["trigger"])
			}
		})
	}
}

func TestClickableNonControlRendered(t *testing.T) {
	set := fullSet(t)
	snapshot := renderedPage(`<div class="card"><span>Open report</span></div><a href="/x"><span>Inside link</span></a>`, func(s *engine.Snapshot) {
		for id := range s.Nodes {
			switch s.Nodes[id].Tag {
			case "div", "a", "span":
				s.Nodes[id].Cursor = stringPtr("pointer")
			}
		}
	})
	findings := expectFindings(t, engine.Scan(snapshot, set), "OPT-104", 1)
	if findings[0].Tag != "div" || findings[0].Evidence["trigger"] != "CURSOR_POINTER" {
		t.Errorf("want the div flagged for its pointer cursor, got %+v", findings[0])
	}
}
