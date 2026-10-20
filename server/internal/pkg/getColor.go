package pkg

import "math/rand/v2"

var profileColors = []string{
	"#0F8B9A", "#2563EB", "#7C3AED", "#DB2777", "#DC2626",
	"#EA580C", "#D97706", "#65A30D", "#16A34A", "#059669",
	"#0891B2", "#0284C7", "#4F46E5", "#9333EA", "#C026D3",
	"#E11D48", "#57534E", "#475569", "#0D9488", "#1D4ED8",
}

// GetRandomColor returns a profile background colour
func GetRandomColor() string {
	return profileColors[rand.IntN(len(profileColors))]
}
