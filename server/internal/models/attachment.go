package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (a *Attachment) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}
