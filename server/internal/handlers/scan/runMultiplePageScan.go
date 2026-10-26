package scan

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/url"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/links"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/rendered"
)

type pageSkip struct {
	URL        string `json:"url"`
	Reason     string `json:"reason"`
	HTTPStatus *int   `json:"httpStatus"`
}

// pageProblem is why a crawled page wasn't scanned; on the start page it fails the whole scan
type pageProblem struct {
	skip    pageSkip
	code    string
	message string
}

type crawl struct {
	parent  models.MultiplePageScan
	set     engine.RuleSet
	origin  string
	queue   []string
	seen    map[string]bool
	scanned map[string]bool
	skipped []pageSkip
}

// runMultiplePageScan crawls a queued multiple-page scan breadth-first from its start URL, scanning each
// public same-site page as an ordinary scan, then stores the averaged scores and queues the fix report
func runMultiplePageScan(id string) {
	parentModel := models.MultiplePageScan{}
	started := time.Now()
	defer func() {
		if recovered := recover(); recovered != nil {
			log.Printf("multiple-page scan %s panicked: %v", id, recovered)
			failMultiplePageScan(id, "INTERNAL", "The scan failed unexpectedly.", started)
		}
	}()

	parent, err := parentModel.FindOne(id)
	if err != nil || parent.ID == "" {
		log.Printf("loading multiple-page scan %s: %v", id, err)
		return
	}
	running, err := parentModel.MarkRunning(id, started)
	if err != nil || !running {
		if err != nil {
			log.Printf("starting multiple-page scan %s: %v", id, err)
		}
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), constants.MULTIPLE_PAGE_SCAN_TIMEOUT)
	defer cancel()

	set, _ := rules.Set(parent.RuleSet)
	crawler := &crawl{
		parent:  parent,
		set:     set,
		queue:   []string{parent.StartURL},
		seen:    map[string]bool{links.Key(parent.StartURL): true},
		scanned: map[string]bool{},
	}

	attempts := 0
	for len(crawler.queue) > 0 && len(crawler.scanned) < parent.MaxPages &&
		attempts < constants.MULTIPLE_PAGE_SCAN_MAX_ATTEMPTS && ctx.Err() == nil {
		target := crawler.queue[0]
		crawler.queue = crawler.queue[1:]
		attempts++

		if problem := crawler.scanPage(ctx, target); problem != nil {
			if attempts == 1 {
				failMultiplePageScan(id, problem.code, problem.message, started)
				return
			}
			crawler.skipped = append(crawler.skipped, problem.skip)
		}
		if err := parentModel.UpdateProgress(id, crawler.progress()); err != nil {
			log.Printf("updating multiple-page scan %s: %v", id, err)
		}
	}

	pages, err := parentModel.FindPages(id)
	if err != nil {
		log.Printf("loading the pages of multiple-page scan %s: %v", id, err)
		failMultiplePageScan(id, "INTERNAL", "The scan could not be saved.", started)
		return
	}
	updates := crawler.progress()
	for key, value := range aggregatePages(pages) {
		updates[key] = value
	}
	completedAt := time.Now()
	updates["limitReached"] = len(crawler.queue) > 0
	updates["completedAt"] = completedAt
	updates["durationMs"] = int(completedAt.Sub(started).Milliseconds())
	if err := parentModel.Complete(id, updates); err != nil {
		log.Printf("completing multiple-page scan %s: %v", id, err)
		return
	}
	if findings, _ := updates["findingsCount"].(int); findings > 0 && pkg.GeminiConfigured() {
		if _, err := queueFixReport(models.FixReport{
			MultiplePageScanID: &id, TriggeredBy: constants.FIX_REPORT_TRIGGERED_BY_SCAN_COMPLETION,
		}); err != nil {
			log.Printf("queueing the fix report of multiple-page scan %s: %v", id, err)
		}
	}
}

// scanPage snapshots one URL, scans it when it is a public page of the site, and queues its same-site links
func (c *crawl) scanPage(ctx context.Context, target string) *pageProblem {
	if _, err := pkg.ValidatePublicURL(ctx, target); err != nil {
		if errors.Is(err, pkg.ErrHostNotFound) {
			return newPageProblem(target, constants.PAGE_SKIP_FAILED, nil, "HOST_NOT_FOUND", "We couldn't find that address.")
		}
		return newPageProblem(target, constants.PAGE_SKIP_BLOCKED, nil, constants.ErrReasonSSRFBlocked, constants.ErrAddressNotAllowed)
	}

	route := routeOf(target)
	pageStarted := time.Now()
	var outcome snapshotOutcome
	var failure *scanFailure
	for retry := 0; ; retry++ {
		outcome, failure = takeSnapshot(ctx, scanRequest{inputType: constants.SCAN_INPUT_URL, url: target, route: route}, c.parent.Mode)
		if failure == nil || !errors.Is(failure.err, rendered.ErrRendererBusy) || retry >= constants.MULTIPLE_PAGE_SCAN_RENDER_RETRIES {
			break
		}
	}
	if failure != nil {
		return newPageProblem(target, skipReason(failure.code), nil, failure.code, errorMessage(failure.err))
	}

	finalURL := target
	if outcome.finalURL != nil {
		finalURL = *outcome.finalURL
	}
	if problem := c.checkPublic(target, finalURL, outcome.httpStatus); problem != nil {
		return problem
	}
	if c.origin == "" {
		c.origin = originOf(finalURL)
	}
	finalKey := links.Key(finalURL)
	c.seen[finalKey] = true
	c.scanned[finalKey] = true

	scanModel := models.Scan{}
	page, err := scanModel.Create(models.Scan{
		UserID:             &c.parent.UserID,
		APITokenID:         c.parent.APITokenID,
		MultiplePageScanID: &c.parent.ID,
		TriggeredBy:        c.parent.TriggeredBy,
		Visibility:         constants.SCAN_VISIBILITY_PRIVATE,
		InputType:          constants.SCAN_INPUT_URL,
		TargetURL:          &target,
		Route:              route,
		Mode:               c.parent.Mode,
		RuleSet:            c.parent.RuleSet,
		EngineVersion:      c.parent.EngineVersion,
		RulesetHash:        c.parent.RulesetHash,
		Status:             constants.SCAN_STATUS_RUNNING,
		StartedAt:          pageStarted,
	})
	if err != nil {
		log.Printf("saving a page of multiple-page scan %s: %v", c.parent.ID, err)
		return newPageProblem(target, constants.PAGE_SKIP_FAILED, nil, "INTERNAL", "The scan could not be saved.")
	}
	if _, err := completeScan(ctx, page.ID, &c.parent.UserID, c.set, outcome, pageStarted); err != nil {
		log.Printf("completing page scan %s of multiple-page scan %s: %v", page.ID, c.parent.ID, err)
	}

	for _, link := range links.Extract(outcome.snapshot, finalURL) {
		key := links.Key(link)
		if c.seen[key] || !links.SameSite(link, c.origin) {
			continue
		}
		c.seen[key] = true
		c.queue = append(c.queue, link)
	}
	return nil
}

// checkPublic turns away pages that need a sign-in, are missing, redirect off the site, or were already scanned
func (c *crawl) checkPublic(target, finalURL string, httpStatus *int) *pageProblem {
	status := 0
	if httpStatus != nil {
		status = *httpStatus
	}
	switch {
	case status == 401 || status == 403:
		return newPageProblem(target, constants.PAGE_SKIP_NOT_PUBLIC, httpStatus, constants.PAGE_SKIP_NOT_PUBLIC,
			fmt.Sprintf("The start page answered HTTP %d, so it isn't public.", status))
	case status == 404 || status == 410:
		return newPageProblem(target, constants.PAGE_SKIP_NOT_FOUND, httpStatus, constants.PAGE_SKIP_NOT_FOUND,
			fmt.Sprintf("The start page answered HTTP %d, so there was nothing to scan.", status))
	case status >= 400:
		return newPageProblem(target, constants.PAGE_SKIP_HTTP_ERROR, httpStatus, constants.PAGE_SKIP_HTTP_ERROR,
			fmt.Sprintf("The start page answered HTTP %d.", status))
	case c.origin != "" && !links.SameSite(finalURL, c.origin):
		return newPageProblem(target, constants.PAGE_SKIP_NOT_PUBLIC, httpStatus, constants.PAGE_SKIP_NOT_PUBLIC,
			"The page redirected to another site.")
	case c.scanned[links.Key(finalURL)]:
		return newPageProblem(target, constants.PAGE_SKIP_DUPLICATE, httpStatus, constants.PAGE_SKIP_DUPLICATE,
			"The page redirected to one that was already scanned.")
	}
	return nil
}

func (c *crawl) progress() map[string]interface{} {
	skipped, _ := json.Marshal(c.skipped)
	if c.skipped == nil {
		skipped = []byte("[]")
	}
	updates := map[string]interface{}{
		"pagesDiscovered": len(c.seen),
		"pagesScanned":    len(c.scanned),
		"pagesSkipped":    len(c.skipped),
		"skipped":         json.RawMessage(skipped),
	}
	if c.origin != "" {
		updates["origin"] = c.origin
	}
	return updates
}

// aggregatePages averages each score over the completed pages that have one, rounding half up, and sums the counts
func aggregatePages(pages []models.Scan) map[string]interface{} {
	scoreColumns := []string{"overallScore", "operableScore", "perceivableScore", "stableScore", "discoverableScore"}
	sums := make([]int, len(scoreColumns))
	counts := make([]int, len(scoreColumns))
	updates := map[string]interface{}{}
	totals := map[string]int{"findingsCount": 0, "criticalCount": 0, "seriousCount": 0, "moderateCount": 0, "minorCount": 0}

	for _, page := range pages {
		if page.Status != constants.SCAN_STATUS_COMPLETED {
			continue
		}
		for index, score := range []*int{page.OverallScore, page.OperableScore, page.PerceivableScore, page.StableScore, page.DiscoverableScore} {
			if score != nil {
				sums[index] += *score
				counts[index]++
			}
		}
		totals["findingsCount"] += page.FindingsCount
		totals["criticalCount"] += page.CriticalCount
		totals["seriousCount"] += page.SeriousCount
		totals["moderateCount"] += page.ModerateCount
		totals["minorCount"] += page.MinorCount
	}

	for index, column := range scoreColumns {
		if counts[index] == 0 {
			continue
		}
		updates[column] = int(math.Floor(float64(sums[index])/float64(counts[index]) + 0.5))
	}
	for column, total := range totals {
		updates[column] = total
	}
	return updates
}

func failMultiplePageScan(id, code, message string, started time.Time) {
	parentModel := models.MultiplePageScan{}
	updates := map[string]interface{}{"durationMs": int(time.Since(started).Milliseconds())}
	if err := parentModel.Fail(id, code, message, updates); err != nil {
		log.Printf("marking multiple-page scan %s failed: %v", id, err)
	}
}

func newPageProblem(target, reason string, httpStatus *int, code, message string) *pageProblem {
	return &pageProblem{skip: pageSkip{URL: target, Reason: reason, HTTPStatus: httpStatus}, code: code, message: message}
}

func skipReason(failureCode string) string {
	switch failureCode {
	case constants.ErrReasonSSRFBlocked:
		return constants.PAGE_SKIP_BLOCKED
	case constants.ErrReasonNotHTML:
		return constants.PAGE_SKIP_NOT_HTML
	case constants.ErrReasonFetchTimeout, constants.ErrReasonRenderTimeout:
		return constants.PAGE_SKIP_TIMEOUT
	}
	return constants.PAGE_SKIP_FAILED
}

func routeOf(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.EscapedPath() == "" {
		return "/"
	}
	return parsed.EscapedPath()
}

func originOf(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	return parsed.Scheme + "://" + parsed.Host
}
