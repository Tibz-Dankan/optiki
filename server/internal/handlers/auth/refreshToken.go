package auth

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var RefreshToken = func(c *fiber.Ctx) error {
	session := models.Session{}
	user := models.User{}

	refreshToken := c.Cookies(constants.REFRESH_TOKEN_COOKIE)
	if refreshToken == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "No refresh token found. Please sign in again.")
	}

	userID, err := pkg.DecodeJWT(refreshToken)
	if err != nil {
		pkg.ClearAuthCookies(c)
		return fiber.NewError(fiber.StatusUnauthorized, "Refresh token is invalid or expired.")
	}

	savedSession, err := session.FindByRefreshToken(refreshToken)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedSession.ID == "" || savedSession.IsRevoked || savedSession.UserID != userID {
		pkg.ClearAuthCookies(c)
		return fiber.NewError(fiber.StatusUnauthorized, "Session not found or revoked. Please sign in again.")
	}

	savedUser, err := user.FindOne(userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		pkg.ClearAuthCookies(c)
		return fiber.NewError(fiber.StatusUnauthorized, "User no longer exists.")
	}

	accessTokenExpiry, _ := pkg.GetTokenExpiry(savedUser.Role)
	accessTokenExpiresAt := time.Now().Add(accessTokenExpiry)
	if accessTokenExpiresAt.After(savedSession.RefreshTokenExpiresAt) {
		accessTokenExpiresAt = savedSession.RefreshTokenExpiresAt
	}

	newAccessToken, err := pkg.SignJWTToken(userID, accessTokenExpiresAt)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if _, err := savedSession.UpdateAccessToken(newAccessToken, accessTokenExpiresAt); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	pkg.SetAccessTokenCookie(c, newAccessToken, time.Until(accessTokenExpiresAt))

	response := fiber.Map{
		"status":         "success",
		"message":        "Token refreshed successfully",
		"session":        sessionResponseData(savedUser.ID, accessTokenExpiresAt, savedSession.RefreshTokenExpiresAt),
		"redirectToPath": constants.USER_HOME_PATH,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
