package gym

import (
	catalog "github.com/Tibz-Dankan/optiki/internal/engine/rules"
	fixtures "github.com/Tibz-Dankan/optiki/internal/gym"
	"github.com/gofiber/fiber/v2"
)

var GetGymPages = func(c *fiber.Ctx) error {
	data := []fiber.Map{}
	for _, pair := range fixtures.List() {
		ruleName, ruleSets := pair.RuleID, []string{}
		if meta, ok := catalog.Find(pair.RuleID); ok {
			ruleName, ruleSets = meta.Name, catalog.SetsFor(meta)
		}
		data = append(data, fiber.Map{
			"id":          pair.ID,
			"ruleID":      pair.RuleID,
			"ruleName":    ruleName,
			"ruleSets":    ruleSets,
			"scene":       pair.Scene,
			"broken":      pair.Broken,
			"fixed":       pair.Fixed,
			"brokenPath":  fixtures.Route(pair.Broken),
			"fixedPath":   fixtures.Route(pair.Fixed),
			"needsRender": pair.Renders,
		})
	}

	response := fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"pairs":       data,
			"kitchenSink": fiber.Map{"id": fixtures.KitchenSink, "path": fixtures.Route(fixtures.KitchenSink)},
			"perfect":     fiber.Map{"id": fixtures.Perfect, "path": fixtures.Route(fixtures.Perfect)},
		},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
