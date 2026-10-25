package middlewares

import (
	"log"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// RequirePermission gates a token route on one permission; only a permitted request counts as a use
func RequirePermission(permission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		permissions, ok := c.Locals("apiTokenPermissions").(map[string]struct{})
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, constants.ErrInvalidAPIToken)
		}
		if _, granted := permissions[permission]; !granted {
			return pkg.NewReasonError(fiber.StatusForbidden, constants.ErrReasonMissingPermission,
				"This API token does not have the "+permission+" permission!")
		}

		if apiToken, ok := c.Locals("apiToken").(models.APIToken); ok {
			clientIP, _ := c.Locals("clientIP").(string)
			if err := apiToken.TouchLastUsed(apiToken.ID, apiToken.LastUsedAt, clientIP); err != nil {
				log.Println("recording API token use failed:", err)
			}
		}
		return c.Next()
	}
}
