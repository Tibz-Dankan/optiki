package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

func fixReportData(report models.FixReport) fiber.Map {
	return fiber.Map{
		"id":                 report.ID,
		"scanID":             report.ScanID,
		"multiplePageScanID": report.MultiplePageScanID,
		"status":             report.Status,
		"triggeredBy":        report.TriggeredBy,
		"model":              report.Model,
		"content":            report.Content,
		"findingsCovered":    report.FindingsCovered,
		"error":              errorData(report.ErrorCode, report.ErrorMessage),
		"timing": fiber.Map{
			"startedAt":   report.StartedAt,
			"completedAt": report.CompletedAt,
			"durationMs":  report.DurationMs,
		},
		"createdAt": report.CreatedAt,
		"updatedAt": report.UpdatedAt,
	}
}
