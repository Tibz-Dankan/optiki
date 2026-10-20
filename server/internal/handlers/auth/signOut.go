package auth

import (
	"log"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var SignOut = func(c *fiber.Ctx) error {
	session := models.Session{}
	refreshToken := c.Cookies(constants.REFRESH_TOKEN_COOKIE)

	pkg.ClearAuthCookies(c)

	if refreshToken != "" {
		savedSession, err := session.FindByRefreshToken(refreshToken)
		if err != nil {
			log.Println("sign out: session lookup failed:", err)
		}
		if savedSession.ID != "" {
			if err := session.Revoke(savedSession.ID); err != nil {
				log.Println("sign out: revoking session failed:", err)
			}
		}
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Signed out successfully",
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
