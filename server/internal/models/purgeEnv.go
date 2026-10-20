package models

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"gorm.io/gorm"
)

// System path: runs from cmd/purge when a PR closes, so it targets an env other than the running one.
// Every env-tagged table must be listed here, children before parents.
func PurgeEnv(env string) (map[string]int64, error) {
	if env == "" || env == constants.DEPLOY_ENV_PRODUCTION {
		return nil, errors.New("refusing to purge an empty or production env")
	}

	deleted := map[string]int64{}
	tables := []struct {
		name  string
		model interface{}
	}{
		{"otps", &OTP{}},
		{"sessions", &Session{}},
		{"appearances", &Appearance{}},
		{"users", &User{}},
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		for _, table := range tables {
			result := tx.Where("\"env\" = ?", env).Delete(table.model)
			if result.Error != nil {
				return result.Error
			}
			deleted[table.name] = result.RowsAffected
		}
		return nil
	})

	return deleted, err
}
