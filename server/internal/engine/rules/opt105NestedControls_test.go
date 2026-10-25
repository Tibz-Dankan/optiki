package rules

import "testing"

func TestNestedControls(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"button inside a link", `<a href="/item">Item <button>Delete</button></a>`, 1},
		{"link inside a link-role card", `<div role="link" tabindex="0">Card <a href="/x">More</a></div>`, 1},
		{"options inside a select", `<label for="s">Size</label><select id="s"><option>S</option><option>M</option></select>`, 0},
		{"siblings", `<a href="/item">Item</a> <button>Delete item</button>`, 0},
		{"field inside a label", `<label>Email <input type="email"></label>`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-105", c.want)
		})
	}
}
