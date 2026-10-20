package middlewares

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/gofiber/fiber/v2"
)

func LimitRequestBody(c *fiber.Ctx) error {
	if int64(len(c.Body())) > constants.MAX_REQUEST_BODY_SIZE {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "Request body is too large!")
	}

	return c.Next()
}
