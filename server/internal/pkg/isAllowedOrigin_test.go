package pkg

import "testing"

func TestIsAllowedOrigin(t *testing.T) {
	t.Setenv("GO_ENV", "production")

	allowed := []string{
		"http://localhost:5173",
		"https://optikii.netlify.app",
		"https://deploy-preview-12--optikii.netlify.app",
		"https://6ade03153f2a0fbcbfb71550--optikii.netlify.app",
	}
	for _, origin := range allowed {
		if !IsAllowedOrigin(origin) {
			t.Errorf("%s must be allowed", origin)
		}
	}

	rejected := []string{
		"",
		"https://notoptikii.netlify.app",
		"https://evil.com--optikii.netlify.app",
		"https://x--optikii.netlify.app.evil.com",
		"http://x--optikii.netlify.app",
		"https://--optikii.netlify.app",
		"https://x--other.netlify.app",
		"https://x--optikii.netlify.app:8443",
		"http://localhost:3000",
	}
	for _, origin := range rejected {
		if IsAllowedOrigin(origin) {
			t.Errorf("%s must be rejected", origin)
		}
	}
}
