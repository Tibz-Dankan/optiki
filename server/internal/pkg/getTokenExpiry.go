package pkg

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

// GetTokenExpiry returns the access and refresh token lifetimes for a user role
func GetTokenExpiry(role string) (time.Duration, time.Duration) {
	return constants.ACCESS_TOKEN_EXPIRY, constants.REFRESH_TOKEN_EXPIRY
}
