package middlewares

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Traefik replaces X-Real-IP and X-Forwarded-For from untrusted clients, so behind it the first is the client's address.
func SetClientIP(c *fiber.Ctx) error {
	clientIP := strings.TrimSpace(c.Get("X-Real-IP"))

	if clientIP == "" {
		if forwardedFor := c.Get("X-Forwarded-For"); forwardedFor != "" {
			clientIP = strings.TrimSpace(strings.Split(forwardedFor, ",")[0])
		}
	}

	if clientIP == "" {
		clientIP = c.IP()
	}

	c.Locals("clientIP", clientIP)

	return c.Next()
}
