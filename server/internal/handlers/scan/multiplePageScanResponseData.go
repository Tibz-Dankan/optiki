package scan

import (
	"encoding/json"

	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

// multiplePageScanSummaryData is a multiple-page scan without its pages, as create and lists return it
func multiplePageScanSummaryData(scan models.MultiplePageScan) fiber.Map {
	return fiber.Map{
		"id":               scan.ID,
		"multiplePageScan": true,
		"title":            scan.Title,
		"status":           scan.Status,
		"triggeredBy":      scan.TriggeredBy,
		"mode":             scan.Mode,
		"ruleSet":          scan.RuleSet,
		"maxPages":         scan.MaxPages,
		"target": fiber.Map{
			"startURL": scan.StartURL,
			"origin":   scan.Origin,
		},
		"progress": fiber.Map{
			"pagesDiscovered": scan.PagesDiscovered,
			"pagesScanned":    scan.PagesScanned,
			"pagesSkipped":    scan.PagesSkipped,
			"limitReached":    scan.LimitReached,
		},
		"scores": fiber.Map{
			"overall":      scan.OverallScore,
			"operable":     scan.OperableScore,
			"perceivable":  scan.PerceivableScore,
			"stable":       scan.StableScore,
			"discoverable": scan.DiscoverableScore,
		},
		"counts": fiber.Map{
			"findings": scan.FindingsCount,
			"critical": scan.CriticalCount,
			"serious":  scan.SeriousCount,
			"moderate": scan.ModerateCount,
			"minor":    scan.MinorCount,
		},
		"engine": fiber.Map{
			"engineVersion": scan.EngineVersion,
			"rulesetHash":   scan.RulesetHash,
		},
		"timing": fiber.Map{
			"startedAt":   scan.StartedAt,
			"completedAt": scan.CompletedAt,
			"durationMs":  scan.DurationMs,
		},
		"error":     errorData(scan.ErrorCode, scan.ErrorMessage),
		"createdAt": scan.CreatedAt,
		"updatedAt": scan.UpdatedAt,
	}
}

// multiplePageScanReportData adds the scanned pages in crawl order, each rule's result across them, and the
// pages that weren't scanned
func multiplePageScanReportData(scan models.MultiplePageScan, pages []models.Scan, rollup []models.MultiplePageRuleRollup) fiber.Map {
	data := multiplePageScanSummaryData(scan)

	pageData := make([]fiber.Map, 0, len(pages))
	for _, page := range pages {
		pageURL := page.FinalURL
		if pageURL == nil {
			pageURL = page.TargetURL
		}
		pageData = append(pageData, fiber.Map{
			"id":        page.ID,
			"route":     page.Route,
			"url":       pageURL,
			"pageTitle": page.PageTitle,
			"status":    page.Status,
			"scores": fiber.Map{
				"overall":      page.OverallScore,
				"operable":     page.OperableScore,
				"perceivable":  page.PerceivableScore,
				"stable":       page.StableScore,
				"discoverable": page.DiscoverableScore,
			},
			"counts": fiber.Map{
				"findings": page.FindingsCount,
				"critical": page.CriticalCount,
				"serious":  page.SeriousCount,
				"moderate": page.ModerateCount,
				"minor":    page.MinorCount,
			},
			"error": errorData(page.ErrorCode, page.ErrorMessage),
		})
	}

	ruleData := make([]fiber.Map, 0, len(rollup))
	for _, rule := range rollup {
		name := rule.RuleID
		if meta, ok := rules.Find(rule.RuleID); ok {
			name = meta.Name
		}
		ruleData = append(ruleData, fiber.Map{
			"ruleID":       rule.RuleID,
			"name":         name,
			"position":     rule.Position,
			"category":     rule.Category,
			"priority":     rule.Priority,
			"severity":     rule.Severity,
			"pagesFailed":  rule.PagesFailed,
			"pagesChecked": rule.PagesChecked,
			"findings":     rule.Findings,
		})
	}

	skipped := []fiber.Map{}
	if len(scan.Skipped) > 0 {
		_ = json.Unmarshal(scan.Skipped, &skipped)
	}

	data["pages"] = pageData
	data["rules"] = ruleData
	data["skipped"] = skipped
	return data
}
