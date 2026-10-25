package rules

import (
	"reflect"
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/static"
)

func TestMissingPageAnchors(t *testing.T) {
	cases := []struct {
		name    string
		page    string
		missing []string
	}{
		{"nothing", `<html><body><p>Hi</p></body></html>`, []string{"title", "h1", "main"}},
		{"only main missing", `<html><head><title>T</title></head><body><h1>T</h1></body></html>`, []string{"main"}},
		{"role main and aria-level 1 count", `<html><head><title>T</title></head><body><div role="main"><div role="heading" aria-level="1">T</div></div></body></html>`, nil},
		{"a hidden h1 doesn't count", `<html><head><title>T</title></head><body><main><h1 hidden>T</h1></main></body></html>`, []string{"h1"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			report := engine.Scan(static.Build(c.page, "", "/"), fullSet(t))
			findings := findingsFor(report, "OPT-401")
			if c.missing == nil {
				if len(findings) != 0 {
					t.Fatalf("want no finding, got %+v", findings)
				}
				return
			}
			if len(findings) != 1 || !reflect.DeepEqual(findings[0].Evidence["missing"], c.missing) {
				t.Fatalf("want one finding missing %v, got %+v", c.missing, findings)
			}
		})
	}
}
