package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Device) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

// FindOrCreate keeps one row per name for each user, and one per name shared by anonymous visitors
func (d *Device) FindOrCreate(userID *string, name string) (Device, error) {
	device := Device{UserID: userID, Name: name}

	query := db.Where("name = ?", name)
	if userID == nil {
		query = query.Where("\"userID\" IS NULL")
	} else {
		query = query.Where("\"userID\" = ?", *userID)
	}

	if err := query.FirstOrCreate(&device).Error; err != nil {
		return device, err
	}
	return device, nil
}
