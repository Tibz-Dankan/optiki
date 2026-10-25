package apitoken

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// findAPIToken loads the caller's token by the :id param; another user's token is a 404
func findAPIToken(c *fiber.Ctx) (models.User, models.APIToken, error) {
	user, ok := c.Locals("user").(models.User)
	if !ok {
		return user, models.APIToken{}, fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}
	tokenID := c.Params("id")
	if uuid.Validate(tokenID) != nil {
		return user, models.APIToken{}, fiber.NewError(fiber.StatusBadRequest, "Invalid API token id!")
	}
	apiToken := models.APIToken{}
	savedToken, err := apiToken.FindOne(tokenID, user.ID)
	if err != nil {
		return user, savedToken, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedToken.ID == "" {
		return user, savedToken, fiber.NewError(fiber.StatusNotFound, constants.ErrAPITokenNotFound)
	}
	return user, savedToken, nil
}

func permissionsOf(token models.APIToken) ([]string, error) {
	apiToken := models.APIToken{}
	names, err := apiToken.FindPermissionNames([]string{token.ID})
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return names[token.ID], nil
}
