package scan

import (
	"log"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// createMultiplePageScan queues a crawl from the request's URL and answers at once; the pages are scanned
// in the background
func createMultiplePageScan(c *fiber.Ctx, caller scanCaller, request scanRequest) error {
	if _, err := pkg.ValidatePublicURL(c.UserContext(), request.url); err != nil {
		return preflightError(err)
	}

	mode := engine.ModeStatic
	if caller.canRender {
		mode = engine.ModeRendered
	}
	set, _ := rules.Set(caller.ruleSet)

	multiplePageScan := models.MultiplePageScan{}
	saved, err := multiplePageScan.Create(models.MultiplePageScan{
		UserID:        caller.user.ID,
		APITokenID:    caller.apiTokenID(),
		TriggeredBy:   caller.triggeredBy,
		Title:         request.title,
		StartURL:      request.url,
		Mode:          mode,
		RuleSet:       set.Name,
		EngineVersion: engine.EngineVersion,
		RulesetHash:   engine.RulesetHash(set),
		MaxPages:      constants.MULTIPLE_PAGE_SCAN_MAX_PAGES,
		Status:        constants.SCAN_STATUS_QUEUED,
	})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if !enqueueMultiplePageScan(saved.ID) {
		if err := multiplePageScan.DeleteQueued(saved.ID); err != nil {
			log.Println("dropping a multiple-page scan the queue refused failed:", err)
		}
		c.Set(fiber.HeaderRetryAfter, constants.MULTIPLE_PAGE_SCAN_QUEUE_RETRY_AFTER)
		return pkg.NewReasonError(fiber.StatusTooManyRequests, constants.ErrReasonScanQueueFull, constants.ErrScanQueueFull)
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Multiple-page scan started",
		"data":    multiplePageScanSummaryData(saved),
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}
