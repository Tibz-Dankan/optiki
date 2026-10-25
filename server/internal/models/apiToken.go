package models

import (
	"errors"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrCursorNotFound = errors.New("the cursor does not match any item")

func (t *APIToken) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (a *APITokenPermission) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

// Create stores a token and its grants in one transaction
func (t *APIToken) Create(token APIToken, permissionIDs []string) (APIToken, error) {
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&token).Error; err != nil {
			return err
		}
		return createGrants(tx, token.ID, permissionIDs)
	})
	return token, err
}

func createGrants(tx *gorm.DB, tokenID string, permissionIDs []string) error {
	grants := make([]APITokenPermission, 0, len(permissionIDs))
	for _, permissionID := range permissionIDs {
		grants = append(grants, APITokenPermission{APITokenID: tokenID, PermissionID: permissionID})
	}
	if len(grants) == 0 {
		return nil
	}
	return tx.Create(&grants).Error
}

func (t *APIToken) FindByPrefix(prefix string) (APIToken, error) {
	var token APIToken
	if err := db.First(&token, "prefix = ?", prefix).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return token, err
	}
	return token, nil
}

func (t *APIToken) PrefixExists(prefix string) (bool, error) {
	var count int64
	err := db.Model(&APIToken{}).Where("prefix = ?", prefix).Count(&count).Error
	return count > 0, err
}

func (t *APIToken) FindOne(id, userID string) (APIToken, error) {
	var token APIToken
	if err := db.First(&token, "id = ? AND \"userID\" = ?", id, userID).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return token, err
	}
	return token, nil
}

func (t *APIToken) FindAllByUser(userID string, limit float64, cursor string) ([]APIToken, error) {
	var tokens []APIToken
	query := db.Model(&APIToken{}).Where("\"userID\" = ?", userID).Order("\"createdAt\" DESC").Limit(int(limit))
	if cursor != "" {
		var last APIToken
		if err := db.Select("\"createdAt\"").Where("id = ? AND \"userID\" = ?", cursor, userID).First(&last).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrCursorNotFound
			}
			return nil, err
		}
		query = query.Where("\"createdAt\" < ?", last.CreatedAt)
	}
	if err := query.Find(&tokens).Error; err != nil {
		return nil, err
	}
	return tokens, nil
}

func (t *APIToken) CountActiveByUser(userID string) (int64, error) {
	var count int64
	err := db.Model(&APIToken{}).
		Where("\"userID\" = ? AND \"isRevoked\" = ? AND (\"expiresAt\" IS NULL OR \"expiresAt\" > ?)", userID, false, time.Now()).
		Count(&count).Error
	return count, err
}

// FindPermissionNames returns each token's granted permission names, sorted, in one query
func (t *APIToken) FindPermissionNames(tokenIDs []string) (map[string][]string, error) {
	names := make(map[string][]string, len(tokenIDs))
	if len(tokenIDs) == 0 {
		return names, nil
	}
	var rows []struct {
		APITokenID string
		Name       string
	}
	err := db.Table("api_token_permissions").
		Select("api_token_permissions.\"apiTokenID\" AS api_token_id, permissions.name AS name").
		Joins("JOIN permissions ON permissions.id = api_token_permissions.\"permissionID\"").
		Where("api_token_permissions.\"apiTokenID\" IN ?", tokenIDs).
		Order("permissions.name").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		names[row.APITokenID] = append(names[row.APITokenID], row.Name)
	}
	return names, nil
}

// UpdateDetails renames a token and/or replaces its grants, in one transaction
func (t *APIToken) UpdateDetails(id string, name *string, permissionIDs []string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if name != nil {
			if err := tx.Model(&APIToken{}).Where("id = ?", id).Update("name", *name).Error; err != nil {
				return err
			}
		}
		if permissionIDs == nil {
			return nil
		}
		if err := tx.Where("\"apiTokenID\" = ?", id).Delete(&APITokenPermission{}).Error; err != nil {
			return err
		}
		if err := createGrants(tx, id, permissionIDs); err != nil {
			return err
		}
		return tx.Model(&APIToken{}).Where("id = ?", id).Update("updatedAt", time.Now()).Error
	})
}

// Revoke flips a live token to revoked and reports whether this call did it
func (t *APIToken) Revoke(id, userID string) (bool, error) {
	now := time.Now()
	result := db.Model(&APIToken{}).
		Where("id = ? AND \"userID\" = ? AND \"isRevoked\" = ?", id, userID, false).
		Updates(map[string]interface{}{"isRevoked": true, "revokedAt": now})
	return result.RowsAffected == 1, result.Error
}

func (t *APIToken) Delete(id, userID string) error {
	return db.Where("id = ? AND \"userID\" = ?", id, userID).Delete(&APIToken{}).Error
}

// TouchLastUsed records a use at most once per API_TOKEN_LAST_USED_RESOLUTION, without bumping updatedAt
func (t *APIToken) TouchLastUsed(id string, lastUsedAt *time.Time, ip string) error {
	now := time.Now()
	if lastUsedAt != nil && now.Sub(*lastUsedAt) < constants.API_TOKEN_LAST_USED_RESOLUTION {
		return nil
	}
	return db.Model(&APIToken{}).Where("id = ?", id).
		UpdateColumns(map[string]interface{}{"lastUsedAt": now, "lastUsedIP": ip}).Error
}
