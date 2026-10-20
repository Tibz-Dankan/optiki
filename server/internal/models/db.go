package models

import (
	"context"
	"log"
	"os"
	"sync"

	"github.com/Tibz-Dankan/optiki/internal/constants"
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
		case "deployed_development":
			dsn = os.Getenv("OPTIKI_DEV_DSN")
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

		if err := autoMigrate(gormDB); err != nil {
			log.Fatal("Failed to make auto migration: ", err)
		}
		log.Println("Auto Migration successful")
	})

	return gormDB
}

// Every preview and production share one schema, so concurrent boots must not migrate at the same time.
func autoMigrate(gormDB *gorm.DB) error {
	sqlDB, err := gormDB.DB()
	if err != nil {
		return err
	}

	migrationCtx := context.Background()
	conn, err := sqlDB.Conn(migrationCtx)
	if err != nil {
		return err
	}
	defer conn.Close()

	if _, err := conn.ExecContext(migrationCtx, "SELECT pg_advisory_lock($1)", constants.MIGRATION_ADVISORY_LOCK_KEY); err != nil {
		return err
	}
	defer func() {
		if _, err := conn.ExecContext(migrationCtx, "SELECT pg_advisory_unlock($1)", constants.MIGRATION_ADVISORY_LOCK_KEY); err != nil {
			log.Println("Error releasing migration lock:", err)
		}
	}()

	return gormDB.AutoMigrate(&User{}, &Session{}, &OTP{}, &Appearance{})
}
