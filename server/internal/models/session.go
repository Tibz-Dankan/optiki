package models

import (
	"time"

	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (s *Session) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	stampEnv(tx)
	return nil
}

func (s *Session) Create(session Session) (Session, error) {
	if err := db.Create(&session).Error; err != nil {
		return session, err
	}
	return session, nil
}

func (s *Session) FindOne(id string) (Session, error) {
	var session Session
	if err := db.Scopes(scopeEnv).First(&session, "id = ?", id).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return session, err
	}

	return session, nil
}

func (s *Session) FindByAccessToken(accessToken string) (Session, error) {
	var session Session
	if err := db.Scopes(scopeEnv).First(&session, "\"accessTokenHash\" = ?", pkg.EncodeToHexString(accessToken)).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return session, err
	}

	return session, nil
}

func (s *Session) FindByRefreshToken(refreshToken string) (Session, error) {
	var session Session
	if err := db.Scopes(scopeEnv).First(&session, "\"refreshTokenHash\" = ?", pkg.EncodeToHexString(refreshToken)).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return session, err
	}

	return session, nil
}

func (s *Session) FindAllActiveByUser(userID string, limit float64, cursor string) ([]Session, error) {
	var sessions []Session

	query := db.Scopes(scopeEnv).Model(&Session{}).
		Where("\"userID\" = ?", userID).
		Where("\"isRevoked\" = ? AND \"refreshTokenExpiresAt\" > ?", false, time.Now()).
		Order("\"createdAt\" DESC").Limit(int(limit))

	if cursor != "" {
		var lastSession Session
		if err := db.Scopes(scopeEnv).Select("\"createdAt\"").Where("id = ?", cursor).
			First(&lastSession).Error; err != nil {
			return sessions, err
		}
		query = query.Where("\"createdAt\" < ?", lastSession.CreatedAt)
	}

	if err := query.Find(&sessions).Error; err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}

	return sessions, nil
}

func (s *Session) UpdateAccessToken(accessToken string, accessTokenExpiresAt time.Time) (Session, error) {
	if err := db.Scopes(scopeEnv).Model(&Session{}).Omit(clause.Associations).Where("id = ?", s.ID).
		Updates(map[string]interface{}{
			"accessTokenHash":      pkg.EncodeToHexString(accessToken),
			"accessTokenExpiresAt": accessTokenExpiresAt,
		}).Error; err != nil {
		return *s, err
	}

	return s.FindOne(s.ID)
}

func (s *Session) Revoke(id string) error {
	return db.Scopes(scopeEnv).Model(&Session{}).Where("id = ?", id).
		Update("isRevoked", true).Error
}

func (s *Session) RevokeAllByUser(userID string) error {
	return db.Scopes(scopeEnv).Model(&Session{}).
		Where("\"userID\" = ? AND \"isRevoked\" = ?", userID, false).
		Update("isRevoked", true).Error
}
