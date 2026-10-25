package rules

import "testing"

func TestImageWithoutAlt(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"no alt", `<img src="chart.png">`, 1},
		{"empty alt is decoration", `<img src="x.png" alt="">`, 0},
		{"alt text", `<img src="chart.png" alt="Signups doubled">`, 0},
		{"aria-hidden", `<img src="x.png" aria-hidden="true">`, 0},
		{"role presentation", `<img src="x.png" role="presentation">`, 0},
		{"aria-label", `<img src="chart.png" aria-label="Signups doubled">`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-203", c.want)
		})
	}
}
