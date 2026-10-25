package rules

import "testing"

func TestUnlabeledField(t *testing.T) {
	cases := []struct {
		name string
		body string
		want int
	}{
		{"placeholder only", `<input type="email" placeholder="Email">`, 1},
		{"nothing at all", `<textarea></textarea>`, 1},
		{"unlabeled select", `<select><option>One</option></select>`, 1},
		{"label for", `<label for="e">Email</label><input id="e" type="email">`, 0},
		{"wrapping label", `<label>Email <input type="email" placeholder="you@example.com"></label>`, 0},
		{"aria-label", `<input type="search" aria-label="Search products">`, 0},
		{"aria-labelledby", `<span id="l">Email</span><input aria-labelledby="l">`, 0},
		{"hidden inputs are not fields", `<input type="hidden" name="csrf">`, 0},
		{"buttons are not fields", `<input type="submit">`, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			expectFindings(t, scanHTML(t, c.body), "OPT-106", c.want)
		})
	}
}
