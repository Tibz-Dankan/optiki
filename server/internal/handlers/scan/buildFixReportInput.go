package scan

import (
	"bytes"
	"encoding/json"
	"slices"
	"sort"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/models"
)

type fixReportInput struct {
	Scan               fixReportScan    `json:"scan"`
	FailingRules       []*fixReportRule `json:"failingRules"`
	PassedRules        []string         `json:"passedRules"`
	NeedsRenderedRules []string         `json:"needsRenderedRules"`
	FindingsTruncated  bool             `json:"findingsTruncated"`
}

type fixReportScan struct {
	Kind          string          `json:"kind"` // SINGLE_PAGE, MULTIPLE_PAGE
	Target        string          `json:"target"`
	PageTitle     *string         `json:"pageTitle,omitempty"`
	Mode          string          `json:"mode"`
	RuleSet       string          `json:"ruleSet"`
	EngineVersion string          `json:"engineVersion"`
	ScannedAt     time.Time       `json:"scannedAt"`
	Scores        fixReportScores `json:"scores"`
	Counts        fixReportCounts `json:"counts"`
	Pages         []fixReportPage `json:"pages,omitempty"`
}

type fixReportScores struct {
	Overall      *int `json:"overall"`
	Operable     *int `json:"operable"`
	Perceivable  *int `json:"perceivable"`
	Stable       *int `json:"stable"`
	Discoverable *int `json:"discoverable"`
}

type fixReportCounts struct {
	Findings int `json:"findings"`
	Critical int `json:"critical"`
	Serious  int `json:"serious"`
	Moderate int `json:"moderate"`
	Minor    int `json:"minor"`
}

type fixReportPage struct {
	Route        string  `json:"route"`
	URL          *string `json:"url"`
	PageTitle    *string `json:"pageTitle,omitempty"`
	OverallScore *int    `json:"overallScore"`
	Findings     int     `json:"findings"`
}

type fixReportRule struct {
	ID               string               `json:"id"`
	Name             string               `json:"name"`
	Category         string               `json:"category"`
	Severity         string               `json:"severity"`
	Priority         string               `json:"priority"`
	WCAG             string               `json:"wcag,omitempty"`
	Summary          string               `json:"summary"`
	Why              string               `json:"why"`
	Fix              string               `json:"fix"`
	FixBefore        string               `json:"fixBefore"`
	FixAfter         string               `json:"fixAfter"`
	TotalFindings    int                  `json:"totalFindings"`
	PagesAffected    []string             `json:"pagesAffected,omitempty"`
	Instances        []*fixReportInstance `json:"instances"`
	OmittedInstances int                  `json:"omittedInstances"`

	position int
	omitted  map[string]bool
}

type fixReportInstance struct {
	Routes         []string        `json:"routes"`
	SelectorPath   string          `json:"selectorPath"`
	Tag            string          `json:"tag"`
	Role           *string         `json:"role"`
	AccessibleName *string         `json:"accessibleName"`
	NameFrom       *string         `json:"nameFrom"`
	Message        string          `json:"message"`
	Snippet        string          `json:"snippet"`
	Evidence       json.RawMessage `json:"evidence,omitempty"`
}

// fixReportBuilder gathers the failing rules of one or more page scans, merging an element that fails the same
// rule on several pages into one instance that lists every route
type fixReportBuilder struct {
	rules         map[string]*fixReportRule
	instances     map[string]*fixReportInstance
	failed        map[string]bool
	passed        map[string]bool
	needsRendered map[string]bool
}

// scanFixReportInput is a single-page scan as Gemini's input
func scanFixReportInput(scan models.Scan) (string, error) {
	builder := newFixReportBuilder()
	builder.addPage(scan)

	scannedAt := scan.CreatedAt
	if scan.CompletedAt != nil {
		scannedAt = *scan.CompletedAt
	}
	return builder.encode(fixReportScan{
		Kind:          "SINGLE_PAGE",
		Target:        fixReportTarget(scan),
		PageTitle:     scan.PageTitle,
		Mode:          scan.Mode,
		RuleSet:       scan.RuleSet,
		EngineVersion: scan.EngineVersion,
		ScannedAt:     scannedAt,
		Scores: fixReportScores{
			Overall: scan.OverallScore, Operable: scan.OperableScore, Perceivable: scan.PerceivableScore,
			Stable: scan.StableScore, Discoverable: scan.DiscoverableScore,
		},
		Counts: fixReportCounts{
			Findings: scan.FindingsCount, Critical: scan.CriticalCount, Serious: scan.SeriousCount,
			Moderate: scan.ModerateCount, Minor: scan.MinorCount,
		},
	}, scan.FindingsTruncated)
}

// multiplePageFixReportInput is a multiple-page scan and its completed pages as Gemini's input
func multiplePageFixReportInput(parent models.MultiplePageScan, pages []models.Scan) (string, error) {
	builder := newFixReportBuilder()
	pageData := make([]fixReportPage, 0, len(pages))
	truncated := false
	for _, page := range pages {
		if page.Status != constants.SCAN_STATUS_COMPLETED {
			continue
		}
		builder.addPage(page)
		truncated = truncated || page.FindingsTruncated
		pageURL := page.FinalURL
		if pageURL == nil {
			pageURL = page.TargetURL
		}
		pageData = append(pageData, fixReportPage{
			Route: page.Route, URL: pageURL, PageTitle: page.PageTitle,
			OverallScore: page.OverallScore, Findings: page.FindingsCount,
		})
	}

	target := parent.StartURL
	if parent.Origin != nil {
		target = *parent.Origin
	}
	scannedAt := parent.CreatedAt
	if parent.CompletedAt != nil {
		scannedAt = *parent.CompletedAt
	}
	return builder.encode(fixReportScan{
		Kind:          "MULTIPLE_PAGE",
		Target:        target,
		Mode:          parent.Mode,
		RuleSet:       parent.RuleSet,
		EngineVersion: parent.EngineVersion,
		ScannedAt:     scannedAt,
		Scores: fixReportScores{
			Overall: parent.OverallScore, Operable: parent.OperableScore, Perceivable: parent.PerceivableScore,
			Stable: parent.StableScore, Discoverable: parent.DiscoverableScore,
		},
		Counts: fixReportCounts{
			Findings: parent.FindingsCount, Critical: parent.CriticalCount, Serious: parent.SeriousCount,
			Moderate: parent.ModerateCount, Minor: parent.MinorCount,
		},
		Pages: pageData,
	}, truncated)
}

func newFixReportBuilder() *fixReportBuilder {
	return &fixReportBuilder{
		rules:         map[string]*fixReportRule{},
		instances:     map[string]*fixReportInstance{},
		failed:        map[string]bool{},
		passed:        map[string]bool{},
		needsRendered: map[string]bool{},
	}
}

func (b *fixReportBuilder) addPage(scan models.Scan) {
	for _, result := range scan.RuleResults {
		switch result.Result {
		case engine.ResultFail:
			b.failed[result.RuleID] = true
		case engine.ResultPass:
			b.passed[result.RuleID] = true
		case engine.ResultNeedsRendered:
			b.needsRendered[result.RuleID] = true
		}
	}

	for _, finding := range scan.Findings {
		rule := b.rule(finding.RuleID, finding)
		rule.TotalFindings++
		if !slices.Contains(rule.PagesAffected, scan.Route) {
			rule.PagesAffected = append(rule.PagesAffected, scan.Route)
		}

		key := finding.RuleID + "\x1f" + finding.SelectorPath + "\x1f" + finding.Snippet
		if instance, ok := b.instances[key]; ok {
			if !slices.Contains(instance.Routes, scan.Route) {
				instance.Routes = append(instance.Routes, scan.Route)
			}
			continue
		}
		if len(rule.Instances) >= constants.FIX_REPORT_MAX_INSTANCES_PER_RULE {
			rule.omitted[key] = true
			continue
		}

		instance := &fixReportInstance{
			Routes: []string{scan.Route}, SelectorPath: finding.SelectorPath, Tag: finding.Tag, Role: finding.Role,
			AccessibleName: finding.AccessibleName, NameFrom: finding.NameFrom, Message: finding.Message,
			Snippet: finding.Snippet,
		}
		if evidence := bytes.TrimSpace(finding.Evidence); len(evidence) > 0 && string(evidence) != "{}" && string(evidence) != "null" {
			instance.Evidence = evidence
		}
		b.instances[key] = instance
		rule.Instances = append(rule.Instances, instance)
	}
}

// rule returns the collected rule a finding belongs to, describing it from the catalog on first sight
func (b *fixReportBuilder) rule(ruleID string, finding *models.ScanFinding) *fixReportRule {
	if rule, ok := b.rules[ruleID]; ok {
		return rule
	}
	rule := &fixReportRule{
		ID: ruleID, Name: ruleID, Category: finding.Category, Severity: finding.Severity,
		Instances: []*fixReportInstance{}, omitted: map[string]bool{},
	}
	if meta, ok := rules.Find(ruleID); ok {
		rule.Name, rule.Category, rule.Severity, rule.Priority = meta.Name, meta.Category, meta.Severity, meta.Priority
		rule.WCAG, rule.Summary, rule.Why, rule.Fix = meta.WCAG, meta.Summary, meta.Why, meta.Fix
		rule.FixBefore, rule.FixAfter = meta.FixBefore, meta.FixAfter
	}
	for position, catalogRule := range rules.All() {
		if catalogRule.Meta().ID == ruleID {
			rule.position = position
		}
	}
	b.rules[ruleID] = rule
	return rule
}

// encode orders the failing rules most severe first, then by catalog position, and writes the input as JSON
// with markup left unescaped so Gemini reads snippets as written
func (b *fixReportBuilder) encode(scan fixReportScan, findingsTruncated bool) (string, error) {
	failing := make([]*fixReportRule, 0, len(b.rules))
	for _, rule := range b.rules {
		rule.OmittedInstances = len(rule.omitted)
		failing = append(failing, rule)
	}
	sort.SliceStable(failing, func(i, j int) bool {
		left, right := engine.SeverityWeight(failing[i].Severity), engine.SeverityWeight(failing[j].Severity)
		if left != right {
			return left > right
		}
		return failing[i].position < failing[j].position
	})

	passed := []string{}
	needsRendered := []string{}
	for _, catalogRule := range rules.All() {
		meta := catalogRule.Meta()
		if b.failed[meta.ID] || b.rules[meta.ID] != nil {
			continue
		}
		label := meta.ID + " · " + meta.Name
		if b.passed[meta.ID] {
			passed = append(passed, label)
		} else if b.needsRendered[meta.ID] {
			needsRendered = append(needsRendered, label)
		}
	}

	var buffer bytes.Buffer
	encoder := json.NewEncoder(&buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	err := encoder.Encode(fixReportInput{
		Scan:               scan,
		FailingRules:       failing,
		PassedRules:        passed,
		NeedsRenderedRules: needsRendered,
		FindingsTruncated:  findingsTruncated,
	})
	return buffer.String(), err
}

// fixReportTarget names what a single-page scan looked at
func fixReportTarget(scan models.Scan) string {
	switch {
	case scan.FinalURL != nil:
		return *scan.FinalURL
	case scan.TargetURL != nil:
		return *scan.TargetURL
	case scan.GymPageID != nil:
		return "the optikí Gym page " + *scan.GymPageID
	}
	return "pasted HTML"
}
