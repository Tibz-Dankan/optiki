package pkg

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/gofiber/fiber/v2"
)

// ListQueryError maps a model query error onto its HTTP status
func ListQueryError(err error) error {
	if errors.Is(err, constants.ErrNotPermittedError) {
		return fiber.NewError(fiber.StatusForbidden, constants.ErrNotPermitted)
	}
	return fiber.NewError(fiber.StatusInternalServerError, err.Error())
}
