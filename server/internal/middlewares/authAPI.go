package middlewares

import (
	"strings"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// AuthAPI authenticates /client/v1 requests by Bearer API token. The secret is verified before revealing
// that a token is revoked or expired, so those answers only reach someone holding the real secret.
func AuthAPI(c *fiber.Ctx) error {
	scheme, presented, _ := strings.Cut(strings.TrimSpace(c.Get(fiber.HeaderAuthorization)), " ")
	presented = strings.TrimSpace(presented)
	if !strings.EqualFold(scheme, constants.API_TOKEN_AUTH_SCHEME) || presented == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Missing API token! Send it as Authorization: Bearer <token>.")
	}

	prefix, secret, err := pkg.ParseAPIToken(presented)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrInvalidAPIToken)
	}

	apiToken := models.APIToken{}
	savedToken, err := apiToken.FindByPrefix(prefix)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedToken.ID == "" || !pkg.VerifyAPITokenSecret(secret, savedToken.TokenHash) {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrInvalidAPIToken)
	}
	if savedToken.IsRevoked {
		return pkg.NewReasonError(fiber.StatusUnauthorized, constants.ErrReasonTokenRevoked, "This API token has been revoked!")
	}
	if savedToken.ExpiresAt != nil && !savedToken.ExpiresAt.After(time.Now()) {
		return pkg.NewReasonError(fiber.StatusUnauthorized, constants.ErrReasonTokenExpired, "This API token has expired!")
	}

	user := models.User{}
	savedUser, err := user.FindOne(savedToken.UserID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrInvalidAPIToken)
	}
	if !savedUser.EmailVerified {
		return pkg.NewReasonError(fiber.StatusForbidden, constants.ErrReasonEmailNotVerified, constants.ErrEmailNotVerified)
	}

	grants, err := apiToken.FindPermissionNames([]string{savedToken.ID})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	permissions := map[string]struct{}{}
	for _, name := range grants[savedToken.ID] {
		permissions[name] = struct{}{}
	}

	c.Locals("userID", savedUser.ID)
	c.Locals("user", savedUser)
	c.Locals("apiToken", savedToken)
	c.Locals("apiTokenPermissions", permissions)

	return c.Next()
}
