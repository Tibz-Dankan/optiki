package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var GetScan = func(c *fiber.Ctx) error {
	scanID := c.Params("id")
	if uuid.Validate(scanID) != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid scan id!")
	}

	scan := models.Scan{}
	savedScan, err := scan.FindOne(scanID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	viewer := viewerID(c)
	isOwner := viewer != "" && savedScan.UserID != nil && *savedScan.UserID == viewer
	_, isToken := c.Locals("apiToken").(models.APIToken)
	visible := isOwner || (!isToken && savedScan.Visibility == constants.SCAN_VISIBILITY_PUBLIC)
	if savedScan.ID == "" || !visible {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrScanNotFound)
	}

	response := fiber.Map{
		"status": "success",
		"data":   scanReportData(c.UserContext(), savedScan, viewer),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
