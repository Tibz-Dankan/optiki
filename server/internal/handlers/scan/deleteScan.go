package scan

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var DeleteScan = func(c *fiber.Ctx) error {
	scanID := c.Params("id")
	if uuid.Validate(scanID) != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid scan id!")
	}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	scan := models.Scan{}
	screenshot, err := scan.Delete(scanID, user.ID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrScanNotFound)
	}
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if screenshot != nil {
		deleteObject(c.UserContext(), screenshot.Key)
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Scan deleted",
		"data":    fiber.Map{"id": scanID},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
