package scan

import (
	"context"
	"encoding/json"

	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

// scanSummaryData is a scan without its rule results and findings, as lists return it
func scanSummaryData(ctx context.Context, scan models.Scan, viewerID string) fiber.Map {
	return fiber.Map{
		"id":                 scan.ID,
		"multiplePageScan":   false,
		"multiplePageScanID": scan.MultiplePageScanID,
		"title":              scan.Title,
		"visibility":         scan.Visibility,
		"status":             scan.Status,
		"triggeredBy":        scan.TriggeredBy,
		"inputType":          scan.InputType,
		"mode":               scan.Mode,
		"ruleSet":            scan.RuleSet,
		"isOwner":            viewerID != "" && scan.UserID != nil && *scan.UserID == viewerID,
		"target": fiber.Map{
			"url":           scan.TargetURL,
			"finalURL":      scan.FinalURL,
			"gymPageID":     scan.GymPageID,
			"route":         scan.Route,
			"httpStatus":    scan.HTTPStatus,
			"contentType":   scan.ContentType,
			"redirectCount": scan.RedirectCount,
			"pageTitle":     scan.PageTitle,
			"pageLang":      scan.PageLang,
			"inputSha256":   scan.InputSha256,
			"inputBytes":    scan.InputBytes,
		},
		"scores": fiber.Map{
			"overall":      scan.OverallScore,
			"operable":     scan.OperableScore,
			"perceivable":  scan.PerceivableScore,
			"stable":       scan.StableScore,
			"discoverable": scan.DiscoverableScore,
		},
		"counts": fiber.Map{
			"findings":           scan.FindingsCount,
			"critical":           scan.CriticalCount,
			"serious":            scan.SeriousCount,
			"moderate":           scan.ModerateCount,
			"minor":              scan.MinorCount,
			"rulesPassed":        scan.RulesPassed,
			"rulesFailed":        scan.RulesFailed,
			"rulesNotApplicable": scan.RulesNotApplicable,
			"rulesNeedRendered":  scan.RulesNeedRendered,
			"findingsTruncated":  scan.FindingsTruncated,
		},
		"engine": fiber.Map{
			"engineVersion": scan.EngineVersion,
			"rulesetHash":   scan.RulesetHash,
			"reportHash":    scan.ReportHash,
			"nodeCount":     scan.NodeCount,
			"controlCount":  scan.ControlCount,
			"viewport":      viewportData(scan),
		},
		"ci": fiber.Map{
			"repository": scan.Repository,
			"branch":     scan.Branch,
			"commitSHA":  scan.CommitSHA,
			"prNumber":   scan.PRNumber,
			"runURL":     scan.RunURL,
		},
		"timing": fiber.Map{
			"startedAt":   scan.StartedAt,
			"completedAt": scan.CompletedAt,
			"durationMs":  scan.DurationMs,
			"fetchMs":     scan.FetchMs,
			"renderMs":    scan.RenderMs,
			"analyzeMs":   scan.AnalyzeMs,
		},
		"error":      errorData(scan.ErrorCode, scan.ErrorMessage),
		"screenshot": screenshotData(ctx, scan),
		"createdAt":  scan.CreatedAt,
		"updatedAt":  scan.UpdatedAt,
	}
}

// scanReportData is the full report: the summary plus rule results and findings in report order
func scanReportData(ctx context.Context, scan models.Scan, viewerID string) fiber.Map {
	data := scanSummaryData(ctx, scan, viewerID)

	ruleResults := make([]fiber.Map, 0, len(scan.RuleResults))
	for _, result := range scan.RuleResults {
		name := result.RuleID
		if meta, ok := rules.Find(result.RuleID); ok {
			name = meta.Name
		}
		ruleResults = append(ruleResults, fiber.Map{
			"ruleID":        result.RuleID,
			"name":          name,
			"position":      result.Position,
			"category":      result.Category,
			"priority":      result.Priority,
			"severity":      result.Severity,
			"weight":        result.Weight,
			"result":        result.Result,
			"findingsCount": result.FindingsCount,
		})
	}

	findings := make([]fiber.Map, 0, len(scan.Findings))
	for _, finding := range scan.Findings {
		var evidence any = fiber.Map{}
		if len(finding.Evidence) > 0 {
			_ = json.Unmarshal(finding.Evidence, &evidence)
		}
		findings = append(findings, fiber.Map{
			"id":             finding.ID,
			"ruleID":         finding.RuleID,
			"category":       finding.Category,
			"severity":       finding.Severity,
			"fingerprint":    finding.Fingerprint,
			"position":       finding.Position,
			"selectorPath":   finding.SelectorPath,
			"tag":            finding.Tag,
			"role":           finding.Role,
			"accessibleName": finding.AccessibleName,
			"nameFrom":       finding.NameFrom,
			"snippet":        finding.Snippet,
			"message":        finding.Message,
			"evidence":       evidence,
		})
	}

	data["rules"] = ruleResults
	data["findings"] = findings
	return data
}

func errorData(code, message *string) fiber.Map {
	if code == nil {
		return nil
	}
	text := ""
	if message != nil {
		text = *message
	}
	return fiber.Map{"code": *code, "message": text}
}

func viewportData(scan models.Scan) fiber.Map {
	if scan.ViewportWidth == nil || scan.ViewportHeight == nil {
		return nil
	}
	return fiber.Map{"width": *scan.ViewportWidth, "height": *scan.ViewportHeight}
}
