package health

import (
	"os"

	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// CI polls this until commit equals the pushed SHA, so tests never run against a stale deploy.
var CheckHealth = func(c *fiber.Ctx) error {
	response := fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"status": "ok",
			"commit": os.Getenv("GIT_SHA"),
			"env":    pkg.GetDeployEnv(),
		},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
