package models

import (
	"errors"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/data"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

// Seed inserts missing permissions and refreshes changed descriptions; it never deletes one
func (p *Permission) Seed(seeds []data.PermissionSeed) error {
	for _, seed := range seeds {
		parts := strings.SplitN(seed.Name, ":", 3)
		if len(parts) != 3 {
			return errors.New("permission names are resource:action:scope, got " + seed.Name)
		}
		var existing Permission
		err := db.Where("name = ?", seed.Name).First(&existing).Error
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			if err := db.Create(&Permission{
				Name: seed.Name, Resource: parts[0], Action: parts[1], Scope: parts[2], Description: seed.Description,
			}).Error; err != nil {
				return err
			}
		case err != nil:
			return err
		case existing.Description != seed.Description:
			if err := db.Model(&Permission{}).Where("id = ?", existing.ID).
				Update("description", seed.Description).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func (p *Permission) FindByNames(names []string) ([]Permission, error) {
	var permissions []Permission
	if len(names) == 0 {
		return permissions, nil
	}
	if err := db.Where("name IN ?", names).Order("name").Find(&permissions).Error; err != nil {
		return nil, err
	}
	return permissions, nil
}
