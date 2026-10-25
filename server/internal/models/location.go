package models

import (
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (l *Location) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (l *Location) FindByIP(ip string) (Location, error) {
	var location Location
	if err := db.First(&location, "ip = ?", ip).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return location, err
	}
	return location, nil
}

// GetOrCreateByIP returns an empty Location for an address that isn't public or can't be looked up
func (l *Location) GetOrCreateByIP(ip string) (Location, error) {
	savedLocation, err := l.FindByIP(ip)
	if err != nil || savedLocation.ID != "" {
		return savedLocation, err
	}

	info, err := pkg.LookupIPGeolocation(ip)
	if err != nil || info == nil {
		return Location{}, err
	}

	location := Location{IP: ip, Info: info}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&location).Error; err != nil {
		return Location{}, err
	}

	return l.FindByIP(ip)
}
