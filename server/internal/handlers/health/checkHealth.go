package health

import (
	"os"

	"github.com/gofiber/fiber/v2"
)

var CheckHealth = func(c *fiber.Ctx) error {
	response := fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"status": "ok",
			"commit": os.Getenv("GIT_SHA"),
		},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
