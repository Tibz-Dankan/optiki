package scan

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var GetMultiplePageScans = func(c *fiber.Ctx) error {
	multiplePageScan := models.MultiplePageScan{}
	limitParam := c.Query("limit")
	cursorParam := c.Query("cursor")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	limit, err := pkg.ValidateQueryLimit(limitParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	scans, err := multiplePageScan.FindAllByUser(user.ID, limit+1, cursorParam)
	if errors.Is(err, models.ErrCursorNotFound) {
		return fiber.NewError(fiber.StatusBadRequest, "Unknown cursor!")
	}
	if err != nil {
		return pkg.ListQueryError(err)
	}

	var nextCursor string = ""
	var hasNextItems bool = false
	if len(scans) > int(limit) {
		scans = scans[:len(scans)-1]
		nextCursor = scans[len(scans)-1].ID
		hasNextItems = true
	}

	data := []fiber.Map{}
	for _, saved := range scans {
		data = append(data, multiplePageScanSummaryData(saved))
	}

	pagination := map[string]interface{}{
		"limit":        limit,
		"nextCursor":   nextCursor,
		"hasNextItems": hasNextItems,
		"count":        len(data),
	}

	response := fiber.Map{
		"status":     "success",
		"data":       data,
		"pagination": pagination,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
