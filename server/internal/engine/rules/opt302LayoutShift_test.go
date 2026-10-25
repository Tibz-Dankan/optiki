package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

func TestLayoutShift(t *testing.T) {
	cases := []struct {
		cls  float64
		want int
	}{{0.23, 1}, {0.1, 0}, {0.02, 0}}
	for _, c := range cases {
		snapshot := renderedPage(`<p>News</p>`, func(s *engine.Snapshot) { s.CLS = floatPtr(c.cls) })
		findings := expectFindings(t, engine.Scan(snapshot, fullSet(t)), "OPT-302", c.want)
		if c.want > 0 && findings[0].Evidence["cls"] != c.cls {
			t.Errorf("cls evidence: want %v, got %v", c.cls, findings[0].Evidence["cls"])
		}
	}
	if got := resultFor(engine.Scan(renderedPage(`<p>x</p>`, nil), fullSet(t)), "OPT-302"); got != engine.ResultNotApplicable {
		t.Errorf("no CLS measured: want NOT_APPLICABLE, got %s", got)
	}
}
