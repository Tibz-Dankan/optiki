package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var GetMultiplePageFixReport = func(c *fiber.Ctx) error {
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

	fixReport := models.FixReport{}
	report, err := fixReport.FindByMultiplePageScan(saved.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	var data fiber.Map
	if report.ID != "" {
		data = fixReportData(report)
	}

	response := fiber.Map{
		"status": "success",
		"data":   data,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
