package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

// fixReportTriggeredBy records whether the owner asked for a report from the browser or with a token
func fixReportTriggeredBy(c *fiber.Ctx) string {
	if _, ok := c.Locals("apiToken").(models.APIToken); ok {
		return constants.FIX_REPORT_TRIGGERED_BY_API_TOKEN
	}
	return constants.FIX_REPORT_TRIGGERED_BY_USER
}
