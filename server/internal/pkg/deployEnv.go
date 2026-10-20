package pkg

import (
	"os"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

// GetDeployEnv returns the env tag every user-data row is stamped and filtered with, e.g. local, pr-12 or production
func GetDeployEnv() string {
	if deployEnv := os.Getenv("OPTIKI_ENV"); deployEnv != "" {
		return deployEnv
	}
	if GetAppEnv() == "local_development" {
		return constants.DEPLOY_ENV_LOCAL
	}
	return ""
}
