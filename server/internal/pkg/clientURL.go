package pkg

import (
	"os"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

// GetClientBaseURL returns the public origin of this deployment (APP_BASE_URL), with no trailing slash
func GetClientBaseURL() string {
	if baseURL := os.Getenv("APP_BASE_URL"); baseURL != "" {
		return strings.TrimSuffix(baseURL, "/")
	}
	return constants.LOCAL_CLIENT_ORIGIN
}
