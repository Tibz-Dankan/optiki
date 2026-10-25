package rules

import "testing"

func TestUnnamedDialog(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"role dialog without a name", `<div role="dialog"><h2>Delete?</h2></div>`, 1},
		{"closed dialog element without a name", `<dialog><p>Saved</p></dialog>`, 1},
		{"alertdialog without a name", `<div role="alertdialog">Oops</div>`, 1},
		{"labelledby heading", `<div role="dialog" aria-labelledby="t"><h2 id="t">Delete?</h2></div>`, 0},
		{"aria-label", `<dialog open aria-label="Settings"></dialog>`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-402", c.want)
		})
	}
}
