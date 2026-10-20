package pkg

import (
	"os"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/gofiber/fiber/v2"
)

// SetAuthCookies sets the httpOnly access and refresh token cookies; client and API share one origin, so SameSite=Lax holds
func SetAuthCookies(c *fiber.Ctx, accessToken, refreshToken string, accessTokenExpiry, refreshTokenExpiry time.Duration) {
	setAuthCookie(c, constants.ACCESS_TOKEN_COOKIE, accessToken, accessTokenExpiry)
	setAuthCookie(c, constants.REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenExpiry)
}

// SetAccessTokenCookie replaces only the access token cookie, after a refresh
func SetAccessTokenCookie(c *fiber.Ctx, accessToken string, accessTokenExpiry time.Duration) {
	setAuthCookie(c, constants.ACCESS_TOKEN_COOKIE, accessToken, accessTokenExpiry)
}

// ClearAuthCookies expires both auth cookies
func ClearAuthCookies(c *fiber.Ctx) {
	for _, name := range []string{constants.ACCESS_TOKEN_COOKIE, constants.REFRESH_TOKEN_COOKIE} {
		c.Cookie(&fiber.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HTTPOnly: true,
			Secure:   os.Getenv("GO_ENV") == "production",
			SameSite: fiber.CookieSameSiteLaxMode,
		})
	}
}

func setAuthCookie(c *fiber.Ctx, name, value string, expiry time.Duration) {
	c.Cookie(&fiber.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:   int(expiry.Seconds()),
		HTTPOnly: true,
		Secure:   os.Getenv("GO_ENV") == "production",
		SameSite: fiber.CookieSameSiteLaxMode,
	})
}
