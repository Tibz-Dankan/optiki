package scan

import (
	"sync"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

var multiplePageScanJobs = make(chan string, constants.MULTIPLE_PAGE_SCAN_QUEUE_SIZE)
var startMultiplePageScanWorkers sync.Once

// enqueueMultiplePageScan hands a queued scan to the background workers; it reports false when the queue is full
func enqueueMultiplePageScan(id string) bool {
	startMultiplePageScanWorkers.Do(func() {
		for range constants.MULTIPLE_PAGE_SCAN_WORKERS {
			go func() {
				for job := range multiplePageScanJobs {
					runMultiplePageScan(job)
				}
			}()
		}
	})
	select {
	case multiplePageScanJobs <- id:
		return true
	default:
		return false
	}
}
