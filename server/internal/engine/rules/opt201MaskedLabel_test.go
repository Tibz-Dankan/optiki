package rules

import "testing"

func TestMaskedLabel(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"aria-label replaces the visible text", `<button aria-label="Help">Press ? for shortcuts</button>`, 1},
		{"labelledby replaces it", `<span id="x">Close</span><a href="/" aria-labelledby="x">Back to home</a>`, 1},
		{"label contains the visible text", `<button aria-label="Press ? for shortcuts (opens help)">Press ? for shortcuts</button>`, 0},
		{"punctuation and case don't matter", `<button aria-label="save draft">Save draft!</button>`, 0},
		{"icon-only control has no visible text", `<button aria-label="Close"><svg aria-hidden="true"></svg></button>`, 0},
		{"no aria-label", `<button>Press ? for shortcuts</button>`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-201", c.want)
		})
	}
}
