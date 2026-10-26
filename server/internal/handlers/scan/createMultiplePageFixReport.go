package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var CreateMultiplePageFixReport = func(c *fiber.Ctx) error {
	multiplePageScanID := c.Params("id")
	if uuid.Validate(multiplePageScanID) != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid multiple-page scan id!")
	}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	multiplePageScan := models.MultiplePageScan{}
	saved, err := multiplePageScan.FindOne(multiplePageScanID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if saved.ID == "" || saved.UserID != user.ID {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrMultiplePageScanNotFound)
	}
	if !pkg.GeminiConfigured() {
		return pkg.NewReasonError(fiber.StatusServiceUnavailable, constants.ErrReasonFixReportsUnavailable, constants.ErrFixReportsUnavailable)
	}
	if saved.Status != constants.SCAN_STATUS_COMPLETED {
		return fiber.NewError(fiber.StatusUnprocessableEntity, constants.ErrScanNotCompleted)
	}
	if saved.FindingsCount == 0 {
		return pkg.NewReasonError(fiber.StatusUnprocessableEntity, constants.ErrReasonNoFindings, constants.ErrNoFindingsToFix)
	}

	report, err := queueFixReport(models.FixReport{MultiplePageScanID: &saved.ID, TriggeredBy: fixReportTriggeredBy(c)})
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
