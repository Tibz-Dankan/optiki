package scan

import (
	"log"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// queueFixReport queues the fix report of a scan or a multiple-page scan and hands it to the workers. A report
// the full queue can't take is stored as FAILED so its owner can generate it again.
func queueFixReport(report models.FixReport) (models.FixReport, error) {
	fixReportModel := models.FixReport{}
	queued, ok, err := fixReportModel.Queue(report)
	if err != nil {
		return queued, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if !ok {
		return queued, pkg.NewReasonError(fiber.StatusConflict, constants.ErrReasonFixReportInProgress, constants.ErrFixReportInProgress)
	}

	if !enqueueFixReport(queued.ID) {
		if err := fixReportModel.Fail(queued.ID, "QUEUE_FULL", constants.ErrFixReportQueueFull, nil); err != nil {
			log.Printf("marking fix report %s failed: %v", queued.ID, err)
		}
		return queued, pkg.NewReasonError(fiber.StatusTooManyRequests, constants.ErrReasonFixReportQueueFull, constants.ErrFixReportQueueFull)
	}
	return queued, nil
}
