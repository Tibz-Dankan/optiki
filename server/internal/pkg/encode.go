package pkg

import (
	"crypto/sha256"
	"encoding/hex"
)

// EncodeToHexString returns the SHA-256 hex digest of input — how OTPs and API token secrets are stored
func EncodeToHexString(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}
