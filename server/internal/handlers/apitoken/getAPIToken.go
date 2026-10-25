package apitoken

import (
	"github.com/gofiber/fiber/v2"
)

var GetAPIToken = func(c *fiber.Ctx) error {
	_, savedToken, err := findAPIToken(c)
	if err != nil {
		return err
	}
	permissions, err := permissionsOf(savedToken)
	if err != nil {
		return err
	}

	response := fiber.Map{
		"status": "success",
		"data":   apiTokenData(savedToken, permissions),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
