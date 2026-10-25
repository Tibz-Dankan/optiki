package apitoken

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

type CreateAPITokenInput struct {
	Name        string   `json:"name"`
	Permissions []string `json:"permissions"`
	ExpiresAt   *string  `json:"expiresAt"`
}

var CreateAPIToken = func(c *fiber.Ctx) error {
	apiToken := models.APIToken{}

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	input := CreateAPITokenInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	name, err := validateName(input.Name)
	if err != nil {
		return err
	}
	permissions, permissionIDs, err := resolvePermissions(input.Permissions)
	if err != nil {
		return err
	}

	var expiresAt *time.Time
	if input.ExpiresAt != nil {
		parsed, err := time.Parse(time.RFC3339, *input.ExpiresAt)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "Invalid expiry date! Use an RFC 3339 timestamp.")
		}
		if parsed.Before(time.Now().Add(constants.API_TOKEN_MIN_LIFETIME - constants.API_TOKEN_EXPIRY_CLOCK_SKEW)) {
			return fiber.NewError(fiber.StatusBadRequest, "An API token must be valid for at least one day!")
		}
		expiresAt = &parsed
	}

	active, err := apiToken.CountActiveByUser(user.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if active >= int64(constants.API_TOKEN_MAX_ACTIVE_PER_USER) {
		return fiber.NewError(fiber.StatusBadRequest, "You can have at most 25 active API tokens. Revoke one first.")
	}

	// A 48-bit prefix rarely collides; when it does, mint a fresh token rather than fail.
	for attempt := 1; ; attempt++ {
		fullToken, prefix, tokenHash, err := pkg.GenerateAPIToken()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		taken, err := apiToken.PrefixExists(prefix)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		if taken {
			if attempt >= constants.API_TOKEN_PREFIX_ATTEMPTS {
				return fiber.NewError(fiber.StatusInternalServerError, "could not generate a unique API token prefix")
			}
			continue
		}

		created, err := apiToken.Create(models.APIToken{
			UserID:    user.ID,
			Name:      name,
			Prefix:    prefix,
			TokenHash: tokenHash,
			ExpiresAt: expiresAt,
		}, permissionIDs)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		data := apiTokenData(created, permissions)
		data["token"] = fullToken
		response := fiber.Map{
			"status":  "success",
			"message": "API token created! Copy it now, you won't be able to see it again.",
			"data":    data,
		}
		return c.Status(fiber.StatusCreated).JSON(response)
	}
}
