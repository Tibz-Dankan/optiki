package auth

import (
	"fmt"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

var InitiateEmailVerification = func(c *fiber.Ctx) error {
	otp := models.OTP{}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	if user.EmailVerified {
		return fiber.NewError(fiber.StatusBadRequest, "Email is already verified!")
	}

	latestOTP, err := otp.FindLatestByUserAndType(user.ID, constants.OTP_TYPE_VERIFY_EMAIL)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if latestOTP.ID != "" && time.Since(latestOTP.CreatedAt) < constants.EMAIL_VERIFICATION_RESEND_COOLDOWN {
		return fiber.NewError(fiber.StatusTooManyRequests, "Please wait a minute before requesting another link!")
	}

	if err := sendVerificationEmail(user); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	c.Set("X-Email-Verification-Sent", "true")

	response := fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Verification email sent to %s", user.Email),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
