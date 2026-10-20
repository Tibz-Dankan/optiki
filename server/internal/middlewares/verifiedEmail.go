package middlewares

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// Must run after Auth.
func VerifiedEmail(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	if !user.EmailVerified {
		return pkg.NewReasonError(fiber.StatusForbidden, constants.ErrReasonEmailNotVerified, constants.ErrEmailNotVerified)
	}

	return c.Next()
}
