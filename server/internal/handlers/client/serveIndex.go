package client

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/gofiber/fiber/v2"
)

var ServeIndex = func(c *fiber.Ctx) error {
	path := c.Path()
	if strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/client/") {
		return c.Next()
	}

	indexFile := filepath.Join(constants.CLIENT_DIST_DIR, "index.html")
	if _, err := os.Stat(indexFile); err != nil {
		return c.Next()
	}

	c.Set(fiber.HeaderCacheControl, "no-cache")
	return c.SendFile(indexFile)
}
