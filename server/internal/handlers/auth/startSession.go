package auth

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

func startSession(c *fiber.Ctx, user models.User, generatedVia string) (fiber.Map, error) {
	session := models.Session{}

	accessTokenExpiry, refreshTokenExpiry := pkg.GetTokenExpiry(user.Role)
	accessTokenExpiresAt := time.Now().Add(accessTokenExpiry)
	refreshTokenExpiresAt := time.Now().Add(refreshTokenExpiry)

	accessToken, err := pkg.SignJWTToken(user.ID, accessTokenExpiresAt)
	if err != nil {
		return nil, err
	}

	refreshToken, err := pkg.SignJWTToken(user.ID, refreshTokenExpiresAt)
	if err != nil {
		return nil, err
	}

	clientIP, _ := c.Locals("clientIP").(string)
	userAgent := c.Get(fiber.HeaderUserAgent)
	if len(userAgent) > constants.MAX_USER_AGENT_LENGTH {
		userAgent = userAgent[:constants.MAX_USER_AGENT_LENGTH]
	}

	if _, err := session.Create(models.Session{
		UserID:                user.ID,
		AccessToken:           accessToken,
		RefreshToken:          refreshToken,
		GeneratedVia:          generatedVia,
		UserAgent:             userAgent,
		IP:                    clientIP,
		AccessTokenExpiresAt:  accessTokenExpiresAt,
		RefreshTokenExpiresAt: refreshTokenExpiresAt,
	}); err != nil {
		return nil, err
	}

	pkg.SetAuthCookies(c, accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry)

	return sessionResponseData(user.ID, accessTokenExpiresAt, refreshTokenExpiresAt), nil
}

func sessionResponseData(userID string, accessTokenExpiresAt, refreshTokenExpiresAt time.Time) fiber.Map {
	return fiber.Map{
		"userID":                userID,
		"accessTokenExpiresAt":  accessTokenExpiresAt,
		"refreshTokenExpiresAt": refreshTokenExpiresAt,
	}
}
