package auth

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

type VerifyEmailInput struct {
	Token string `json:"token"`
}

var VerifyEmail = func(c *fiber.Ctx) error {
	user := models.User{}
	otp := models.OTP{}

	input := VerifyEmailInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if input.Token == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Missing verification token!")
	}

	savedOTP, err := otp.FindByCode(input.Token, constants.OTP_TYPE_VERIFY_EMAIL)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedOTP.ID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid verification link!")
	}

	savedUser, err := user.FindOne(savedOTP.UserID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid verification link!")
	}

	if savedUser.EmailVerified {
		response := fiber.Map{
			"status":          "success",
			"message":         "Email already verified!",
			"alreadyVerified": true,
		}
		return c.Status(fiber.StatusOK).JSON(response)
	}

	if savedOTP.IsUsed || savedOTP.ExpiresAt.Before(time.Now()) {
		return fiber.NewError(fiber.StatusBadRequest, "Already used or expired verification link!")
	}

	savedOTP.IsUsed = true
	savedOTP.ExpiresAt = time.Now()
	if _, err := savedOTP.Update(); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if _, err := savedUser.MarkEmailVerified(); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":          "success",
		"message":         "Email verified successfully!",
		"alreadyVerified": false,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
