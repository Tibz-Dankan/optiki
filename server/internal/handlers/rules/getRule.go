package rules

import (
	"strings"

	catalog "github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/gofiber/fiber/v2"
)

var GetRule = func(c *fiber.Ctx) error {
	meta, ok := catalog.Find(strings.ToUpper(c.Params("id")))
	if !ok {
		return fiber.NewError(fiber.StatusNotFound, "Rule not found")
	}

	response := fiber.Map{
		"status": "success",
		"data":   ruleData(meta),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
