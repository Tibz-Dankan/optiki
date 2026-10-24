package pkg

import "os"

// GetAppEnv returns the application environment
func GetAppEnv() string {
	switch os.Getenv("GO_ENV") {
	case "development":
		return "local_development"
	case "production":
		return "deployed_production"
	default:
		return "unknown"
	}
}
