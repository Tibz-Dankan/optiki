package scan

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UpdateScanInput struct {
	Title      *string `json:"title"`
	Visibility *string `json:"visibility"`
}

var UpdateScan = func(c *fiber.Ctx) error {
	scanID := c.Params("id")
	if uuid.Validate(scanID) != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid scan id!")
	}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	input := UpdateScanInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	scan := models.Scan{}
	savedScan, err := scan.FindOne(scanID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedScan.ID == "" || savedScan.UserID == nil || *savedScan.UserID != user.ID {
		return fiber.NewError(fiber.StatusNotFound, constants.ErrScanNotFound)
	}

	updates := map[string]interface{}{}
	if input.Title != nil {
		title := strings.TrimSpace(*input.Title)
		if len([]rune(title)) > constants.MAX_SCAN_TITLE_LENGTH {
			return fiber.NewError(fiber.StatusBadRequest, "The title must be at most 120 characters!")
		}
		if title == "" {
			updates["title"] = nil
		} else {
			updates["title"] = title
		}
	}
	if input.Visibility != nil {
		visibility := strings.ToUpper(strings.TrimSpace(*input.Visibility))
		if visibility != constants.SCAN_VISIBILITY_PRIVATE && visibility != constants.SCAN_VISIBILITY_PUBLIC {
			return fiber.NewError(fiber.StatusBadRequest, "The visibility must be PRIVATE or PUBLIC!")
		}
		updates["visibility"] = visibility
	}
	if len(updates) == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "Provide a title or a visibility to change!")
	}

	if err := scan.UpdateDetails(scanID, updates); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	updatedScan, err := scan.FindOne(scanID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Scan updated",
		"data":    scanSummaryData(c.UserContext(), updatedScan, user.ID),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
