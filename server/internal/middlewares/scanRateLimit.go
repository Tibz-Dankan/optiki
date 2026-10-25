package middlewares

import (
	"encoding/json"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

var anonymousScanLimiter = newRateLimiter(constants.SCAN_RATE_LIMIT_ANONYMOUS, constants.SCAN_RATE_LIMIT_ANONYMOUS_WINDOW)
var anonymousURLScanLimiter = newRateLimiter(constants.SCAN_URL_RATE_LIMIT_ANONYMOUS, constants.SCAN_URL_RATE_LIMIT_ANONYMOUS_WINDOW)
var signedInScanLimiter = newRateLimiter(constants.SCAN_RATE_LIMIT_SIGNED_IN, constants.SCAN_RATE_LIMIT_SIGNED_IN_WINDOW)

// ScanRateLimit runs after the auth middleware: it limits a token, a verified user, or an anonymous IP.
// Anonymous URL scans, which make the server fetch a page, have a tighter limit of their own.
func ScanRateLimit(c *fiber.Ctx) error {
	if apiToken, ok := c.Locals("apiToken").(models.APIToken); ok {
		if err := applyRateLimit(c, signedInScanLimiter, "token "+apiToken.ID); err != nil {
			return err
		}
		return c.Next()
	}
	if user, ok := c.Locals("user").(models.User); ok && user.EmailVerified {
		if err := applyRateLimit(c, signedInScanLimiter, "user "+user.ID); err != nil {
			return err
		}
		return c.Next()
	}

	clientIP, _ := c.Locals("clientIP").(string)
	if err := applyRateLimit(c, anonymousScanLimiter, "ip "+clientIP); err != nil {
		return err
	}
	if requestsURLScan(c.Body()) {
		if err := applyRateLimit(c, anonymousURLScanLimiter, "ip "+clientIP); err != nil {
			return err
		}
	}
	return c.Next()
}

func requestsURLScan(body []byte) bool {
	var input struct {
		URL *string `json:"url"`
	}
	if err := json.Unmarshal(body, &input); err != nil {
		return false
	}
	return input.URL != nil && strings.TrimSpace(*input.URL) != ""
}
