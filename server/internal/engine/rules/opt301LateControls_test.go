package rules

import (
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

func TestLateControls(t *testing.T) {
	snapshot := renderedPage(`<button>Start the tour</button><button>Skip</button>`, func(s *engine.Snapshot) {
		nodeByTagAndText(s, "button", "Start the tour").FirstSeenMs = intPtr(2300)
		nodeByTagAndText(s, "button", "Skip").FirstSeenMs = intPtr(400)
	})
	findings := expectFindings(t, engine.Scan(snapshot, fullSet(t)), "OPT-301", 1)
	if findings[0].AccessibleName != "Start the tour" || findings[0].Evidence["firstSeenMs"] != 2300 {
		t.Errorf("want the late Start button, got %+v", findings[0])
	}
}

func TestLateControlsNotApplicableWithoutSamples(t *testing.T) {
	report := engine.Scan(renderedPage(`<button>Go</button>`, nil), fullSet(t))
	if got := resultFor(report, "OPT-301"); got != engine.ResultNotApplicable {
		t.Fatalf("no first-seen samples: want NOT_APPLICABLE, got %s", got)
	}
}
