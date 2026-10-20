package auth

import (
	"log"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

type ForgotPasswordInput struct {
	Email string `json:"email"`
}

var ForgotPassword = func(c *fiber.Ctx) error {
	user := models.User{}
	otp := models.OTP{}

	input := ForgotPasswordInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	input.Email = pkg.NormalizeEmail(input.Email)
	if input.Email == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Please provide your email!")
	}

	response := fiber.Map{
		"status":  "success",
		"message": "If an account exists for that email, we've sent a reset code",
	}

	savedUser, err := user.FindByEmail(input.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		return c.Status(fiber.StatusOK).JSON(response)
	}

	code, err := otp.Create(models.OTP{UserID: savedUser.ID, Type: constants.OTP_TYPE_RESET_PASSWORD})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	email := pkg.Email{Recipient: savedUser.Email}
	if err := email.SendResetPassword(savedUser.Name, code); err != nil {
		log.Println("forgot password: sending reset password email failed:", err)
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
