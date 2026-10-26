package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var GetFixReport = func(c *fiber.Ctx) error {
	scanID := c.Params("id")
	if uuid.Validate(scanID) != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid scan id!")
	}

	scan := models.Scan{}
	savedScan, err := scan.FindSummary(scanID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedScan.ID == "" || !canViewScan(c, savedScan) {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrScanNotFound)
	}

	fixReport := models.FixReport{}
	report, err := fixReport.FindByScan(savedScan.ID)
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
