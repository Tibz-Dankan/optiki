package middlewares

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// resolveSession turns the access-token cookie into a live session and its user. Authentication failures
// are 401 fiber errors; anything else is a lookup error.
func resolveSession(c *fiber.Ctx) (models.User, models.Session, error) {
	accessToken := c.Cookies(constants.ACCESS_TOKEN_COOKIE)
	if accessToken == "" {
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusUnauthorized, "You are not logged in! Please log in to gain access.")
	}

	userID, err := pkg.DecodeJWT(accessToken)
	if err != nil {
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusUnauthorized, "Your session has expired or is invalid. Please log in again.")
	}

	session := models.Session{}
	savedSession, err := session.FindByAccessToken(accessToken)
	if err != nil {
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedSession.ID == "" || savedSession.UserID != userID {
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusUnauthorized, "Your session no longer exists. Please log in again.")
	}
	if savedSession.IsRevoked {
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusUnauthorized, "Your session has been revoked. Please log in again.")
	}
	if !savedSession.RefreshTokenExpiresAt.After(time.Now()) {
		pkg.ClearAuthCookies(c)
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusUnauthorized, "Your session has expired. Please log in again.")
	}

	user := models.User{}
	savedUser, err := user.FindOne(userID)
	if err != nil {
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedUser.ID == "" {
		return models.User{}, models.Session{}, fiber.NewError(fiber.StatusUnauthorized, "The user belonging to this session no longer exists!")
	}
	return savedUser, savedSession, nil
}
