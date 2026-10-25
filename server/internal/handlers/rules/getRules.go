package rules

import (
	"strings"

	catalog "github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/gofiber/fiber/v2"
)

var GetRules = func(c *fiber.Ctx) error {
	setName := strings.ToUpper(c.Query("set", catalog.RuleSetFull))
	set, ok := catalog.Set(setName)
	if !ok {
		return fiber.NewError(fiber.StatusBadRequest, "Unknown rule set \""+setName+"\"! Use CORE or FULL.")
	}

	data := []fiber.Map{}
	for _, rule := range set.Rules {
		data = append(data, ruleData(rule.Meta()))
	}

	response := fiber.Map{
		"status": "success",
		"data":   data,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
