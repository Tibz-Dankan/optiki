package pkg

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

// AllowedOrigins returns the origins that may make credentialed cross-origin requests: the local client, this
// deployment and its Netlify previews. A "*" stands for exactly one DNS label; the "--" ties it to this Netlify site
func AllowedOrigins() []string {
	origins := []string{constants.LOCAL_CLIENT_ORIGIN, "https://*--optikii.netlify.app"}
	if baseURL := GetClientBaseURL(); baseURL != constants.LOCAL_CLIENT_ORIGIN {
		origins = append(origins, baseURL)
	}
	return origins
}

// IsAllowedOrigin reports whether origin matches one of AllowedOrigins
func IsAllowedOrigin(origin string) bool {
	for _, allowed := range AllowedOrigins() {
		prefix, suffix, isWildcard := strings.Cut(allowed, "*")
		if !isWildcard {
			if origin == allowed {
				return true
			}
			continue
		}
		if len(origin) > len(prefix)+len(suffix) && strings.HasPrefix(origin, prefix) && strings.HasSuffix(origin, suffix) &&
			!strings.ContainsAny(origin[len(prefix):len(origin)-len(suffix)], ".:") {
			return true
		}
	}
	return false
}
