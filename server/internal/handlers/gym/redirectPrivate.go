package gym

import (
	"github.com/gofiber/fiber/v2"
)

// RedirectPrivate is the SSRF test fixture: a fixed redirect to loopback, never to a caller-supplied target
var RedirectPrivate = func(c *fiber.Ctx) error {
	return c.Redirect("http://127.0.0.1/", fiber.StatusFound)
}
