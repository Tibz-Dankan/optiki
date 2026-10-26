package middlewares

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

var fixReportLimiter = newRateLimiter(constants.FIX_REPORT_RATE_LIMIT, constants.FIX_REPORT_RATE_LIMIT_WINDOW)

// FixReportRateLimit runs after the auth middleware and limits fix report generation per token or per user,
// since each one is a paid Gemini call
func FixReportRateLimit(c *fiber.Ctx) error {
	if apiToken, ok := c.Locals("apiToken").(models.APIToken); ok {
		if err := applyRateLimit(c, fixReportLimiter, "token "+apiToken.ID); err != nil {
			return err
		}
		return c.Next()
	}
	userID, _ := c.Locals("userID").(string)
	if err := applyRateLimit(c, fixReportLimiter, "user "+userID); err != nil {
		return err
	}
	return c.Next()
}
