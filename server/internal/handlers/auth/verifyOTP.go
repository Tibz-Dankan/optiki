package auth

import (
	"log"
	"strings"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

type VerifyOTPInput struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

var VerifyOTP = func(c *fiber.Ctx) error {
	user := models.User{}
	otp := models.OTP{}

	input := VerifyOTPInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	input.OTP = strings.TrimSpace(input.OTP)
	if input.Email == "" || input.OTP == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Missing email/OTP!")
	}

	savedUser, err := user.FindByEmail(input.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid OTP!")
	}

	savedOTP, err := otp.FindByUserAndCode(savedUser.ID, input.OTP, constants.OTP_TYPE_RESET_PASSWORD)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedOTP.ID == "" {
		if err := otp.RecordFailedAttempt(savedUser.ID, constants.OTP_TYPE_RESET_PASSWORD); err != nil {
			log.Println("verify OTP: recording failed attempt failed:", err)
		}
		return fiber.NewError(fiber.StatusBadRequest, "Invalid OTP!")
	}

	if savedOTP.IsUsed || savedOTP.IsVerified || savedOTP.ExpiresAt.Before(time.Now()) {
		return fiber.NewError(fiber.StatusBadRequest, "OTP is already used, invalid or expired!")
	}

	savedOTP.IsVerified = true
	if _, err := savedOTP.Update(); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "OTP verified successfully",
		"otp": fiber.Map{
			"isVerified": true,
			"otp":        input.OTP,
		},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
