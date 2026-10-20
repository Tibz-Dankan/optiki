package pkg

import "regexp"

var emailPattern = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// IsValidEmail reports whether email looks like a deliverable address
func IsValidEmail(email string) bool {
	return emailPattern.MatchString(email)
}
