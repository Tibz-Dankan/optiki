package models

import (
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"gorm.io/gorm"
)

func scopeEnv(tx *gorm.DB) *gorm.DB {
	return tx.Where("\"env\" = ?", pkg.GetDeployEnv())
}

func stampEnv(tx *gorm.DB) {
	tx.Statement.SetColumn("Env", pkg.GetDeployEnv())
}
