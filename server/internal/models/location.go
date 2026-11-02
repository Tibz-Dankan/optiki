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

func (l *Location) Create(location Location) (Location, error) {
	result := db.Create(&location)

	if result.Error != nil {
		return location, result.Error
	}
	return location, nil
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

// func (l *Location) GetOrCreateByIP(ip string) (Location, error) {
// 	var location Location

// 	savedLocation, err := location.FindByIP(ip)
// 	if err != nil {
// 		return location, err
// 	}
// 	if savedLocation.ID != "" {
// 		return savedLocation, nil
// 	}

// 	resp, err := http.Get(fmt.Sprintf("http://ip-api.com/json/%s", ip))
// 	if err != nil {
// 		return location, fmt.Errorf("geolocation lookup failed: %w", err)
// 	}
// 	defer resp.Body.Close()

// 	body, err := io.ReadAll(resp.Body)
// 	if err != nil {
// 		return location, fmt.Errorf("reading geolocation response: %w", err)
// 	}

// 	if !json.Valid(body) {
// 		return location, fmt.Errorf("geolocation response is not valid JSON")
// 	}

// 	location.IP = ip
// 	// location.Info = datatypes.JSON(body)
// 	location.Info = json.RawMessage(body)

// 	newLocation, err := location.Create(location)
// 	if err != nil {
// 		return location, err
// 	}

// 	return newLocation, nil
// }
