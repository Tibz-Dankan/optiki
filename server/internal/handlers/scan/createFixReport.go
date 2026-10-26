package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var CreateFixReport = func(c *fiber.Ctx) error {
	scanID := c.Params("id")
	if uuid.Validate(scanID) != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid scan id!")
	}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	scan := models.Scan{}
	savedScan, err := scan.FindSummary(scanID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedScan.ID == "" || savedScan.UserID == nil || *savedScan.UserID != user.ID {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrScanNotFound)
	}
	if !pkg.GeminiConfigured() {
		return pkg.NewReasonError(fiber.StatusServiceUnavailable, constants.ErrReasonFixReportsUnavailable, constants.ErrFixReportsUnavailable)
	}
	if savedScan.Status != constants.SCAN_STATUS_COMPLETED {
		return fiber.NewError(fiber.StatusUnprocessableEntity, constants.ErrScanNotCompleted)
	}
	if savedScan.FindingsCount == 0 {
		return pkg.NewReasonError(fiber.StatusUnprocessableEntity, constants.ErrReasonNoFindings, constants.ErrNoFindingsToFix)
	}

	report, err := queueFixReport(models.FixReport{ScanID: &savedScan.ID, TriggeredBy: fixReportTriggeredBy(c)})
	if err != nil {
		return fixReportQueueError(c, err)
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Fix report queued",
		"data":    fixReportData(report),
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}
