package scan

import (
	"sync"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

var fixReportJobs = make(chan string, constants.FIX_REPORT_QUEUE_SIZE)
var startFixReportWorkers sync.Once

// enqueueFixReport hands a queued fix report to the background workers; it reports false when the queue is full
func enqueueFixReport(id string) bool {
	startFixReportWorkers.Do(func() {
		for range constants.FIX_REPORT_WORKERS {
			go func() {
				for job := range fixReportJobs {
					runFixReport(job)
				}
			}()
		}
	})
	select {
	case fixReportJobs <- id:
		return true
	default:
		return false
	}
}
