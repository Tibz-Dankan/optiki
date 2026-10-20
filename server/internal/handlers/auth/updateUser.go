package auth

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

type UpdateUserInput struct {
	Name string `json:"name"`
}

var UpdateUser = func(c *fiber.Ctx) error {
	userID := c.Params("id")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}
	if userID != user.ID {
		return fiber.NewError(fiber.StatusForbidden, constants.ErrNotPermitted)
	}

	input := UpdateUserInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Name is required!")
	}

	user.Name = input.Name
	updatedUser, err := user.Update()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Profile updated successfully!",
		"data":    userResponseData(updatedUser),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
