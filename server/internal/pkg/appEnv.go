package pkg

import "os"

// GetAppEnv returns the application environment
func GetAppEnv() string {
	isProduction := os.Getenv("GO_ENV") == "production"
	isDevelopment := os.Getenv("GO_ENV") == "development"
	isDeployedProduction := os.Getenv("APP_ENV") == "production"

	switch {
	case isDevelopment:
		return "local_development"
	case isProduction && !isDeployedProduction:
		return "deployed_development"
	case isProduction && isDeployedProduction:
		return "deployed_production"
	default:
		return "unknown"
	}
}
