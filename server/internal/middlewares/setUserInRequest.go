package middlewares

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

func SetUserInRequest(c *fiber.Ctx) error {
	accessToken := c.Cookies(constants.ACCESS_TOKEN_COOKIE)
	if accessToken == "" {
		return c.Next()
	}

	userID, err := pkg.DecodeJWT(accessToken)
	if err == nil && userID != "" {
		c.Locals("userID", userID)
	}

	return c.Next()
}
