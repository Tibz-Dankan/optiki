package scan

import (
	"context"
	"log"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// screenshotData signs a fresh 30-minute link on every read. Signing is local; a failure only drops the
// screenshot from this response.
func screenshotData(ctx context.Context, scan models.Scan) fiber.Map {
	attachment := scan.Screenshot
	if attachment == nil || !pkg.S3Configured() {
		return nil
	}
	client, err := pkg.S3()
	if err != nil {
		log.Println("signing screenshots skipped:", err)
		return nil
	}
	url, expiresAt, err := client.PresignGet(ctx, attachment.Key, constants.SCAN_SCREENSHOT_URL_EXPIRY)
	if err != nil {
		log.Printf("signing the screenshot of scan %s failed: %v", scan.ID, err)
		return nil
	}
	return fiber.Map{
		"id":          attachment.ID,
		"url":         url,
		"expiresAt":   expiresAt,
		"contentType": attachment.ContentType,
		"size":        attachment.Size,
		"width":       attachment.Width,
		"height":      attachment.Height,
	}
}
