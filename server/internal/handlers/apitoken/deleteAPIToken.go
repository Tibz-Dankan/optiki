package apitoken

import (
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

var DeleteAPIToken = func(c *fiber.Ctx) error {
	apiToken := models.APIToken{}

	user, savedToken, err := findAPIToken(c)
	if err != nil {
		return err
	}
	if err := apiToken.Delete(savedToken.ID, user.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "API token deleted",
		"data":    fiber.Map{"id": savedToken.ID},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
