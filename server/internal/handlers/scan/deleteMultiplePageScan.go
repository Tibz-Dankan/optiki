package scan

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var DeleteMultiplePageScan = func(c *fiber.Ctx) error {
	multiplePageScanID := c.Params("id")
	if uuid.Validate(multiplePageScanID) != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid multiple-page scan id!")
	}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	multiplePageScan := models.MultiplePageScan{}
	deleted, screenshots, err := multiplePageScan.Delete(multiplePageScanID, user.ID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrMultiplePageScanNotFound)
	}
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if deleted.Status == constants.SCAN_STATUS_QUEUED || deleted.Status == constants.SCAN_STATUS_RUNNING {
		return fiber.NewError(fiber.StatusConflict, "Wait for the scan to finish before deleting it!")
	}
	for _, screenshot := range screenshots {
		deleteObject(c.UserContext(), screenshot.Key)
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Multiple-page scan deleted",
		"data":    fiber.Map{"id": multiplePageScanID},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
