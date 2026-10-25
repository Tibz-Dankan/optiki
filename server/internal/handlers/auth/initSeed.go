package auth

import (
	"log"
	"os"

	"github.com/Tibz-Dankan/optiki/internal/data"
	"github.com/Tibz-Dankan/optiki/internal/models"
)

func InitializeDataSeeding() {

	permission := models.Permission{}
	if err := permission.Seed(data.APITokenPermissions); err != nil {
		log.Fatal("Seeding API token permissions failed: ", err)
	}

	if os.Getenv("SEED_DEMO") == "true" {
		SeedDemoAccounts()
	}
}

func init() {
	InitializeDataSeeding()
}
