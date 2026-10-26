package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var GetMultiplePageScan = func(c *fiber.Ctx) error {
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

	pages, err := multiplePageScan.FindPages(saved.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	rollup, err := multiplePageScan.RuleRollup(saved.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status": "success",
		"data":   multiplePageScanReportData(saved, pages, rollup),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
