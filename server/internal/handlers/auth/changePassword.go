package auth

import (
	"fmt"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

type ChangePasswordInput struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

var ChangePassword = func(c *fiber.Ctx) error {
	userID := c.Params("id")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}
	if userID != user.ID {
		return fiber.NewError(fiber.StatusForbidden, constants.ErrNotPermitted)
	}

	input := ChangePasswordInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if input.CurrentPassword == "" || input.NewPassword == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Missing current/new password!")
	}
	if len(input.NewPassword) < constants.MIN_PASSWORD_LENGTH {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("Password must be at least %d characters!", constants.MIN_PASSWORD_LENGTH))
	}
	if input.CurrentPassword == input.NewPassword {
		return fiber.NewError(fiber.StatusBadRequest, "New password is same as current password!")
	}

	passwordMatches, err := user.PasswordMatches(input.CurrentPassword)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if !passwordMatches {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid current password!")
	}

	if err := user.SetPassword(input.NewPassword); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Password changed successfully!",
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
