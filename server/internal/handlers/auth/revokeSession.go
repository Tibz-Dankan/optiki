package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var RevokeSession = func(c *fiber.Ctx) error {
	session := models.Session{}
	sessionID := c.Params("sessionID")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}
	currentSession, _ := c.Locals("session").(models.Session)

	savedSession, err := session.FindOne(sessionID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedSession.ID == "" || savedSession.UserID != user.ID {
		return fiber.NewError(fiber.StatusNotFound, "Session of provided ID is not found!")
	}
	if savedSession.IsRevoked {
		return fiber.NewError(fiber.StatusBadRequest, "Session is already revoked!")
	}

	if err := session.Revoke(savedSession.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	isCurrentSession := savedSession.ID == currentSession.ID
	if isCurrentSession {
		pkg.ClearAuthCookies(c)
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Session revoked successfully!",
		"data": fiber.Map{
			"id":               savedSession.ID,
			"isCurrentSession": isCurrentSession,
		},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
