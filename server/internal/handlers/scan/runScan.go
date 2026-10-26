package scan

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/gym"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/rendered"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/static"
	"github.com/gofiber/fiber/v2"
)

var s3MissingOnce sync.Once

// scanFailure is how a scan that started can fail: the code stored on the row and the error returned.
type scanFailure struct {
	code string
	err  error
}

type snapshotOutcome struct {
	snapshot      engine.Snapshot
	inputSha256   string
	inputBytes    int
	finalURL      *string
	httpStatus    *int
	contentType   *string
	redirectCount int
	fetchMs       *int
	renderMs      *int
	viewport      *[2]int
	screenshot    []byte
	screenshotW   int
	screenshotH   int
}

// runScan validates the target, records the scan as RUNNING, takes a snapshot (static, fetched or
// rendered), runs the engine, stores the screenshot, and completes the row. Failures after the row exists
// are stored as FAILED, except a busy renderer, whose row is dropped.
func runScan(ctx context.Context, caller scanCaller, request scanRequest) (models.Scan, error) {
	if request.inputType == constants.SCAN_INPUT_URL {
		if _, err := pkg.ValidatePublicURL(ctx, request.url); err != nil {
			return models.Scan{}, preflightError(err)
		}
	}

	mode := engine.ModeStatic
	if request.inputType == constants.SCAN_INPUT_URL && caller.canRender {
		mode = engine.ModeRendered
	}
	set, _ := rules.Set(caller.ruleSet)
	started := time.Now()

	scanModel := models.Scan{}
	saved, err := scanModel.Create(models.Scan{
		UserID:        caller.userID(),
		APITokenID:    caller.apiTokenID(),
		AnonymousID:   request.anonymousID,
		TriggeredBy:   caller.triggeredBy,
		Visibility:    caller.visibility,
		Title:         request.title,
		InputType:     request.inputType,
		TargetURL:     optionalString(request.url),
		GymPageID:     optionalString(request.gymID),
		Route:         request.route,
		Mode:          mode,
		RuleSet:       set.Name,
		EngineVersion: engine.EngineVersion,
		RulesetHash:   engine.RulesetHash(set),
		Status:        constants.SCAN_STATUS_RUNNING,
		StartedAt:     started,
		Repository:    request.repository,
		Branch:        request.branch,
		CommitSHA:     request.commitSHA,
		PRNumber:      request.prNumber,
		RunURL:        request.runURL,
	})
	if err != nil {
		return models.Scan{}, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	outcome, failure := takeSnapshot(ctx, request, mode)
	if failure != nil {
		if errors.Is(failure.err, rendered.ErrRendererBusy) {
			if deleteErr := scanModel.DeleteRunning(saved.ID); deleteErr != nil {
				log.Println("dropping a busy-renderer scan row failed:", deleteErr)
			}
			return models.Scan{}, failure.err
		}
		if failErr := scanModel.Fail(saved.ID, failure.code, errorMessage(failure.err), started); failErr != nil {
			log.Println("marking scan failed:", failErr)
		}
		return models.Scan{}, failure.err
	}

	return completeScan(ctx, saved.ID, caller.userID(), set, outcome, started)
}

// completeScan analyses a scan's snapshot, stores its screenshot, and writes the finished scan
func completeScan(ctx context.Context, scanID string, userID *string, set engine.RuleSet, outcome snapshotOutcome, started time.Time) (models.Scan, error) {
	scanModel := models.Scan{}
	analyzeStarted := time.Now()
	report := engine.Scan(outcome.snapshot, set)
	analyzeMs := int(time.Since(analyzeStarted).Milliseconds())

	screenshot := storeScreenshot(ctx, scanID, userID, outcome)
	completion := buildCompletion(scanID, report, outcome, started, analyzeMs)
	completion.Screenshot = screenshot
	if err := scanModel.Complete(scanID, completion); err != nil {
		if screenshot != nil {
			deleteObject(ctx, screenshot.Key)
		}
		if failErr := scanModel.Fail(scanID, "INTERNAL", "The scan could not be saved.", started); failErr != nil {
			log.Println("marking scan failed:", failErr)
		}
		return models.Scan{}, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	completed, err := scanModel.FindOne(scanID)
	if err != nil {
		return models.Scan{}, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return completed, nil
}

func takeSnapshot(ctx context.Context, request scanRequest, mode string) (snapshotOutcome, *scanFailure) {
	switch {
	case request.inputType == constants.SCAN_INPUT_HTML:
		return staticOutcome(static.Build(request.html, "", request.route), request.html), nil

	case request.inputType == constants.SCAN_INPUT_GYM:
		page, _ := gym.Page(request.gymID)
		return staticOutcome(static.Build(page, "", request.route), page), nil

	case mode == engine.ModeRendered:
		snapshot, result, err := rendered.Build(ctx, request.url, request.route)
		if err != nil {
			return snapshotOutcome{}, classify(err)
		}
		renderMs, status, viewport := result.RenderMs, result.HTTPStatus, [2]int{result.ViewportWidth, result.ViewportHeight}
		return snapshotOutcome{
			snapshot:      snapshot,
			inputSha256:   result.InputSha256,
			inputBytes:    result.InputBytes,
			finalURL:      optionalString(result.FinalURL),
			httpStatus:    &status,
			contentType:   optionalString(result.ContentType),
			redirectCount: result.RedirectCount,
			renderMs:      &renderMs,
			viewport:      &viewport,
			screenshot:    result.Screenshot,
			screenshotW:   result.ScreenshotWidth,
			screenshotH:   result.ScreenshotHeight,
		}, nil

	default:
		page, err := pkg.FetchPublicPage(ctx, request.url)
		if err != nil {
			return snapshotOutcome{}, classify(err)
		}
		outcome := staticOutcome(static.Build(string(page.Body), page.FinalURL, request.route), string(page.Body))
		fetchMs, status := int(page.Duration.Milliseconds()), page.StatusCode
		outcome.fetchMs = &fetchMs
		outcome.httpStatus = &status
		outcome.finalURL = optionalString(page.FinalURL)
		outcome.contentType = optionalString(page.ContentType)
		outcome.redirectCount = page.Redirects
		return outcome, nil
	}
}

func staticOutcome(snapshot engine.Snapshot, source string) snapshotOutcome {
	sum := sha256.Sum256([]byte(source))
	return snapshotOutcome{snapshot: snapshot, inputSha256: hex.EncodeToString(sum[:]), inputBytes: len(source)}
}

// preflightError answers a URL that fails before any work starts; no scan row is created
func preflightError(err error) error {
	if errors.Is(err, pkg.ErrHostNotFound) {
		return fiber.NewError(fiber.StatusBadRequest, "We couldn't find that address. Check the spelling and try again.")
	}
	return pkg.NewReasonError(fiber.StatusBadRequest, constants.ErrReasonSSRFBlocked, constants.ErrAddressNotAllowed)
}

func classify(err error) *scanFailure {
	switch {
	case errors.Is(err, pkg.ErrBlockedAddress):
		return &scanFailure{constants.ErrReasonSSRFBlocked, pkg.NewReasonError(fiber.StatusBadRequest, constants.ErrReasonSSRFBlocked, constants.ErrAddressNotAllowed)}
	case errors.Is(err, pkg.ErrNotHTML):
		return &scanFailure{constants.ErrReasonNotHTML, pkg.NewReasonError(fiber.StatusUnprocessableEntity, constants.ErrReasonNotHTML, "That address didn't return an HTML page.")}
	case errors.Is(err, pkg.ErrPageTooLarge):
		return &scanFailure{constants.ErrReasonTooLarge, pkg.NewReasonError(fiber.StatusRequestEntityTooLarge, constants.ErrReasonTooLarge, "That page is larger than 2 MB.")}
	case errors.Is(err, pkg.ErrFetchTimeout):
		return &scanFailure{constants.ErrReasonFetchTimeout, pkg.NewReasonError(fiber.StatusUnprocessableEntity, constants.ErrReasonFetchTimeout, "That page took too long to load.")}
	case errors.Is(err, rendered.ErrRenderTimeout):
		return &scanFailure{constants.ErrReasonRenderTimeout, pkg.NewReasonError(fiber.StatusUnprocessableEntity, constants.ErrReasonRenderTimeout, "That page took too long to render.")}
	case errors.Is(err, rendered.ErrRendererBusy):
		return &scanFailure{constants.ErrReasonRendererBusy, pkg.NewReasonError(fiber.StatusTooManyRequests, constants.ErrReasonRendererBusy, "Every renderer is busy. Try again in a few seconds.")}
	case errors.Is(err, pkg.ErrHostNotFound):
		return &scanFailure{"HOST_NOT_FOUND", fiber.NewError(fiber.StatusUnprocessableEntity, "We couldn't find that address.")}
	case errors.Is(err, pkg.ErrTooManyRedirects):
		return &scanFailure{"TOO_MANY_REDIRECTS", fiber.NewError(fiber.StatusUnprocessableEntity, "That address redirected too many times.")}
	case errors.Is(err, pkg.ErrFetchFailed):
		return &scanFailure{"FETCH_FAILED", fiber.NewError(fiber.StatusUnprocessableEntity, "That page could not be loaded.")}
	case errors.Is(err, rendered.ErrRenderFailed):
		log.Println("render failed:", err)
		return &scanFailure{"RENDER_FAILED", fiber.NewError(fiber.StatusUnprocessableEntity, "That page could not be rendered.")}
	}
	return &scanFailure{"INTERNAL", fiber.NewError(fiber.StatusInternalServerError, err.Error())}
}

func errorMessage(err error) string {
	var reason *pkg.ReasonError
	if errors.As(err, &reason) {
		return reason.Message
	}
	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) && fiberErr.Code < 500 {
		return fiberErr.Message
	}
	return "The scan failed unexpectedly."
}

// storeScreenshot uploads a rendered scan's screenshot; a scan never fails because of it
func storeScreenshot(ctx context.Context, scanID string, userID *string, outcome snapshotOutcome) *models.Attachment {
	if len(outcome.screenshot) == 0 {
		return nil
	}
	if !pkg.S3Configured() {
		s3MissingOnce.Do(func() { log.Println("S3 isn't configured, so rendered scans are stored without screenshots") })
		return nil
	}
	client, err := pkg.S3()
	if err != nil {
		log.Println("screenshot upload skipped:", err)
		return nil
	}
	key := "scan-screenshots/" + scanID + ".jpg"
	if err := client.PutObject(ctx, key, outcome.screenshot, "image/jpeg"); err != nil {
		log.Printf("uploading the screenshot of scan %s failed: %v", scanID, err)
		return nil
	}
	width, height := outcome.screenshotW, outcome.screenshotH
	return &models.Attachment{
		UserID:      userID,
		Type:        constants.ATTACHMENT_TYPE_SCAN_SCREENSHOT,
		Key:         key,
		ContentType: "image/jpeg",
		Size:        int64(len(outcome.screenshot)),
		Width:       &width,
		Height:      &height,
	}
}

func deleteObject(ctx context.Context, key string) {
	client, err := pkg.S3()
	if err != nil {
		return
	}
	if err := client.DeleteObject(ctx, key); err != nil {
		log.Printf("deleting S3 object %s failed: %v", key, err)
	}
}

func buildCompletion(scanID string, report engine.Report, outcome snapshotOutcome, started time.Time, analyzeMs int) models.ScanCompletion {
	completedAt := time.Now()
	updates := map[string]interface{}{
		"status":             constants.SCAN_STATUS_COMPLETED,
		"completedAt":        completedAt,
		"durationMs":         int(completedAt.Sub(started).Milliseconds()),
		"analyzeMs":          analyzeMs,
		"fetchMs":            outcome.fetchMs,
		"renderMs":           outcome.renderMs,
		"inputSha256":        outcome.inputSha256,
		"inputBytes":         outcome.inputBytes,
		"finalURL":           outcome.finalURL,
		"httpStatus":         outcome.httpStatus,
		"contentType":        outcome.contentType,
		"redirectCount":      outcome.redirectCount,
		"pageTitle":          optionalString(report.Title),
		"pageLang":           optionalString(report.Lang),
		"reportHash":         report.ReportHash,
		"nodeCount":          report.NodeCount,
		"controlCount":       report.ControlCount,
		"overallScore":       report.Scores.Overall,
		"operableScore":      report.Scores.Operable,
		"perceivableScore":   report.Scores.Perceivable,
		"stableScore":        report.Scores.Stable,
		"discoverableScore":  report.Scores.Discoverable,
		"findingsCount":      report.Counts.Findings,
		"criticalCount":      report.Counts.Critical,
		"seriousCount":       report.Counts.Serious,
		"moderateCount":      report.Counts.Moderate,
		"minorCount":         report.Counts.Minor,
		"rulesPassed":        report.Counts.RulesPassed,
		"rulesFailed":        report.Counts.RulesFailed,
		"rulesNotApplicable": report.Counts.RulesNotApplicable,
		"rulesNeedRendered":  report.Counts.RulesNeedRendered,
		"findingsTruncated":  len(report.Findings) > constants.MAX_FINDINGS_PER_SCAN,
	}
	if outcome.viewport != nil {
		updates["viewportWidth"] = outcome.viewport[0]
		updates["viewportHeight"] = outcome.viewport[1]
	}

	results := make([]models.ScanRuleResult, 0, len(report.Rules))
	for _, rule := range report.Rules {
		results = append(results, models.ScanRuleResult{
			ScanID: scanID, RuleID: rule.RuleID, Position: rule.Position, Category: rule.Category,
			Priority: rule.Priority, Severity: rule.Severity, Weight: rule.Weight, Result: rule.Result,
			FindingsCount: rule.FindingsCount,
		})
	}

	kept := report.Findings
	if len(kept) > constants.MAX_FINDINGS_PER_SCAN {
		kept = kept[:constants.MAX_FINDINGS_PER_SCAN]
	}
	findings := make([]models.ScanFinding, 0, len(kept))
	for _, finding := range kept {
		evidence, _ := json.Marshal(finding.Evidence)
		findings = append(findings, models.ScanFinding{
			ScanID: scanID, RuleID: finding.RuleID, Category: finding.Category, Severity: finding.Severity,
			Fingerprint: finding.Fingerprint, Position: finding.Position, DocumentOrder: finding.DocumentOrder,
			SelectorPath: truncate(finding.SelectorPath, 1024), Tag: truncate(finding.Tag, 32),
			Role: optionalString(truncate(finding.Role, 64)), AccessibleName: optionalString(truncate(finding.AccessibleName, 512)),
			NameFrom: optionalString(finding.NameFrom), Snippet: finding.Snippet, Message: truncate(finding.Message, 512),
			Evidence: evidence,
		})
	}
	return models.ScanCompletion{Updates: updates, RuleResults: results, Findings: findings}
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func truncate(value string, limit int) string {
	runes := []rune(value)
	if len(runes) <= limit {
		return value
	}
	return string(runes[:limit-1]) + "…"
}
