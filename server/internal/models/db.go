package models

import (
	"log"
	"os"
	"sync"

	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	gormDB *gorm.DB
	once   sync.Once
)

func Db() *gorm.DB {
	once.Do(func() {
		appEnv := pkg.GetAppEnv()

		if appEnv == "local_development" {
			if err := godotenv.Load(pkg.EnvFile()); err != nil {
				log.Fatalf("Error loading .env file")
			}
			log.Println("Loaded .env var file")
		}

		var dsn string
		switch appEnv {
		case "local_development":
			dsn = os.Getenv("OPTIKI_DEV_DSN_LOCAL")
		case "deployed_production":
			dsn = os.Getenv("OPTIKI_PROD_DSN")
		default:
			log.Fatal("Unrecognized appEnv: ", appEnv)
		}

		var err error
		gormDB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			SkipDefaultTransaction: true, PrepareStmt: true,
		})
		if err != nil {
			log.Fatal("Failed to connect to the database: ", err)
		}
		log.Println("Connected to postgres successfully")

		err = gormDB.AutoMigrate(
			&User{}, &Session{}, &OTP{}, &Appearance{},
			&Device{}, &Location{}, &SiteVisit{}, &AnonymousUserLink{},
			&Permission{}, &APIToken{}, &APITokenPermission{},
			&Attachment{},
			&Scan{}, &ScanRuleResult{}, &ScanFinding{},
		)
		if err != nil {
			log.Fatal("Failed to make auto migration: ", err)
		}
		log.Println("Auto Migration successful")
	})

	return gormDB
}
