package apitoken

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var GetAPITokens = func(c *fiber.Ctx) error {
	apiToken := models.APIToken{}
	limitParam := c.Query("limit")
	cursorParam := c.Query("cursor")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	limit, err := pkg.ValidateQueryLimit(limitParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	tokens, err := apiToken.FindAllByUser(user.ID, limit+1, cursorParam)
	if errors.Is(err, models.ErrCursorNotFound) {
		return fiber.NewError(fiber.StatusBadRequest, "Unknown cursor!")
	}
	if err != nil {
		return pkg.ListQueryError(err)
	}

	var nextCursor string = ""
	var hasNextItems bool = false
	if len(tokens) > int(limit) {
		tokens = tokens[:len(tokens)-1]
		nextCursor = tokens[len(tokens)-1].ID
		hasNextItems = true
	}

	ids := make([]string, 0, len(tokens))
	for _, token := range tokens {
		ids = append(ids, token.ID)
	}
	permissions, err := apiToken.FindPermissionNames(ids)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	data := []fiber.Map{}
	for _, token := range tokens {
		data = append(data, apiTokenData(token, permissions[token.ID]))
	}

	pagination := map[string]interface{}{
		"limit":        limit,
		"nextCursor":   nextCursor,
		"hasNextItems": hasNextItems,
		"count":        len(data),
	}

	response := fiber.Map{
		"status":     "success",
		"data":       data,
		"pagination": pagination,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
