package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

type SignInInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

var SignIn = func(c *fiber.Ctx) error {
	user := models.User{}

	input := SignInInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if input.Email == "" || input.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Missing email/password!")
	}

	savedUser, err := user.FindByEmail(input.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid email/password!")
	}

	passwordMatches, err := savedUser.PasswordMatches(input.Password)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if !passwordMatches {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid email/password!")
	}

	sessionData, err := startSession(c, savedUser, constants.SESSION_GENERATED_VIA_SIGN_IN)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":         "success",
		"message":        "Signed in successfully",
		"session":        sessionData,
		"redirectToPath": constants.USER_HOME_PATH,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
