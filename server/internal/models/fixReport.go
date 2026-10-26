package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (f *FixReport) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (f *FixReport) FindOne(id string) (FixReport, error) {
	var report FixReport
	err := db.First(&report, "id = ?", id).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return report, err
	}
	return report, nil
}

func (f *FixReport) FindByScan(scanID string) (FixReport, error) {
	var report FixReport
	err := db.First(&report, "\"scanID\" = ?", scanID).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return report, err
	}
	return report, nil
}

func (f *FixReport) FindByMultiplePageScan(multiplePageScanID string) (FixReport, error) {
	var report FixReport
	err := db.First(&report, "\"multiplePageScanID\" = ?", multiplePageScanID).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return report, err
	}
	return report, nil
}

// Queue creates the target's report as QUEUED, or resets a finished one to QUEUED; it reports false, with the
// existing row, when a report for the target is already queued or running
func (f *FixReport) Queue(report FixReport) (FixReport, bool, error) {
	queued := false
	err := db.Transaction(func(tx *gorm.DB) error {
		query := tx.Clauses(clause.Locking{Strength: "UPDATE"})
		if report.ScanID != nil {
			query = query.Where("\"scanID\" = ?", *report.ScanID)
		} else {
			query = query.Where("\"multiplePageScanID\" = ?", *report.MultiplePageScanID)
		}

		var existing FixReport
		err := query.First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			report.Status = "QUEUED"
			if err := tx.Create(&report).Error; err != nil {
				return err
			}
			queued = true
			return nil
		}
		if err != nil {
			return err
		}
		if existing.Status == "QUEUED" || existing.Status == "RUNNING" {
			report = existing
			return nil
		}

		if err := tx.Model(&FixReport{}).Where("id = ?", existing.ID).Updates(map[string]interface{}{
			"status":          "QUEUED",
			"triggeredBy":     report.TriggeredBy,
			"model":           nil,
			"content":         nil,
			"findingsCovered": 0,
			"inputTokens":     nil,
			"outputTokens":    nil,
			"errorCode":       nil,
			"errorMessage":    nil,
			"startedAt":       nil,
			"completedAt":     nil,
			"durationMs":      nil,
		}).Error; err != nil {
			return err
		}
		if err := tx.First(&report, "id = ?", existing.ID).Error; err != nil {
			return err
		}
		queued = true
		return nil
	})
	return report, queued, err
}

// MarkRunning moves a queued report to RUNNING; it reports false when the report is no longer queued
func (f *FixReport) MarkRunning(id string, startedAt time.Time) (bool, error) {
	result := db.Model(&FixReport{}).
		Where("id = ? AND status = ?", id, "QUEUED").
		Updates(map[string]interface{}{"status": "RUNNING", "startedAt": startedAt})
	return result.RowsAffected == 1, result.Error
}

func (f *FixReport) Complete(id string, updates map[string]interface{}) error {
	updates["status"] = "COMPLETED"
	return db.Model(&FixReport{}).Where("id = ? AND status = ?", id, "RUNNING").Updates(updates).Error
}

func (f *FixReport) Fail(id, code, message string, startedAt *time.Time) error {
	completedAt := time.Now()
	updates := map[string]interface{}{
		"status":       "FAILED",
		"errorCode":    code,
		"errorMessage": message,
		"completedAt":  completedAt,
	}
	if startedAt != nil {
		updates["durationMs"] = int(completedAt.Sub(*startedAt).Milliseconds())
	}
	return db.Model(&FixReport{}).
		Where("id = ? AND status IN ?", id, []string{"QUEUED", "RUNNING"}).
		Updates(updates).Error
}

// FailInterrupted marks every queued or running report as failed; the process that generated them is gone
func (f *FixReport) FailInterrupted() (int64, error) {
	result := db.Model(&FixReport{}).
		Where("status IN ?", []string{"QUEUED", "RUNNING"}).
		Updates(map[string]interface{}{
			"status":       "FAILED",
			"errorCode":    "INTERRUPTED",
			"errorMessage": "The server restarted while this report was being generated. Generate it again.",
			"completedAt":  time.Now(),
		})
	return result.RowsAffected, result.Error
}
