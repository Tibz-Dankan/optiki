package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

// scanCaller is who is asking, and therefore which rule set, mode and visibility a new scan gets.
type scanCaller struct {
	user        *models.User
	apiToken    *models.APIToken
	triggeredBy string
	ruleSet     string
	visibility  string
	canRender   bool
}

func resolveScanCaller(c *fiber.Ctx) scanCaller {
	if apiToken, ok := c.Locals("apiToken").(models.APIToken); ok {
		user, _ := c.Locals("user").(models.User)
		return scanCaller{
			user: &user, apiToken: &apiToken, triggeredBy: constants.SCAN_TRIGGERED_BY_API_TOKEN,
			ruleSet: rules.RuleSetFull, visibility: constants.SCAN_VISIBILITY_PRIVATE, canRender: true,
		}
	}
	if user, ok := c.Locals("user").(models.User); ok && user.EmailVerified {
		return scanCaller{
			user: &user, triggeredBy: constants.SCAN_TRIGGERED_BY_USER,
			ruleSet: rules.RuleSetFull, visibility: constants.SCAN_VISIBILITY_PRIVATE, canRender: true,
		}
	}
	return scanCaller{
		triggeredBy: constants.SCAN_TRIGGERED_BY_ANONYMOUS, ruleSet: rules.RuleSetCore,
		visibility: constants.SCAN_VISIBILITY_PUBLIC,
	}
}

func (caller scanCaller) userID() *string {
	if caller.user == nil {
		return nil
	}
	return &caller.user.ID
}

func (caller scanCaller) apiTokenID() *string {
	if caller.apiToken == nil {
		return nil
	}
	return &caller.apiToken.ID
}

// viewerID is the signed-in caller, or "" for an anonymous one
func viewerID(c *fiber.Ctx) string {
	if user, ok := c.Locals("user").(models.User); ok {
		return user.ID
	}
	return ""
}
