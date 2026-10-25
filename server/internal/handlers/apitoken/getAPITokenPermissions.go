package apitoken

import (
	"github.com/Tibz-Dankan/optiki/internal/data"
	"github.com/gofiber/fiber/v2"
)

var GetAPITokenPermissions = func(c *fiber.Ctx) error {
	permissions := []fiber.Map{}
	for _, permission := range data.APITokenPermissions {
		permissions = append(permissions, fiber.Map{"name": permission.Name, "description": permission.Description})
	}

	response := fiber.Map{
		"status": "success",
		"data":   permissions,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
