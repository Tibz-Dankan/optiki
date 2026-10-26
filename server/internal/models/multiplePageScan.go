package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (m *MultiplePageScan) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

// MultiplePageRuleRollup is one rule's result across the completed pages of a multiple-page scan
type MultiplePageRuleRollup struct {
	RuleID       string `gorm:"column:ruleID"`
	Position     int    `gorm:"column:position"`
	Category     string `gorm:"column:category"`
	Priority     string `gorm:"column:priority"`
	Severity     string `gorm:"column:severity"`
	PagesFailed  int    `gorm:"column:pagesFailed"`
	PagesChecked int    `gorm:"column:pagesChecked"`
	Findings     int    `gorm:"column:findings"`
}

func (m *MultiplePageScan) Create(scan MultiplePageScan) (MultiplePageScan, error) {
	if err := db.Create(&scan).Error; err != nil {
		return scan, err
	}
	return scan, nil
}

func (m *MultiplePageScan) FindOne(id string) (MultiplePageScan, error) {
	var scan MultiplePageScan
	err := db.First(&scan, "id = ?", id).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return scan, err
	}
	return scan, nil
}

// FindPages returns the page scans of a multiple-page scan in the order they were crawled
func (m *MultiplePageScan) FindPages(id string) ([]Scan, error) {
	var scans []Scan
	err := db.Where("\"multiplePageScanID\" = ?", id).Order("\"createdAt\" ASC").Find(&scans).Error
	return scans, err
}

// RuleRollup counts, per rule, how many completed pages failed or passed it and how many findings it raised
func (m *MultiplePageScan) RuleRollup(id string) ([]MultiplePageRuleRollup, error) {
	var rows []MultiplePageRuleRollup
	err := db.Table("scan_rule_results AS r").
		Select("r.\"ruleID\" AS \"ruleID\", MIN(r.position) AS position, MIN(r.category) AS category, "+
			"MIN(r.priority) AS priority, MIN(r.severity) AS severity, "+
			"COUNT(*) FILTER (WHERE r.result = 'FAIL') AS \"pagesFailed\", "+
			"COUNT(*) FILTER (WHERE r.result IN ('PASS', 'FAIL')) AS \"pagesChecked\", "+
			"COALESCE(SUM(r.\"findingsCount\"), 0) AS findings").
		Joins("JOIN scans AS s ON s.id = r.\"scanID\"").
		Where("s.\"multiplePageScanID\" = ? AND s.status = ?", id, "COMPLETED").
		Group("r.\"ruleID\"").
		Order("position").
		Scan(&rows).Error
	return rows, err
}

func (m *MultiplePageScan) FindAllByUser(userID string, limit float64, cursor string) ([]MultiplePageScan, error) {
	var scans []MultiplePageScan
	query := db.Model(&MultiplePageScan{}).Where("\"userID\" = ?", userID)
	if cursor != "" {
		var last MultiplePageScan
		if err := db.Select("\"createdAt\"").Where("id = ? AND \"userID\" = ?", cursor, userID).First(&last).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrCursorNotFound
			}
			return nil, err
		}
		query = query.Where("\"createdAt\" < ?", last.CreatedAt)
	}
	if err := query.Order("\"createdAt\" DESC").Limit(int(limit)).Find(&scans).Error; err != nil {
		return nil, err
	}
	return scans, nil
}

// MarkRunning moves a queued scan to RUNNING; it reports false when the scan is no longer queued
func (m *MultiplePageScan) MarkRunning(id string, startedAt time.Time) (bool, error) {
	result := db.Model(&MultiplePageScan{}).
		Where("id = ? AND status = ?", id, "QUEUED").
		Updates(map[string]interface{}{"status": "RUNNING", "startedAt": startedAt})
	return result.RowsAffected == 1, result.Error
}

func (m *MultiplePageScan) UpdateProgress(id string, updates map[string]interface{}) error {
	return db.Model(&MultiplePageScan{}).Where("id = ? AND status = ?", id, "RUNNING").Updates(updates).Error
}

func (m *MultiplePageScan) Complete(id string, updates map[string]interface{}) error {
	updates["status"] = "COMPLETED"
	return db.Model(&MultiplePageScan{}).Where("id = ? AND status = ?", id, "RUNNING").Updates(updates).Error
}

func (m *MultiplePageScan) Fail(id, code, message string, updates map[string]interface{}) error {
	completedAt := time.Now()
	if updates == nil {
		updates = map[string]interface{}{}
	}
	updates["status"] = "FAILED"
	updates["errorCode"] = code
	updates["errorMessage"] = message
	updates["completedAt"] = completedAt
	return db.Model(&MultiplePageScan{}).
		Where("id = ? AND status IN ?", id, []string{"QUEUED", "RUNNING"}).
		Updates(updates).Error
}

// FailInterrupted marks every queued or running scan as failed; the process that ran them is gone
func (m *MultiplePageScan) FailInterrupted() (int64, error) {
	result := db.Model(&MultiplePageScan{}).
		Where("status IN ?", []string{"QUEUED", "RUNNING"}).
		Updates(map[string]interface{}{
			"status":       "FAILED",
			"errorCode":    "INTERRUPTED",
			"errorMessage": "The server restarted while this scan was running. Run it again.",
			"completedAt":  time.Now(),
		})
	return result.RowsAffected, result.Error
}

// DeleteQueued drops a scan that never got a place in the queue
func (m *MultiplePageScan) DeleteQueued(id string) error {
	return db.Where("id = ? AND status = ?", id, "QUEUED").Delete(&MultiplePageScan{}).Error
}

// Delete removes the caller's finished multiple-page scan with its page scans (their results and findings
// cascade) and their screenshot rows, and returns the screenshots so the caller can delete the stored objects
func (m *MultiplePageScan) Delete(id, userID string) (MultiplePageScan, []Attachment, error) {
	var parent MultiplePageScan
	var screenshots []Attachment
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&parent, "id = ? AND \"userID\" = ?", id, userID).Error; err != nil {
			return err
		}
		if parent.Status == "QUEUED" || parent.Status == "RUNNING" {
			return nil
		}
		var pages []Scan
		if err := tx.Preload("Screenshot").Where("\"multiplePageScanID\" = ?", id).Find(&pages).Error; err != nil {
			return err
		}
		if err := tx.Delete(&MultiplePageScan{}, "id = ?", id).Error; err != nil {
			return err
		}
		for _, page := range pages {
			if page.Screenshot == nil {
				continue
			}
			if err := tx.Delete(&Attachment{}, "id = ?", page.Screenshot.ID).Error; err != nil {
				return err
			}
			screenshots = append(screenshots, *page.Screenshot)
		}
		return nil
	})
	return parent, screenshots, err
}
