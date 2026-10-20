package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (ap *Appearance) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	stampEnv(tx)
	return nil
}

func (ap *Appearance) Create(appearance Appearance) (Appearance, error) {
	if err := db.Create(&appearance).Error; err != nil {
		return appearance, err
	}
	return appearance, nil
}

func (ap *Appearance) FindOne(id string) (Appearance, error) {
	var appearance Appearance
	if err := db.Scopes(scopeEnv).First(&appearance, "id = ?", id).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return appearance, err
	}

	return appearance, nil
}

func (ap *Appearance) FindByUser(userID string) (Appearance, error) {
	var appearance Appearance
	if err := db.Scopes(scopeEnv).First(&appearance, "\"userID\" = ?", userID).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return appearance, err
	}

	return appearance, nil
}

func (ap *Appearance) Update() (Appearance, error) {
	if err := db.Scopes(scopeEnv).Model(&Appearance{}).Where("id = ?", ap.ID).
		Update("theme", ap.Theme).Error; err != nil {
		return *ap, err
	}

	return ap.FindOne(ap.ID)
}
