package rules

import "testing"

func TestUntitledFrame(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"no title", `<iframe src="https://example.com/map"></iframe>`, 1},
		{"empty title", `<iframe title=" " src="https://example.com/map"></iframe>`, 1},
		{"title", `<iframe title="Office map" src="https://example.com/map"></iframe>`, 0},
		{"aria-label", `<iframe aria-label="Office map" src="https://example.com/map"></iframe>`, 0},
		{"hidden frame", `<iframe hidden src="https://example.com/track"></iframe>`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-403", c.want)
		})
	}
}
