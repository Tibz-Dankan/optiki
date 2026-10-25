package rules

import (
	"sort"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

var referenceAttributes = []string{"aria-labelledby", "aria-describedby"}

type brokenReferences struct{}

func (brokenReferences) Meta() engine.RuleMeta {
	return engine.RuleMeta{
		ID:        "OPT-205",
		Name:      "Broken references",
		Category:  engine.CategoryPerceivable,
		Severity:  engine.SeverityModerate,
		Priority:  engine.PriorityP1,
		Version:   1,
		Modes:     staticOnly,
		Summary:   "aria-labelledby, aria-describedby or label[for] points at a missing id, or at an id used more than once.",
		Why:       "A reference to a missing id silently drops the label or description, and a duplicated id makes the browser pick one. Either way the agent gets the wrong text, or none.",
		Fix:       "Point every reference at exactly one existing id.",
		FixBefore: "<input id=\"q\" aria-describedby=\"search-hint\">\n<!-- no element has id=\"search-hint\" -->",
		FixAfter:  "<input id=\"q\" aria-describedby=\"search-hint\">\n<p id=\"search-hint\">Try a product name.</p>",
		WCAG:      "1.3.1 Info and Relationships; 4.1.2 Name, Role, Value",
		Origin:    "Baseline",
	}
}

func (brokenReferences) Check(s *engine.Snapshot) ([]engine.Issue, bool) {
	ids := engine.IDIndex(s)
	var issues []engine.Issue
	applicable := false
	for id := range s.Nodes {
		node := &s.Nodes[id]
		if node.Tag == engine.TextTag {
			continue
		}
		references := map[string][]string{}
		for _, attribute := range referenceAttributes {
			if value, ok := node.Attrs[attribute]; ok {
				references[attribute] = strings.Fields(value)
			}
		}
		if node.Tag == "label" && node.Namespace == "" {
			if target := strings.TrimSpace(node.Attrs["for"]); target != "" {
				references["for"] = []string{target}
			}
		}
		if len(references) == 0 {
			continue
		}
		applicable = true

		var attributes, missing, duplicated []string
		for attribute, refs := range references {
			broken := false
			for _, ref := range refs {
				switch len(ids[ref]) {
				case 0:
					missing = append(missing, ref)
					broken = true
				case 1:
				default:
					duplicated = append(duplicated, ref)
					broken = true
				}
			}
			if broken {
				attributes = append(attributes, attribute)
			}
		}
		if len(attributes) == 0 {
			continue
		}
		sort.Strings(attributes)
		sort.Strings(missing)
		sort.Strings(duplicated)

		var parts []string
		if len(missing) > 0 {
			parts = append(parts, "points at missing ids "+joinQuoted(missing))
		}
		if len(duplicated) > 0 {
			parts = append(parts, "points at ids used more than once "+joinQuoted(duplicated))
		}
		if missing == nil {
			missing = []string{}
		}
		if duplicated == nil {
			duplicated = []string{}
		}
		issues = append(issues, engine.Issue{
			NodeID:   id,
			Message:  "This " + strings.Join(attributes, " and ") + " " + strings.Join(parts, " and ") + ", so its label or description is lost.",
			Evidence: map[string]any{"attributes": attributes, "missingIDs": missing, "duplicateIDs": duplicated},
		})
	}
	return issues, applicable
}
