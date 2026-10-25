package rules

import "testing"

func TestUnnamedControl(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"icon-only button", `<button><svg aria-hidden="true"></svg></button>`, 1},
		{"empty link", `<a href="/home"></a>`, 1},
		{"image link without alt", `<a href="/home"><img src="x.png" alt=""></a>`, 1},
		{"aria-label names it", `<button aria-label="Close"><svg aria-hidden="true"></svg></button>`, 0},
		{"svg title names it", `<button><svg><title>Close</title></svg></button>`, 0},
		{"title attribute names it", `<a href="/home" title="Home"></a>`, 0},
		{"fields are OPT-106, not OPT-102", `<input type="text">`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-102", c.want)
		})
	}
}
