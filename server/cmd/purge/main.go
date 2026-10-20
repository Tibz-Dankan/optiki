package main

import (
	"log"
	"os"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
)

// Deletes every row tagged with one env, e.g. `purge pr-12` when that PR closes. Production is refused.
func main() {
	if len(os.Args) != 2 {
		log.Fatal("usage: purge <env>")
	}

	env := os.Args[1]
	if env == "" || env == constants.DEPLOY_ENV_PRODUCTION {
		log.Fatal("refusing to purge an empty or production env")
	}

	deleted, err := models.PurgeEnv(env)
	if err != nil {
		log.Fatal("purge failed: ", err)
	}

	log.Printf("Purged env %s: %v", env, deleted)
}
