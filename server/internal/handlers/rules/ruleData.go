package rules

import (
	"github.com/Tibz-Dankan/optiki/internal/engine"
	catalog "github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/gofiber/fiber/v2"
)

func ruleData(meta engine.RuleMeta) fiber.Map {
	return fiber.Map{
		"id":           meta.ID,
		"name":         meta.Name,
		"category":     meta.Category,
		"severity":     meta.Severity,
		"priority":     meta.Priority,
		"weight":       meta.Weight(),
		"modes":        meta.Modes,
		"renderedOnly": meta.RenderedOnly,
		"ruleSets":     catalog.SetsFor(meta),
		"summary":      meta.Summary,
		"why":          meta.Why,
		"fix":          meta.Fix,
		"fixBefore":    meta.FixBefore,
		"fixAfter":     meta.FixAfter,
		"wcag":         meta.WCAG,
		"origin":       meta.Origin,
	}
}
