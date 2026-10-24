package main

import (
	"log"
	"os"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/handlers/auth"
	"github.com/Tibz-Dankan/optiki/internal/middlewares"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/Tibz-Dankan/optiki/internal/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	if os.Getenv("GO_ENV") == "development" {
		if err := godotenv.Load(pkg.EnvFile()); err != nil {
			log.Fatalf("Error loading .env file")
		}
		log.Println("Loaded .env var file")
	}

	checkRequiredEnv()

	app := fiber.New(fiber.Config{
		ErrorHandler: pkg.DefaultErrorHandler,
		BodyLimit:    int(constants.MAX_REQUEST_BODY_SIZE),
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(pkg.AllowedOrigins(), ","),
		AllowHeaders:     "Origin, Content-Type, Accept",
		ExposeHeaders:    "Content-Length, X-Email-Verification-Sent, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset",
		AllowCredentials: true,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}))

	app.Use(logger.New())

	app.Use(middlewares.LimitRequestBody)
	app.Use(middlewares.SetClientIP)
	app.Use(middlewares.SetUserInRequest)

	routes.AppRoutes(app)

	if os.Getenv("SEED_DEMO") == "true" {
		auth.SeedDemoAccounts()
	}

	var port string

	switch pkg.GetAppEnv() {
	case "deployed_production":
		port = "8001"
	default:
		port = "8000"
	}

	log.Fatal(app.Listen("0.0.0.0:" + port))
}

func checkRequiredEnv() {
	if len(os.Getenv("JWT_SECRET")) < constants.MIN_JWT_SECRET_LENGTH {
		log.Fatalf("JWT_SECRET must be at least %d characters", constants.MIN_JWT_SECRET_LENGTH)
	}

	if pkg.GetAppEnv() == "local_development" {
		return
	}

	if os.Getenv("APP_BASE_URL") == "" {
		log.Fatal("APP_BASE_URL must be set in deployed environments")
	}
}
