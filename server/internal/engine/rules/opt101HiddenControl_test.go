package rules

import "testing"

func TestHiddenControl(t *testing.T) {
	cases := []struct {
		name     string
		body     string
		want     int
		hiddenBy string
	}{
		{"button under role=img", `<div role="img" aria-label="Ring"><button>Seek</button></div>`, 1, "ROLE_IMG"},
		{"link inside aria-hidden", `<div aria-hidden="true"><a href="/x">Docs</a></div>`, 1, "ARIA_HIDDEN"},
		{"link inside a tab", `<div role="tab">Settings <a href="/close">Close settings</a></div>`, 1, "PRESENTATIONAL_CHILDREN"},
		{"hidden attribute is hidden from everyone", `<div hidden><button>Later</button></div>`, 0, ""},
		{"inline display none is hidden from everyone", `<button style="display: none">Later</button>`, 0, ""},
		{"closed details content", `<details><summary>More</summary><button>Inner</button></details>`, 0, ""},
		{"decorative svg inside a button", `<button>Save <svg aria-hidden="true"></svg></button>`, 0, ""},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			findings := expectFindings(t, scanHTML(t, c.body), "OPT-101", c.want)
			if c.want > 0 && findings[0].Evidence["hiddenBy"] != c.hiddenBy {
				t.Errorf("hiddenBy: want %s, got %v", c.hiddenBy, findings[0].Evidence["hiddenBy"])
			}
		})
	}
}
