package middlewares

import (
	"github.com/gofiber/fiber/v2"
)

func Auth(c *fiber.Ctx) error {
	user, session, err := resolveSession(c)
	if err != nil {
		return err
	}

	c.Locals("userID", user.ID)
	c.Locals("user", user)
	c.Locals("session", session)

	return c.Next()
}
