package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

func userResponseData(user models.User) fiber.Map {
	return fiber.Map{
		"id":              user.ID,
		"name":            user.Name,
		"email":           user.Email,
		"role":            user.Role,
		"emailVerified":   user.EmailVerified,
		"emailVerifiedAt": user.EmailVerifiedAt,
		"profileBgColor":  user.ProfileBgColor,
		"createdAt":       user.CreatedAt,
		"updatedAt":       user.UpdatedAt,
	}
}
