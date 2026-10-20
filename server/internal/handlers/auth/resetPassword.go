package auth

import (
	"fmt"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

type ResetPasswordInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

var ResetPassword = func(c *fiber.Ctx) error {
	user := models.User{}
	otp := models.OTP{}
	session := models.Session{}
	code := c.Params("otp")

	input := ResetPasswordInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if input.Email == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Please provide your email!")
	}
	if len(input.Password) < constants.MIN_PASSWORD_LENGTH {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("Password must be at least %d characters!", constants.MIN_PASSWORD_LENGTH))
	}

	savedUser, err := user.FindByEmail(input.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid OTP!")
	}

	savedOTP, err := otp.FindByUserAndCode(savedUser.ID, code, constants.OTP_TYPE_RESET_PASSWORD)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedOTP.ID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid OTP!")
	}
	if savedOTP.IsUsed || !savedOTP.IsVerified || savedOTP.ExpiresAt.Before(time.Now()) {
		return fiber.NewError(fiber.StatusBadRequest, "OTP is already used, unverified or expired!")
	}

	if err := savedUser.SetPassword(input.Password); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	savedOTP.IsUsed = true
	savedOTP.ExpiresAt = time.Now()
	if _, err := savedOTP.Update(); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if !savedUser.EmailVerified {
		if savedUser, err = savedUser.MarkEmailVerified(); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
	}

	if err := session.RevokeAllByUser(savedUser.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	sessionData, err := startSession(c, savedUser, constants.SESSION_GENERATED_VIA_RESET_PASSWORD)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":         "success",
		"message":        "Password reset successfully!",
		"session":        sessionData,
		"redirectToPath": constants.USER_HOME_PATH,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
