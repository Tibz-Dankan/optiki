package pkg

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

var ErrInvalidAPIToken = errors.New("invalid api token")

// GenerateAPIToken returns a new opt_<prefix>_<token>, its prefix, and the SHA-256 of its secret
func GenerateAPIToken() (fullToken, prefix, tokenHash string, err error) {
	prefixBytes := make([]byte, constants.API_TOKEN_PREFIX_BYTES)
	secretBytes := make([]byte, constants.API_TOKEN_SECRET_BYTES)
	if _, err = rand.Read(prefixBytes); err != nil {
		return "", "", "", err
	}
	if _, err = rand.Read(secretBytes); err != nil {
		return "", "", "", err
	}
	prefix = hex.EncodeToString(prefixBytes)
	secret := hex.EncodeToString(secretBytes)
	return constants.API_TOKEN_PREFIX + "_" + prefix + "_" + secret, prefix, HashAPITokenSecret(secret), nil
}

// ParseAPIToken splits a presented token; anything not shaped opt_<12 hex>_<64 hex> is ErrInvalidAPIToken
func ParseAPIToken(raw string) (prefix, secret string, err error) {
	parts := strings.Split(raw, "_")
	if len(parts) != 3 || parts[0] != constants.API_TOKEN_PREFIX {
		return "", "", ErrInvalidAPIToken
	}
	if !isLowerHex(parts[1], constants.API_TOKEN_PREFIX_BYTES*2) || !isLowerHex(parts[2], constants.API_TOKEN_SECRET_BYTES*2) {
		return "", "", ErrInvalidAPIToken
	}
	return parts[1], parts[2], nil
}

// HashAPITokenSecret returns the SHA-256 hex of a token secret
func HashAPITokenSecret(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

// VerifyAPITokenSecret compares a secret with a stored hash in constant time
func VerifyAPITokenSecret(secret, storedHash string) bool {
	return subtle.ConstantTimeCompare([]byte(HashAPITokenSecret(secret)), []byte(storedHash)) == 1
}

func isLowerHex(value string, length int) bool {
	if len(value) != length {
		return false
	}
	for _, r := range value {
		if (r < '0' || r > '9') && (r < 'a' || r > 'f') {
			return false
		}
	}
	return true
}
