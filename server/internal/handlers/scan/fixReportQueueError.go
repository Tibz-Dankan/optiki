package scan

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// fixReportQueueError tells a client turned away by the full queue when to try again
func fixReportQueueError(c *fiber.Ctx, err error) error {
	var reason *pkg.ReasonError
	if errors.As(err, &reason) && reason.Reason == constants.ErrReasonFixReportQueueFull {
		c.Set(fiber.HeaderRetryAfter, constants.FIX_REPORT_QUEUE_RETRY_AFTER)
	}
	return err
}
