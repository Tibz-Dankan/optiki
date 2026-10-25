package pkg

import (
	"errors"
	"strings"
	"testing"
)

func TestGenerateAndParseAPIToken(t *testing.T) {
	full, prefix, hash, err := GenerateAPIToken()
	if err != nil {
		t.Fatal(err)
	}
	if len(full) != len("opt_")+12+1+64 || !strings.HasPrefix(full, "opt_"+prefix+"_") {
		t.Fatalf("unexpected token shape: %s", full)
	}
	parsedPrefix, secret, err := ParseAPIToken(full)
	if err != nil || parsedPrefix != prefix {
		t.Fatalf("round trip failed: %v %s", err, parsedPrefix)
	}
	if !VerifyAPITokenSecret(secret, hash) {
		t.Fatal("the generated secret must verify against its hash")
	}
	if hash != HashAPITokenSecret(secret) || len(hash) != 64 {
		t.Fatalf("hash mismatch: %s", hash)
	}
}

func TestGeneratedTokensAreUnique(t *testing.T) {
	seenPrefixes, seenTokens := map[string]bool{}, map[string]bool{}
	for range 200 {
		full, prefix, _, err := GenerateAPIToken()
		if err != nil {
			t.Fatal(err)
		}
		if seenPrefixes[prefix] || seenTokens[full] {
			t.Fatalf("duplicate token generated: %s", full)
		}
		seenPrefixes[prefix], seenTokens[full] = true, true
	}
}

func TestParseAPITokenRejectsMalformed(t *testing.T) {
	valid, _, _, _ := GenerateAPIToken()
	parts := strings.Split(valid, "_")
	cases := map[string]string{
		"empty":              "",
		"wrong literal":      "gsk_" + parts[1] + "_" + parts[2],
		"uppercase hex":      "opt_" + strings.ToUpper(parts[1]) + "_" + parts[2],
		"short prefix":       "opt_" + parts[1][:11] + "_" + parts[2],
		"long secret":        "opt_" + parts[1] + "_" + parts[2] + "a",
		"missing part":       "opt_" + parts[1],
		"extra underscore":   valid + "_x",
		"non-hex characters": "opt_" + parts[1] + "_" + strings.Repeat("z", 64),
		"bearer prefix left": "Bearer " + valid,
		"whitespace":         " " + valid,
	}
	for name, raw := range cases {
		t.Run(name, func(t *testing.T) {
			if _, _, err := ParseAPIToken(raw); !errors.Is(err, ErrInvalidAPIToken) {
				t.Fatalf("want ErrInvalidAPIToken, got %v", err)
			}
		})
	}
}

func TestVerifyAPITokenSecretRejectsChanges(t *testing.T) {
	full, _, hash, _ := GenerateAPIToken()
	_, secret, _ := ParseAPIToken(full)
	tampered := []byte(secret)
	if tampered[0] == 'a' {
		tampered[0] = 'b'
	} else {
		tampered[0] = 'a'
	}
	if VerifyAPITokenSecret(string(tampered), hash) {
		t.Fatal("a one-character change must not verify")
	}
	if VerifyAPITokenSecret(secret, "") {
		t.Fatal("an empty stored hash must not verify")
	}
}
