package pkg

import (
	"slices"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

// AllowedOrigins returns the origins that may make credentialed cross-origin requests: the local client and this deployment
func AllowedOrigins() []string {
	origins := []string{constants.LOCAL_CLIENT_ORIGIN}
	if baseURL := GetClientBaseURL(); baseURL != constants.LOCAL_CLIENT_ORIGIN {
		origins = append(origins, baseURL)
	}
	return origins
}

// IsAllowedOrigin reports whether origin may make credentialed cross-origin requests to the API
func IsAllowedOrigin(origin string) bool {
	return slices.Contains(AllowedOrigins(), origin)
}
