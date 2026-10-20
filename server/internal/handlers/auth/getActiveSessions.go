package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var GetActiveSessions = func(c *fiber.Ctx) error {
	session := models.Session{}
	limitParam := c.Query("limit")
	cursorParam := c.Query("cursor")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}
	currentSession, _ := c.Locals("session").(models.Session)

	limit, err := pkg.ValidateQueryLimit(limitParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	activeSessions, err := session.FindAllActiveByUser(user.ID, limit+1, cursorParam)
	if err != nil {
		return pkg.ListQueryError(err)
	}

	var nextCursor string = ""
	var hasNextItems bool = false

	if len(activeSessions) > int(limit) {
		activeSessions = activeSessions[:len(activeSessions)-1]
		nextCursor = activeSessions[len(activeSessions)-1].ID
		hasNextItems = true
	}

	sessions := []fiber.Map{}
	for _, activeSession := range activeSessions {
		sessions = append(sessions, fiber.Map{
			"id":                    activeSession.ID,
			"generatedVia":          activeSession.GeneratedVia,
			"userAgent":             activeSession.UserAgent,
			"ip":                    activeSession.IP,
			"createdAt":             activeSession.CreatedAt,
			"lastUsedAt":            activeSession.UpdatedAt,
			"refreshTokenExpiresAt": activeSession.RefreshTokenExpiresAt,
			"isCurrentSession":      activeSession.ID == currentSession.ID,
		})
	}

	pagination := map[string]interface{}{
		"limit":        limit,
		"nextCursor":   nextCursor,
		"hasNextItems": hasNextItems,
		"count":        len(sessions),
	}

	response := fiber.Map{
		"status":     "success",
		"data":       sessions,
		"pagination": pagination,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
