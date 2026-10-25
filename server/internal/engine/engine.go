package engine

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sort"
	"strconv"
	"strings"
)

const maxSnippetLength = 600
const maxSnippetText = 160

var voidTags = setOf("area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr")

// Scan runs the set's rules over an annotated snapshot and returns a deterministic report.
func Scan(s Snapshot, set RuleSet) Report {
	report := Report{
		EngineVersion: EngineVersion,
		RuleSet:       set.Name,
		RulesetHash:   RulesetHash(set),
		Mode:          s.Mode,
		URL:           s.URL,
		Route:         s.Route,
		Title:         s.Title,
		Lang:          s.Lang,
		Rules:         []RuleResult{},
		Findings:      []Finding{},
	}

	for id := range s.Nodes {
		if s.Nodes[id].Tag == TextTag {
			continue
		}
		report.NodeCount++
		if s.Nodes[id].Interactive && s.Nodes[id].Exposed {
			report.ControlCount++
		}
	}

	for position, rule := range set.Rules {
		meta := rule.Meta()
		result := RuleResult{
			RuleID:   meta.ID,
			Position: position + 1,
			Category: meta.Category,
			Priority: meta.Priority,
			Severity: meta.Severity,
			Weight:   meta.Weight(),
		}

		if meta.RenderedOnly && s.Mode != ModeRendered {
			result.Result = ResultNeedsRendered
			report.Rules = append(report.Rules, result)
			continue
		}

		issues, applicable := rule.Check(&s)
		switch {
		case !applicable:
			result.Result = ResultNotApplicable
		case len(issues) == 0:
			result.Result = ResultPass
		default:
			result.Result = ResultFail
		}

		ruleFindings := buildFindings(&s, meta, issues)
		result.FindingsCount = len(ruleFindings)
		report.Findings = append(report.Findings, ruleFindings...)
		report.Rules = append(report.Rules, result)
	}

	sort.SliceStable(report.Findings, func(i, j int) bool {
		if report.Findings[i].RuleID != report.Findings[j].RuleID {
			return report.Findings[i].RuleID < report.Findings[j].RuleID
		}
		return report.Findings[i].DocumentOrder < report.Findings[j].DocumentOrder
	})
	uniqueFingerprints(report.Findings)
	for index := range report.Findings {
		report.Findings[index].Position = index + 1
	}

	report.Counts = count(report.Rules, report.Findings)
	report.Scores = score(report.Rules)
	report.ReportHash = hashReport(report)
	return report
}

// buildFindings turns a rule's issues into findings, keeping at most one per node.
func buildFindings(s *Snapshot, meta RuleMeta, issues []Issue) []Finding {
	findings := make([]Finding, 0, len(issues))
	seen := map[int]bool{}
	for _, issue := range issues {
		if issue.NodeID < 0 || issue.NodeID >= len(s.Nodes) || seen[issue.NodeID] {
			continue
		}
		seen[issue.NodeID] = true
		node := &s.Nodes[issue.NodeID]
		severity := issue.Severity
		if severity == "" {
			severity = meta.Severity
		}
		evidence := issue.Evidence
		if evidence == nil {
			evidence = map[string]any{}
		}
		if node.Box != nil {
			evidence["box"] = *node.Box
		}
		findings = append(findings, Finding{
			RuleID:         meta.ID,
			Category:       meta.Category,
			Severity:       severity,
			Fingerprint:    Fingerprint(meta.ID, s.Route, node.Path, node.Role, node.Name),
			DocumentOrder:  node.DocumentOrder,
			SelectorPath:   node.Path,
			Tag:            node.Tag,
			Role:           node.Role,
			AccessibleName: node.Name,
			NameFrom:       node.NameFrom,
			Snippet:        Snippet(s, issue.NodeID),
			Message:        issue.Message,
			Evidence:       evidence,
		})
	}
	return findings
}

func count(results []RuleResult, findings []Finding) Counts {
	counts := Counts{Findings: len(findings)}
	for _, finding := range findings {
		switch finding.Severity {
		case SeverityCritical:
			counts.Critical++
		case SeveritySerious:
			counts.Serious++
		case SeverityModerate:
			counts.Moderate++
		case SeverityMinor:
			counts.Minor++
		}
	}
	for _, result := range results {
		switch result.Result {
		case ResultPass:
			counts.RulesPassed++
		case ResultFail:
			counts.RulesFailed++
		case ResultNotApplicable:
			counts.RulesNotApplicable++
		case ResultNeedsRendered:
			counts.RulesNeedRendered++
		}
	}
	return counts
}

// RulesetHash identifies exactly which rules, at which versions, a report ran.
func RulesetHash(set RuleSet) string {
	entries := make([]string, 0, len(set.Rules))
	for _, rule := range set.Rules {
		meta := rule.Meta()
		entries = append(entries, meta.ID+"@"+strconv.Itoa(meta.Version))
	}
	sort.Strings(entries)
	sum := sha256.Sum256([]byte(set.Name + "\n" + strings.Join(entries, "\n")))
	return hex.EncodeToString(sum[:])
}

func hashReport(report Report) string {
	report.ReportHash = ""
	encoded, err := json.Marshal(report)
	if err != nil {
		return ""
	}
	sum := sha256.Sum256(encoded)
	return hex.EncodeToString(sum[:])
}

// Snippet rebuilds the start of an element's markup from the snapshot: its start tag, a truncated text
// content, and its end tag. It is user-controlled markup and must only ever be shown as escaped text.
func Snippet(s *Snapshot, id int) string {
	node := &s.Nodes[id]
	var builder strings.Builder
	builder.WriteString("<" + node.Tag)
	for _, key := range node.AttrKeys {
		if strings.HasPrefix(key, "data-optiki-") {
			continue
		}
		value := node.Attrs[key]
		builder.WriteString(" " + key)
		if value != "" {
			builder.WriteString(`="` + strings.ReplaceAll(value, `"`, "&quot;") + `"`)
		}
	}
	builder.WriteString(">")
	if !voidTags[node.Tag] || node.Namespace != "" {
		text := TextContent(s, id)
		if len(text) > maxSnippetText {
			text = truncateUTF8(text, maxSnippetText) + "…"
		}
		builder.WriteString(text)
		builder.WriteString("</" + node.Tag + ">")
	}
	snippet := builder.String()
	if len(snippet) > maxSnippetLength {
		snippet = truncateUTF8(snippet, maxSnippetLength-3) + "…"
	}
	return snippet
}

func truncateUTF8(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	for limit > 0 && (value[limit]&0xC0) == 0x80 {
		limit--
	}
	return value[:limit]
}
