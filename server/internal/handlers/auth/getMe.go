package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

var GetMe = func(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	session, ok := c.Locals("session").(models.Session)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	response := fiber.Map{
		"status":  "success",
		"user":    userResponseData(user),
		"session": sessionResponseData(session.UserID, session.AccessTokenExpiresAt, session.RefreshTokenExpiresAt),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
