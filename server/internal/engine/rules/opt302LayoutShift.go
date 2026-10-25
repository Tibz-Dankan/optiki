package rules

import (
	"strconv"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

const maxCLS = 0.1

type layoutShift struct{}

func (layoutShift) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:           "OPT-302",
		Name:         "Layout shift",
		Category:     engine.CategoryStable,
		Severity:     engine.SeverityModerate,
		Priority:     engine.PriorityP1,
		Version:      1,
		Modes:        renderedOnly,
		RenderedOnly: true,
		Summary:      "Cumulative layout shift is above 0.1 within 3 seconds of load.",
		Why:          "When content jumps after load, an agent's click lands on whatever moved under the pointer — often the wrong control.",
		Fix:          "Reserve space for content that arrives late, and give images and embeds a width and height.",
		FixBefore:    "<img src=\"banner.jpg\">",
		FixAfter:     "<img src=\"banner.jpg\" width=\"1200\" height=\"300\" alt=\"…\">",
		WCAG:         "",
		Origin:       "Baseline (also in Lighthouse)",
	}
}

func (layoutShift) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	if s.CLS == nil {
		return nil, false
	}
	cls := roundTo(*s.CLS, 3)
	if *s.CLS <= maxCLS {
		return nil, true
	}
	return []engine.Issue{{
		NodeID:   rootNode(s),
		Message:  "The layout shifted by " + strconv.FormatFloat(cls, 'f', -1, 64) + " (CLS) in the first 3 seconds, above the 0.1 limit.",
		Evidence: map[string]any{"cls": cls},
	}}, true
}
