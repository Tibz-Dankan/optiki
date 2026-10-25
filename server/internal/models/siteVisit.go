package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (sv *SiteVisit) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (sv *SiteVisit) Create(visit SiteVisit) (SiteVisit, error) {
	if err := db.Create(&visit).Error; err != nil {
		return visit, err
	}
	return visit, nil
}
