package appearance

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

var GetMyAppearance = func(c *fiber.Ctx) error {
	appearance := models.Appearance{}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	savedAppearance, err := appearance.FindByUser(user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedAppearance.ID == "" {
		return fiber.NewError(fiber.StatusNotFound, "Appearance not found for this user!")
	}

	response := fiber.Map{
		"status": "success",
		"data":   savedAppearance,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
