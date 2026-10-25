package middlewares

import (
	"errors"

	"github.com/gofiber/fiber/v2"
)

// OptionalAuth does Auth's full session lookup but lets the request through anonymously without one
func OptionalAuth(c *fiber.Ctx) error {
	user, session, err := resolveSession(c)
	if err != nil {
		var fiberErr *fiber.Error
		if errors.As(err, &fiberErr) && fiberErr.Code == fiber.StatusUnauthorized {
			c.Locals("userID", nil)
			return c.Next()
		}
		return err
	}

	c.Locals("userID", user.ID)
	c.Locals("user", user)
	c.Locals("session", session)

	return c.Next()
}
