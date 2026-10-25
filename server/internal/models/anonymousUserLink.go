package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (aul *AnonymousUserLink) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (aul *AnonymousUserLink) FindOneByAnonymousID(anonymousID string) (AnonymousUserLink, error) {
	var link AnonymousUserLink
	if err := db.First(&link, "\"anonymousID\" = ?", anonymousID).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return link, err
	}
	return link, nil
}

// Link claims the anonymous ID for userID and gives it that ID's ownerless visits. It returns the
// stored link, which belongs to someone else when another request linked the ID first.
func (aul *AnonymousUserLink) Link(anonymousID string, userID string) (AnonymousUserLink, int64, error) {
	var linkedVisits int64
	linkedAt := time.Now()

	err := db.Transaction(func(tx *gorm.DB) error {
		link := AnonymousUserLink{AnonymousID: anonymousID, UserID: userID, LinkedAt: linkedAt}
		result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&link)
		if result.Error != nil || result.RowsAffected == 0 {
			return result.Error
		}

		result = tx.Model(&SiteVisit{}).
			Where("\"anonymousID\" = ? AND \"userID\" IS NULL", anonymousID).
			Updates(map[string]interface{}{"userID": userID, "linkedAt": linkedAt})
		linkedVisits = result.RowsAffected
		return result.Error
	})
	if err != nil {
		return AnonymousUserLink{}, 0, err
	}

	link, err := aul.FindOneByAnonymousID(anonymousID)
	return link, linkedVisits, err
}
