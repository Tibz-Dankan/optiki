package gym

import (
	"strings"

	fixtures "github.com/Tibz-Dankan/optiki/internal/gym"
	"github.com/gofiber/fiber/v2"
)

// The fixtures are served from the API's origin, so they run sandboxed: an opaque origin with no access to
// the API's cookies or same-origin requests, and nothing loaded from elsewhere.
const gymPagePolicy = "sandbox allow-scripts allow-modals; default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'"

var GetGymPage = func(c *fiber.Ctx) error {
	file := c.Params("file")
	if !strings.HasSuffix(file, ".html") {
		return fiber.NewError(fiber.StatusNotFound, "Gym page not found")
	}
	page, ok := fixtures.Page(strings.TrimSuffix(file, ".html"))
	if !ok {
		return fiber.NewError(fiber.StatusNotFound, "Gym page not found")
	}

	c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
	c.Set(fiber.HeaderContentSecurityPolicy, gymPagePolicy)
	c.Set(fiber.HeaderXContentTypeOptions, "nosniff")
	c.Set(fiber.HeaderCacheControl, "public, max-age=300")
	return c.Status(fiber.StatusOK).SendString(page)
}
