package status

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

var startedAt = time.Now()

var GetAppStatus = func(c *fiber.Ctx) error {
	response := fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"status":        "up",
			"startedAt":     startedAt,
			"uptimeSeconds": int(time.Since(startedAt).Seconds()),
		},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
