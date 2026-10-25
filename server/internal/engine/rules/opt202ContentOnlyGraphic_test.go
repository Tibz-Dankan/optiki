package rules

import "testing"

func TestContentOnlyGraphic(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"unnamed role=img svg with text", `<svg role="img"><text>98.2%</text></svg>`, 1},
		{"aria-hidden svg with text and nothing else", `<div><svg aria-hidden="true"><text>42 users</text></svg></div>`, 1},
		{"canvas without fallback", `<canvas width="100" height="50"></canvas>`, 1},
		{"named svg", `<svg role="img" aria-label="Uptime 98.2%"><text>98.2%</text></svg>`, 0},
		{"svg title", `<svg role="img"><title>Uptime 98.2%</title><text>98.2%</text></svg>`, 0},
		{"aria-hidden svg with a screen-reader text block", `<div><svg aria-hidden="true"><text>42 users</text></svg><span class="sr-only">42 users online</span></div>`, 0},
		{"plain svg leaves its text exposed", `<svg><text>Label</text></svg>`, 0},
		{"decorative icon without text", `<svg aria-hidden="true"><path d="M0 0"/></svg>`, 0},
		{"canvas with fallback text", `<canvas>Signups doubled in March</canvas>`, 0},
		{"decorative canvas", `<canvas aria-hidden="true"></canvas>`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-202", c.want)
		})
	}
}
