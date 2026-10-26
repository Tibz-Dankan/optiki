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

	status := fiber.StatusOK
	message := "Anonymous ID is already linked to this account!"
	var linkedVisits int64
	if savedLink.ID == "" {
		link, visits, err := anonymousUserLink.Link(anonymousID, user.ID)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		if link.UserID != user.ID {
			return fiber.NewError(fiber.StatusConflict, constants.ErrAnonymousIDLinkedElsewhere)
		}
		status = fiber.StatusCreated
		message = "Anonymous visits and scans linked successfully!"
		linkedVisits = visits
	}

	scan := models.Scan{}
	linkedScans, err := scan.ClaimAnonymous(anonymousID, user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": message,
		"data": fiber.Map{
			"anonymousID":  anonymousID,
			"userID":       user.ID,
			"linkedVisits": linkedVisits,
			"linkedScans":  linkedScans,
		},
	}
	return c.Status(status).JSON(response)
}
