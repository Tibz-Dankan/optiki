package pkg

import (
	"crypto/rand"
	"encoding/base64"
)

// GenerateRandomState returns a random 32-byte string in URL-safe base64
func GenerateRandomState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
