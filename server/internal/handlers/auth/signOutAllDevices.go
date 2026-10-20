package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var SignOutAllDevices = func(c *fiber.Ctx) error {
	session := models.Session{}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	if err := session.RevokeAllByUser(user.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	pkg.ClearAuthCookies(c)

	response := fiber.Map{
		"status":  "success",
		"message": "Signed out of all devices successfully",
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
