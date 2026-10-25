package apitoken

import (
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

var RevokeAPIToken = func(c *fiber.Ctx) error {
	apiToken := models.APIToken{}

	user, savedToken, err := findAPIToken(c)
	if err != nil {
		return err
	}

	revoked, err := apiToken.Revoke(savedToken.ID, user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if !revoked {
		return fiber.NewError(fiber.StatusConflict, "This API token is already revoked!")
	}

	revokedToken, err := apiToken.FindOne(savedToken.ID, user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	permissions, err := permissionsOf(revokedToken)
	if err != nil {
		return err
	}

	response := fiber.Map{
		"status":  "success",
		"message": "API token revoked",
		"data":    apiTokenData(revokedToken, permissions),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
