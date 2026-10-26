package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (s *Scan) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (r *ScanRuleResult) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (f *ScanFinding) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

type ScanFilters struct {
	Status      string
	InputType   string
	TriggeredBy string
	CommitSHA   string
	PRNumber    *int
}

// ScanCompletion is everything a finished scan writes, stored in one transaction
type ScanCompletion struct {
	Updates     map[string]interface{}
	RuleResults []ScanRuleResult
	Findings    []ScanFinding
	Screenshot  *Attachment
}

func (s *Scan) Create(scan Scan) (Scan, error) {
	if err := db.Create(&scan).Error; err != nil {
		return scan, err
	}
	return scan, nil
}

// FindOne loads a scan with its rule results and findings in report order, and its screenshot
func (s *Scan) FindOne(id string) (Scan, error) {
	var scan Scan
	err := db.
		Preload("RuleResults", func(tx *gorm.DB) *gorm.DB { return tx.Order("position") }).
		Preload("Findings", func(tx *gorm.DB) *gorm.DB { return tx.Order("position") }).
		Preload("Screenshot").
		First(&scan, "id = ?", id).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return scan, err
	}
	return scan, nil
}

func (s *Scan) FindAllByUser(userID string, filters ScanFilters, limit float64, cursor string) ([]Scan, error) {
	var scans []Scan
	query := db.Model(&Scan{}).Preload("Screenshot").Where("\"userID\" = ?", userID)
	if filters.Status != "" {
		query = query.Where("status = ?", filters.Status)
	}
	if filters.InputType != "" {
		query = query.Where("\"inputType\" = ?", filters.InputType)
	}
	if filters.TriggeredBy != "" {
		query = query.Where("\"triggeredBy\" = ?", filters.TriggeredBy)
	}
	if filters.CommitSHA != "" {
		query = query.Where("\"commitSHA\" = ?", filters.CommitSHA)
	}
	if filters.PRNumber != nil {
		query = query.Where("\"prNumber\" = ?", *filters.PRNumber)
	}
	if cursor != "" {
		var last Scan
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

// Complete writes a finished scan, its rule results, its findings and its screenshot together
func (s *Scan) Complete(id string, completion ScanCompletion) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if completion.Screenshot != nil {
			if err := tx.Create(completion.Screenshot).Error; err != nil {
				return err
			}
			completion.Updates["screenshotAttachmentID"] = completion.Screenshot.ID
		}
		if err := tx.Model(&Scan{}).Where("id = ?", id).Updates(completion.Updates).Error; err != nil {
			return err
		}
		if len(completion.RuleResults) > 0 {
			if err := tx.CreateInBatches(completion.RuleResults, 100).Error; err != nil {
				return err
			}
		}
		if len(completion.Findings) > 0 {
			if err := tx.CreateInBatches(completion.Findings, 100).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Scan) Fail(id, code, message string, startedAt time.Time) error {
	completedAt := time.Now()
	return db.Model(&Scan{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":       "FAILED",
		"errorCode":    code,
		"errorMessage": message,
		"completedAt":  completedAt,
		"durationMs":   int(completedAt.Sub(startedAt).Milliseconds()),
	}).Error
}

// DeleteRunning drops a scan that never got to start, such as one that found every renderer busy
func (s *Scan) DeleteRunning(id string) error {
	return db.Where("id = ? AND status = ?", id, "RUNNING").Delete(&Scan{}).Error
}

func (s *Scan) UpdateDetails(id string, updates map[string]interface{}) error {
	return db.Model(&Scan{}).Where("id = ?", id).Updates(updates).Error
}

// CountUnclaimedByAnonymousID counts the completed scans a signed-out browser has made that no account owns yet
func (s *Scan) CountUnclaimedByAnonymousID(anonymousID string) (int64, error) {
	var count int64
	err := db.Model(&Scan{}).
		Where("\"anonymousID\" = ? AND \"userID\" IS NULL AND status = ?", anonymousID, "COMPLETED").
		Count(&count).Error
	return count, err
}

// ClaimAnonymous gives a signed-out browser's unowned scans to the user and makes them private
func (s *Scan) ClaimAnonymous(anonymousID, userID string) (int64, error) {
	result := db.Model(&Scan{}).
		Where("\"anonymousID\" = ? AND \"userID\" IS NULL", anonymousID).
		Updates(map[string]interface{}{"userID": userID, "visibility": "PRIVATE"})
	return result.RowsAffected, result.Error
}

// Delete removes the caller's scan (results and findings cascade) and its screenshot row, and returns the
// screenshot so the caller can delete the stored object
func (s *Scan) Delete(id, userID string) (*Attachment, error) {
	var screenshot *Attachment
	err := db.Transaction(func(tx *gorm.DB) error {
		var scan Scan
		if err := tx.Preload("Screenshot").First(&scan, "id = ? AND \"userID\" = ?", id, userID).Error; err != nil {
			return err
		}
		if err := tx.Delete(&Scan{}, "id = ?", id).Error; err != nil {
			return err
		}
		if scan.Screenshot != nil {
			if err := tx.Delete(&Attachment{}, "id = ?", scan.Screenshot.ID).Error; err != nil {
				return err
			}
			screenshot = scan.Screenshot
		}
		return nil
	})
	return screenshot, err
}
