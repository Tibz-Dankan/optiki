package pkg

import (
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/data"
)

// ResolvePageName returns the site visit page name for a client path
func ResolvePageName(path string) string {
	if len(path) > 1 {
		path = strings.TrimSuffix(path, "/")
	}

	if name, ok := data.SiteVisitPageNames[path]; ok {
		return name
	}

	pathSegments := strings.Split(path, "/")
	for pattern, name := range data.SiteVisitPageNames {
		if strings.Contains(pattern, ":") && matchesPagePattern(strings.Split(pattern, "/"), pathSegments) {
			return name
		}
	}

	return data.SiteVisitPageNames["*"]
}

func matchesPagePattern(patternSegments []string, pathSegments []string) bool {
	if len(patternSegments) != len(pathSegments) {
		return false
	}

	for i, patternSegment := range patternSegments {
		if strings.HasPrefix(patternSegment, ":") {
			if pathSegments[i] == "" {
				return false
			}
			continue
		}
		if patternSegment != pathSegments[i] {
			return false
		}
	}

	return true
}
