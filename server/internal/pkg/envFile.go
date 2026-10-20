package pkg

import "os"

// EnvFile returns the dotenv file loaded in local development: OPTIKI_ENV_FILE when set, otherwise .env in the working directory
func EnvFile() string {
	if path := os.Getenv("OPTIKI_ENV_FILE"); path != "" {
		return path
	}
	return ".env"
}
