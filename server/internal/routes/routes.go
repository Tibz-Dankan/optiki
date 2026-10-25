package routes

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/handlers/apitoken"
	"github.com/Tibz-Dankan/optiki/internal/handlers/appearance"
	"github.com/Tibz-Dankan/optiki/internal/handlers/auth"
	"github.com/Tibz-Dankan/optiki/internal/handlers/docs"
	"github.com/Tibz-Dankan/optiki/internal/handlers/gym"
	"github.com/Tibz-Dankan/optiki/internal/handlers/health"
	"github.com/Tibz-Dankan/optiki/internal/handlers/rules"
	"github.com/Tibz-Dankan/optiki/internal/handlers/scan"
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

	// Scan
	scanGroup := app.Group("/api/v1/scan", func(c *fiber.Ctx) error {
		return c.Next()
	})
	scanGroup.Post("/", middlewares.OptionalAuth, middlewares.ScanRateLimit, scan.CreateScan)
	scanGroup.Get("/", middlewares.Auth, middlewares.VerifiedEmail, scan.GetScans)
	scanGroup.Get("/:id", middlewares.OptionalAuth, scan.GetScan)
	scanGroup.Patch("/:id", middlewares.Auth, middlewares.VerifiedEmail, scan.UpdateScan)
	scanGroup.Delete("/:id", middlewares.Auth, middlewares.VerifiedEmail, scan.DeleteScan)

	// Scan (token API)
	scanAPIGroup := app.Group("/client/v1/scan", func(c *fiber.Ctx) error {
		return c.Next()
	})
	scanAPIGroup.Post("/", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_CREATE), middlewares.ScanRateLimit, scan.CreateScan)
	scanAPIGroup.Get("/", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_VIEW), scan.GetScans)
	scanAPIGroup.Get("/:id", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_VIEW), scan.GetScan)
	scanAPIGroup.Patch("/:id", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_EDIT), scan.UpdateScan)
	scanAPIGroup.Delete("/:id", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_DELETE), scan.DeleteScan)

	// API token
	apiTokenGroup := app.Group("/api/v1/apitoken", func(c *fiber.Ctx) error {
		return c.Next()
	})
	apiTokenGroup.Post("/", middlewares.Auth, middlewares.VerifiedEmail, apitoken.CreateAPIToken)
	apiTokenGroup.Get("/", middlewares.Auth, middlewares.VerifiedEmail, apitoken.GetAPITokens)
	apiTokenGroup.Get("/permissions", middlewares.Auth, middlewares.VerifiedEmail, apitoken.GetAPITokenPermissions)
	apiTokenGroup.Get("/:id", middlewares.Auth, middlewares.VerifiedEmail, apitoken.GetAPIToken)
	apiTokenGroup.Patch("/:id/revoke", middlewares.Auth, middlewares.VerifiedEmail, apitoken.RevokeAPIToken)
	apiTokenGroup.Patch("/:id", middlewares.Auth, middlewares.VerifiedEmail, apitoken.UpdateAPIToken)
	apiTokenGroup.Delete("/:id", middlewares.Auth, middlewares.VerifiedEmail, apitoken.DeleteAPIToken)

	// Rules
	app.Get("/api/v1/rules", rules.GetRules)
	app.Get("/api/v1/rules/:id", rules.GetRule)

	// Gym
	app.Get("/api/v1/gym", gym.GetGymPages)
	app.Get("/gym/pages/:file", gym.GetGymPage)
	app.Get("/gym/redirect-private", gym.RedirectPrivate)

	// Docs
	app.Get("/api/v1/openapi.yaml", docs.GetOpenAPISpec)

	// Health
	app.Get("/health", health.CheckHealth)

	// Status
	app.Get("/status", status.GetAppStatus)

	// 404 handler
	app.Use("*", func(c *fiber.Ctx) error {
		return fiber.NewError(fiber.StatusNotFound, "API endpoint not found!")
	})
}
