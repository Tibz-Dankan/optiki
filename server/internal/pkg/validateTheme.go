package pkg

import "strings"

var validThemes = map[string]bool{
	"light":  true,
	"dark":   true,
	"system": true,
}

// IsValidTheme reports whether theme is a recognised appearance theme, case-insensitively
func IsValidTheme(theme string) bool {
	return validThemes[strings.ToLower(theme)]
}
