package pkg

import (
	"crypto/rand"
	"math/big"
	"strings"
)

// GenerateNumericCode returns a cryptographically random string of length digits, for OTPs
func GenerateNumericCode(length int) (string, error) {
	var code strings.Builder
	for range length {
		digit, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		code.WriteString(digit.String())
	}
	return code.String(), nil
}
