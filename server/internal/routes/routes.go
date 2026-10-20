package routes

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/handlers/appearance"
	"github.com/Tibz-Dankan/optiki/internal/handlers/auth"
	"github.com/Tibz-Dankan/optiki/internal/handlers/client"
	"github.com/Tibz-Dankan/optiki/internal/handlers/docs"
	"github.com/Tibz-Dankan/optiki/internal/handlers/health"
	"github.com/Tibz-Dankan/optiki/internal/handlers/status"
	"github.com/Tibz-Dankan/optiki/internal/middlewares"
	"github.com/gofiber/fiber/v2"
)

func AppRoutes(app *fiber.App) {
	// Auth
	authGroup := app.Group("/api/v1/auth", func(c *fiber.Ctx) error {
		return c.Next()
	})
	authGroup.Post("/signup", middlewares.AuthRateLimit, auth.SignUp)
	authGroup.Post("/signin", middlewares.AuthRateLimit, auth.SignIn)
	authGroup.Post("/signout", auth.SignOut)
	authGroup.Post("/signout-all", middlewares.Auth, auth.SignOutAllDevices)
	authGroup.Post("/refresh", auth.RefreshToken)
	authGroup.Get("/me", middlewares.Auth, auth.GetMe)
	authGroup.Post("/forgot-password", middlewares.AuthRateLimit, auth.ForgotPassword)
	authGroup.Patch("/verify-otp", middlewares.AuthRateLimit, auth.VerifyOTP)
	authGroup.Patch("/reset-password/:otp", middlewares.AuthRateLimit, auth.ResetPassword)
	authGroup.Post("/verify-email/initiate", middlewares.AuthRateLimit, middlewares.Auth, auth.InitiateEmailVerification)
	authGroup.Post("/verify-email", middlewares.AuthRateLimit, auth.VerifyEmail)
	authGroup.Patch("/user/change-email", middlewares.AuthRateLimit, middlewares.Auth, auth.ChangeEmail)
	authGroup.Get("/user/session", middlewares.Auth, middlewares.VerifiedEmail, auth.GetActiveSessions)
	authGroup.Patch("/user/session/:sessionID/revoke", middlewares.Auth, middlewares.VerifiedEmail, auth.RevokeSession)
	authGroup.Patch("/user/:id/change-password", middlewares.Auth, middlewares.VerifiedEmail, auth.ChangePassword)
	authGroup.Patch("/user/:id", middlewares.Auth, middlewares.VerifiedEmail, auth.UpdateUser)

	// Appearance
	appearanceGroup := app.Group("/api/v1/appearance", func(c *fiber.Ctx) error {
		return c.Next()
	})
	appearanceGroup.Post("/", middlewares.Auth, appearance.CreateAppearance)
	appearanceGroup.Get("/me", middlewares.Auth, appearance.GetMyAppearance)
	appearanceGroup.Patch("/:id", middlewares.Auth, appearance.UpdateAppearance)

	// Docs
	app.Get("/api/v1/openapi.yaml", docs.GetOpenAPISpec)

	// Health
	app.Get("/health", health.CheckHealth)

	// Status
	app.Get("/status", status.GetAppStatus)

	// Client
	app.Static("/", constants.CLIENT_DIST_DIR, fiber.Static{Compress: true})
	app.Get("/*", client.ServeIndex)

	// 404 handler
	app.Use("*", func(c *fiber.Ctx) error {
		return fiber.NewError(fiber.StatusNotFound, "API endpoint not found!")
	})
}
