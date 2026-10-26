package scan

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/Tibz-Dankan/optiki/internal/templates"
)

// runFixReport has Gemini turn a queued report's scan into a prompt for a coding agent and stores it
func runFixReport(id string) {
	fixReportModel := models.FixReport{}
	started := time.Now()
	defer func() {
		if recovered := recover(); recovered != nil {
			log.Printf("fix report %s panicked: %v", id, recovered)
			failFixReport(id, "INTERNAL", "The report failed unexpectedly. Generate it again.", started)
		}
	}()

	report, err := fixReportModel.FindOne(id)
	if err != nil || report.ID == "" {
		log.Printf("loading fix report %s: %v", id, err)
		return
	}
	running, err := fixReportModel.MarkRunning(id, started)
	if err != nil || !running {
		if err != nil {
			log.Printf("starting fix report %s: %v", id, err)
		}
		return
	}

	instructions, err := templates.PromptFS.ReadFile("prompt/fix-report.md")
	if err != nil {
		log.Printf("reading the fix report instructions: %v", err)
		failFixReport(id, "INTERNAL", "The report failed unexpectedly. Generate it again.", started)
		return
	}
	input, findingsCovered, err := loadFixReportInput(report)
	if err != nil {
		log.Printf("building the input of fix report %s: %v", id, err)
		failFixReport(id, "INTERNAL", "The scan behind this report could not be loaded.", started)
		return
	}
	client, err := pkg.Gemini()
	if err != nil {
		log.Printf("fix report %s: %v", id, err)
		failFixReport(id, "UNAVAILABLE", constants.ErrFixReportsUnavailable, started)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), constants.FIX_REPORT_TIMEOUT)
	defer cancel()
	response, err := client.Generate(ctx, pkg.GeminiRequest{
		System:    string(instructions),
		Text:      input,
		MaxTokens: constants.FIX_REPORT_MAX_OUTPUT_TOKENS,
	})
	if err != nil {
		log.Printf("generating fix report %s: %v", id, err)
		switch {
		case errors.Is(err, context.DeadlineExceeded):
			failFixReport(id, "TIMEOUT", "Gemini took too long to write this report. Generate it again.", started)
		case pkg.IsGeminiRateLimited(err):
			failFixReport(id, "GEMINI_BUSY", "Gemini is busy right now. Generate the report again in a minute.", started)
		default:
			failFixReport(id, "GENERATION_FAILED", "Gemini couldn't write this report. Generate it again.", started)
		}
		return
	}

	completedAt := time.Now()
	if err := fixReportModel.Complete(id, map[string]interface{}{
		"model":           truncate(response.Model, 64),
		"content":         response.Text,
		"findingsCovered": findingsCovered,
		"inputTokens":     response.InputTokens,
		"outputTokens":    response.OutputTokens,
		"completedAt":     completedAt,
		"durationMs":      int(completedAt.Sub(started).Milliseconds()),
	}); err != nil {
		log.Printf("completing fix report %s: %v", id, err)
	}
}

// loadFixReportInput loads the report's scan, or its multiple-page scan and pages, as Gemini's input
func loadFixReportInput(report models.FixReport) (string, int, error) {
	if report.ScanID != nil {
		scanModel := models.Scan{}
		scan, err := scanModel.FindOne(*report.ScanID)
		if err != nil {
			return "", 0, err
		}
		if scan.ID == "" {
			return "", 0, fmt.Errorf("scan %s not found", *report.ScanID)
		}
		input, err := scanFixReportInput(scan)
		return input, scan.FindingsCount, err
	}

	parentModel := models.MultiplePageScan{}
	parent, err := parentModel.FindOne(*report.MultiplePageScanID)
	if err != nil {
		return "", 0, err
	}
	if parent.ID == "" {
		return "", 0, fmt.Errorf("multiple-page scan %s not found", *report.MultiplePageScanID)
	}
	pages, err := parentModel.FindPagesWithFindings(parent.ID)
	if err != nil {
		return "", 0, err
	}
	input, err := multiplePageFixReportInput(parent, pages)
	return input, parent.FindingsCount, err
}

func failFixReport(id, code, message string, started time.Time) {
	fixReportModel := models.FixReport{}
	if err := fixReportModel.Fail(id, code, message, &started); err != nil {
		log.Printf("marking fix report %s failed: %v", id, err)
	}
}
