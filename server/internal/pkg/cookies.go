package pkg

import (
	"os"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/gofiber/fiber/v2"
)

// SetAuthCookies sets the httpOnly access and refresh token cookies
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
		cookie := authCookie(name, "")
		// fasthttp drops a negative max-age, so only a past expiry makes the browser delete the cookie
		cookie.Expires = time.Unix(0, 0)
		c.Cookie(cookie)
	}
}

func setAuthCookie(c *fiber.Ctx, name, value string, expiry time.Duration) {
	cookie := authCookie(name, value)
	cookie.MaxAge = int(expiry.Seconds())
	c.Cookie(cookie)
}

func authCookie(name, value string) *fiber.Cookie {
	isDeployed := os.Getenv("GO_ENV") == "production"

	// The deployed client (Netlify) and API (Contabo) are different sites, so cookies must be SameSite=None,
	// which browsers only accept with Secure. Locally both run on localhost, the same site, over plain http.
	sameSite := fiber.CookieSameSiteLaxMode
	if isDeployed {
		sameSite = fiber.CookieSameSiteNoneMode
	}

	return &fiber.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		HTTPOnly: true,
		Secure:   isDeployed,
		SameSite: sameSite,
	}
}
