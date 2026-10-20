package appearance

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

type CreateAppearanceInput struct {
	Theme string `json:"theme"`
}

var CreateAppearance = func(c *fiber.Ctx) error {
	appearance := models.Appearance{}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	input := CreateAppearanceInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if input.Theme == "" {
		input.Theme = constants.DEFAULT_THEME
	}
	if !pkg.IsValidTheme(input.Theme) {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid theme! Must be one of light, dark or system.")
	}

	savedAppearance, err := appearance.FindByUser(user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedAppearance.ID != "" {
		return fiber.NewError(fiber.StatusConflict, "Appearance already exists for this user!")
	}

	newAppearance, err := appearance.Create(models.Appearance{
		UserID: user.ID,
		Theme:  strings.ToLower(input.Theme),
	})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Appearance created successfully!",
		"data":    newAppearance,
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}
