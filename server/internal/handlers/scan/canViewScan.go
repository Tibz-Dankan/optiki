package scan

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

// canViewScan lets the owner see a scan, and anyone but a token see a public one
func canViewScan(c *fiber.Ctx, scan models.Scan) bool {
	viewer := viewerID(c)
	isOwner := viewer != "" && scan.UserID != nil && *scan.UserID == viewer
	_, isToken := c.Locals("apiToken").(models.APIToken)
	return isOwner || (!isToken && scan.Visibility == constants.SCAN_VISIBILITY_PUBLIC)
}
