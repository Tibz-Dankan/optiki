package apitoken

import (
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

type UpdateAPITokenInput struct {
	Name        *string   `json:"name"`
	Permissions *[]string `json:"permissions"`
}

var UpdateAPIToken = func(c *fiber.Ctx) error {
	apiToken := models.APIToken{}

	user, savedToken, err := findAPIToken(c)
	if err != nil {
		return err
	}
	if savedToken.IsRevoked {
		return fiber.NewError(fiber.StatusConflict, "This API token is revoked!")
	}

	input := UpdateAPITokenInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if input.Name == nil && input.Permissions == nil {
		return fiber.NewError(fiber.StatusBadRequest, "Provide a name or permissions to change!")
	}

	var name *string
	if input.Name != nil {
		validName, err := validateName(*input.Name)
		if err != nil {
			return err
		}
		name = &validName
	}
	var permissionIDs []string
	if input.Permissions != nil {
		_, ids, err := resolvePermissions(*input.Permissions)
		if err != nil {
			return err
		}
		permissionIDs = ids
	}

	if err := apiToken.UpdateDetails(savedToken.ID, name, permissionIDs); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	updatedToken, err := apiToken.FindOne(savedToken.ID, user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	permissions, err := permissionsOf(updatedToken)
	if err != nil {
		return err
	}

	response := fiber.Map{
		"status":  "success",
		"message": "API token updated",
		"data":    apiTokenData(updatedToken, permissions),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
