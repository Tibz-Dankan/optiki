package engine

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"strings"
)

// Fingerprint identifies a finding across commits: it survives unrelated edits elsewhere on the page
// because the selector path anchors on the nearest ancestor with an id.
func Fingerprint(ruleID, route, selectorPath, role, name string) string {
	sum := sha256.Sum256([]byte(strings.Join([]string{ruleID, route, selectorPath, role, NormalizeName(name)}, "\x1f")))
	return hex.EncodeToString(sum[:])
}

// uniqueFingerprints disambiguates look-alikes (duplicate ids make identical paths) by occurrence order.
func uniqueFingerprints(findings []Finding) {
	seen := map[string]int{}
	for index := range findings {
		base := findings[index].Fingerprint
		seen[base]++
		if occurrence := seen[base]; occurrence > 1 {
			sum := sha256.Sum256([]byte(base + "\x1f" + strconv.Itoa(occurrence)))
			findings[index].Fingerprint = hex.EncodeToString(sum[:])
		}
	}
}
