package apitoken

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

func apiTokenData(token models.APIToken, permissions []string) fiber.Map {
	if permissions == nil {
		permissions = []string{}
	}
	return fiber.Map{
		"id":          token.ID,
		"name":        token.Name,
		"prefix":      token.Prefix,
		"permissions": permissions,
		"status":      tokenStatus(token),
		"expiresAt":   token.ExpiresAt,
		"lastUsedAt":  token.LastUsedAt,
		"lastUsedIP":  token.LastUsedIP,
		"isRevoked":   token.IsRevoked,
		"revokedAt":   token.RevokedAt,
		"createdAt":   token.CreatedAt,
		"updatedAt":   token.UpdatedAt,
	}
}

func tokenStatus(token models.APIToken) string {
	switch {
	case token.IsRevoked:
		return "REVOKED"
	case token.ExpiresAt != nil && !token.ExpiresAt.After(time.Now()):
		return "EXPIRED"
	}
	return "ACTIVE"
}
