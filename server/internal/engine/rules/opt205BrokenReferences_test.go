package rules

import (
	"reflect"
	"testing"
)

func TestBrokenReferences(t *testing.T) {
	cases := []struct {
		name       string
		body       string
		want       int
		missing    []string
		duplicated []string
	}{
		{"missing describedby target", `<label for="q">Search</label><input id="q" aria-describedby="hint">`, 1, []string{"hint"}, []string{}},
		{"label for a missing id", `<label for="nope">Email</label><input type="email" aria-label="Email">`, 1, []string{"nope"}, []string{}},
		{"duplicated labelledby target", `<span id="d">A</span><span id="d">B</span><button aria-labelledby="d">x</button>`, 1, []string{}, []string{"d"}},
		{"all references resolve", `<p id="hint">Tip</p><label for="q">Search</label><input id="q" aria-describedby="hint">`, 0, nil, nil},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			findings := expectFindings(t, scanHTML(t, c.body), "OPT-205", c.want)
			if c.want == 0 {
				return
			}
			if got := findings[0].Evidence["missingIDs"]; !reflect.DeepEqual(got, c.missing) {
				t.Errorf("missingIDs: want %v, got %v", c.missing, got)
			}
			if got := findings[0].Evidence["duplicateIDs"]; !reflect.DeepEqual(got, c.duplicated) {
				t.Errorf("duplicateIDs: want %v, got %v", c.duplicated, got)
			}
		})
	}
}
