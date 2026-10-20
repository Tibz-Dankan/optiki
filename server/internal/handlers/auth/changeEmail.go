package auth

import (
	"fmt"
	"log"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

type ChangeEmailInput struct {
	Email string `json:"email"`
}

var ChangeEmail = func(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	input := ChangeEmailInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	input.Email = pkg.NormalizeEmail(input.Email)
	if !pkg.IsValidEmail(input.Email) {
		return fiber.NewError(fiber.StatusBadRequest, "Please provide a valid email address!")
	}
	if user.EmailVerified {
		return fiber.NewError(fiber.StatusBadRequest, "Your email is already verified!")
	}
	if input.Email == user.Email {
		return fiber.NewError(fiber.StatusBadRequest, "New email is the same as the current one!")
	}

	userByEmail, err := user.FindByEmail(input.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if userByEmail.ID != "" {
		return fiber.NewError(fiber.StatusBadRequest, "Email is already registered!")
	}

	user.Email = input.Email
	updatedUser, err := user.Update()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if err := sendVerificationEmail(updatedUser); err != nil {
		log.Println("change email: sending verification email failed:", err)
	} else {
		c.Set("X-Email-Verification-Sent", "true")
	}

	response := fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Email changed! Verification email sent to %s", updatedUser.Email),
		"data":    userResponseData(updatedUser),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
