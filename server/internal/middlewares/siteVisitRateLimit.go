package middlewares

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/gofiber/fiber/v2"
)

var siteVisitRateLimiter = newRateLimiter(constants.SITE_VISIT_RATE_LIMIT, constants.SITE_VISIT_RATE_LIMIT_WINDOW)

// SiteVisitRateLimit caps site visit captures per client IP
func SiteVisitRateLimit(c *fiber.Ctx) error {
	clientIP, _ := c.Locals("clientIP").(string)
	if err := applyRateLimit(c, siteVisitRateLimiter, "ip "+clientIP); err != nil {
		return err
	}
	return c.Next()
}
