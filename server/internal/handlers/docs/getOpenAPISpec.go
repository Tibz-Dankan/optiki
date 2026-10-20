package docs

import (
	"github.com/Tibz-Dankan/optiki/internal/assets"
	"github.com/gofiber/fiber/v2"
)

var GetOpenAPISpec = func(c *fiber.Ctx) error {
	c.Set(fiber.HeaderContentType, "application/yaml; charset=utf-8")
	return c.Status(fiber.StatusOK).Send(assets.OpenAPISpec)
}
