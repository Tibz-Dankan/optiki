package appearance

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

type UpdateAppearanceInput struct {
	Theme string `json:"theme"`
}

var UpdateAppearance = func(c *fiber.Ctx) error {
	appearance := models.Appearance{}
	appearanceID := c.Params("id")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	input := UpdateAppearanceInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if input.Theme == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Theme is required!")
	}
	if !pkg.IsValidTheme(input.Theme) {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid theme! Must be one of light, dark or system.")
	}

	savedAppearance, err := appearance.FindOne(appearanceID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedAppearance.ID == "" || savedAppearance.UserID != user.ID {
		return fiber.NewError(fiber.StatusNotFound, "Appearance of provided ID is not found!")
	}

	savedAppearance.Theme = strings.ToLower(input.Theme)
	updatedAppearance, err := savedAppearance.Update()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Appearance updated successfully!",
		"data":    updatedAppearance,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
