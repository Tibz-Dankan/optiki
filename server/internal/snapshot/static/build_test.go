package static

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

func find(t *testing.T, s *engine.Snapshot, path string) *engine.Node {
	t.Helper()
	for id := range s.Nodes {
		if s.Nodes[id].Path == path {
			return &s.Nodes[id]
		}
	}
	t.Fatalf("no node at %s", path)
	return nil
}

func TestBuild(t *testing.T) {
	page := `<!doctype html><html lang="en"><head><title> Gym  page </title><script>var x = "<button>";</script></head>
<body><main id="m">
<button id="b1">Save <b>draft</b></button>
<a id="l1" href="/x"><img src="a.png" alt="Docs"> home</a>
<label for="e">Email</label><input id="e" type="email" placeholder="you@x.io">
<label id="wrap">Name <input id="n"></label>
<input id="p" placeholder="Search">
<span id="lb">Close</span><button id="b2" aria-labelledby="lb missing">X</button>
<div role="img" id="ring"><button id="inner">Seek</button></div>
<div aria-hidden="true"><a id="ghost" href="/">Ghost</a></div>
<svg id="chart"><title>Uptime chart</title><text>99%</text></svg>
<div role="presentation" id="pres">x</div>
<button role="presentation" id="focusable">Kept</button>
<header id="hd">Top</header>
<input id="h" type="hidden">
</main></body></html>`
	s := Build(page, "https://example.com/", "/")

	if s.Title != "Gym page" || s.Lang != "en" || s.Mode != engine.ModeStatic {
		t.Fatalf("title/lang/mode: %q %q %q", s.Title, s.Lang, s.Mode)
	}
	for id := range s.Nodes {
		if s.Nodes[id].Tag == "button" && s.Nodes[id].Parent >= 0 && s.Nodes[s.Nodes[id].Parent].Tag == "script" {
			t.Fatal("script content must not become nodes")
		}
	}

	cases := []struct {
		path, role, name, nameFrom string
		exposed                    bool
	}{
		{"#b1", "button", "Save draft", engine.NameFromContent, true},
		{"#l1", "link", "Docs home", engine.NameFromContent, true},
		{"#e", "textbox", "Email", engine.NameFromNative, true},
		{"#n", "textbox", "Name", engine.NameFromNative, true},
		{"#p", "textbox", "Search", engine.NameFromPlaceholder, true},
		{"#b2", "button", "Close", engine.NameFromAriaLabelledBy, true},
		{"#ring", "img", "", "", true},
		{"#inner", "button", "Seek", engine.NameFromContent, false},
		{"#ghost", "link", "Ghost", engine.NameFromContent, false},
		{"#chart", "graphics-document", "Uptime chart", engine.NameFromNative, true},
		{"#pres", "presentation", "", "", false},
		{"#focusable", "button", "Kept", engine.NameFromContent, true},
		{"#hd", "generic", "", "", true},
		{"#h", "none", "", "", false},
	}
	for _, c := range cases {
		node := find(t, &s, c.path)
		if node.Role != c.role || node.Name != c.name || node.NameFrom != c.nameFrom || node.Exposed != c.exposed {
			t.Errorf("%s: want role=%q name=%q from=%q exposed=%v, got role=%q name=%q from=%q exposed=%v",
				c.path, c.role, c.name, c.nameFrom, c.exposed, node.Role, node.Name, node.NameFrom, node.Exposed)
		}
	}

	if inner := find(t, &s, "#inner"); inner.HiddenBy != engine.HiddenByRoleImg {
		t.Errorf("#inner: want hidden by ROLE_IMG, got %q", inner.HiddenBy)
	}
	if ghost := find(t, &s, "#ghost"); ghost.HiddenBy != engine.HiddenByAriaHidden {
		t.Errorf("#ghost: want hidden by ARIA_HIDDEN, got %q", ghost.HiddenBy)
	}
	if hidden := find(t, &s, "#h"); hidden.HiddenBy != engine.HiddenByNotRendered {
		t.Errorf("#h: want NOT_RENDERED, got %q", hidden.HiddenBy)
	}
}

func TestSelectorPaths(t *testing.T) {
	s := Build(`<html><body><div id="list"><p>a</p><p>b</p><span>c</span></div><ul><li>x</li></ul></body></html>`, "", "/")
	want := map[string]bool{
		"#list":                    true,
		"#list > p:nth-of-type(1)": true,
		"#list > p:nth-of-type(2)": true,
		"#list > span":             true,
		"html > body > ul > li":    true,
	}
	for path := range want {
		find(t, &s, path)
	}
}

func TestSnippetIsTruncatedMarkup(t *testing.T) {
	s := Build(`<html><body><button class="x" data-optiki-i="3" onclick="go(&quot;a&quot;)">Go</button><img src="a.png"></body></html>`, "", "/")
	for id := range s.Nodes {
		switch s.Nodes[id].Tag {
		case "button":
			if got := engine.Snippet(&s, id); got != `<button class="x" onclick="go(&quot;a&quot;)">Go</button>` {
				t.Errorf("button snippet: %s", got)
			}
		case "img":
			if got := engine.Snippet(&s, id); got != `<img src="a.png">` {
				t.Errorf("img snippet: %s", got)
			}
		}
	}
}
