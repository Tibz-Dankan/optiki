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

	if savedScan.ID == "" || !canViewScan(c, savedScan) {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrScanNotFound)
	}

	response := fiber.Map{
		"status": "success",
		"data":   scanReportData(c.UserContext(), savedScan, viewerID(c)),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
