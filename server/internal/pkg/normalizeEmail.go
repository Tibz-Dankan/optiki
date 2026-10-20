package pkg

import "strings"

// NormalizeEmail returns email lowercased with surrounding whitespace removed
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
