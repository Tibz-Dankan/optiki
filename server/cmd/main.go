package main

import (
	"log"
	"os"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/middlewares"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/Tibz-Dankan/optiki/internal/routes"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/rendered"
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
	warnMissingFeatures()
	failInterruptedScans()

	app := fiber.New(fiber.Config{
		ErrorHandler: pkg.DefaultErrorHandler,
		BodyLimit:    int(constants.MAX_REQUEST_BODY_SIZE),
	})

	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: pkg.IsAllowedOrigin,
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
}

// warnMissingFeatures names each optional feature this process can't offer, so a gap shows at boot
// rather than on the first scan or email
func warnMissingFeatures() {
	if rendered.ChromePath() == "" {
		log.Println("No Chrome or Chromium found: rendered URL scans will fail. Install Chromium or set CHROME_BIN")
	}
	if !pkg.S3Configured() {
		log.Println("S3 isn't configured: rendered scans will be stored without screenshots")
	}
	if os.Getenv("RESEND_API_KEY") == "" {
		log.Println("RESEND_API_KEY isn't set: emails are logged in local development and fail when deployed")
	}
	if !pkg.GeminiConfigured() {
		log.Println("GEMINI_API_KEY isn't set: scans won't get fix reports")
	}
}

// failInterruptedScans fails the multiple-page scans and fix reports a previous process left queued or
// running; their background work died with it
func failInterruptedScans() {
	multiplePageScan := models.MultiplePageScan{}
	count, err := multiplePageScan.FailInterrupted()
	if err != nil {
		log.Println("failing interrupted multiple-page scans:", err)
	} else if count > 0 {
		log.Printf("Marked %d interrupted multiple-page scans as failed", count)
	}

	fixReport := models.FixReport{}
	count, err = fixReport.FailInterrupted()
	if err != nil {
		log.Println("failing interrupted fix reports:", err)
	} else if count > 0 {
		log.Printf("Marked %d interrupted fix reports as failed", count)
	}
}
