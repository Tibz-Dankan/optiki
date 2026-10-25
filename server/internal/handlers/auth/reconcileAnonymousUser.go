package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ReconcileAnonymousUserInput struct {
	AnonymousID string `json:"anonymousID"`
}

var ReconcileAnonymousUser = func(c *fiber.Ctx) error {
	anonymousUserLink := models.AnonymousUserLink{}
	userID := c.Params("id")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}
	if userID != user.ID {
		return fiber.NewError(fiber.StatusForbidden, constants.ErrNotPermitted)
	}

	input := ReconcileAnonymousUserInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	parsedAnonymousID, err := uuid.Parse(input.AnonymousID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, constants.ErrInvalidAnonymousID)
	}
	anonymousID := parsedAnonymousID.String()

	savedLink, err := anonymousUserLink.FindOneByAnonymousID(anonymousID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedLink.ID != "" && savedLink.UserID != user.ID {
		return fiber.NewError(fiber.StatusConflict, constants.ErrAnonymousIDLinkedElsewhere)
	}
	if savedLink.ID != "" {
		response := fiber.Map{
			"status":  "success",
			"message": "Anonymous ID is already linked to this account!",
			"data": fiber.Map{
				"anonymousID":  anonymousID,
				"userID":       user.ID,
				"linkedVisits": 0,
			},
		}
		return c.Status(fiber.StatusOK).JSON(response)
	}

	link, linkedVisits, err := anonymousUserLink.Link(anonymousID, user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if link.UserID != user.ID {
		return fiber.NewError(fiber.StatusConflict, constants.ErrAnonymousIDLinkedElsewhere)
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Anonymous visits linked successfully!",
		"data": fiber.Map{
			"anonymousID":  anonymousID,
			"userID":       user.ID,
			"linkedVisits": linkedVisits,
		},
	}
	return c.Status(fiber.StatusCreated).JSON(response)
}
