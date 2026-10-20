package models

import (
	"errors"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (o *OTP) BeforeCreate(tx *gorm.DB) error {
	tx.Statement.SetColumn("ID", uuid.New().String())
	stampEnv(tx)
	return nil
}

// Create stores the SHA-256 of a fresh code, expires the user's earlier codes of the same type, and returns the plain code
func (o *OTP) Create(otp OTP) (string, error) {
	if otp.UserID == "" {
		return "", errors.New("no userID provided in the OTP struct")
	}

	var code string
	var err error

	switch otp.Type {
	case constants.OTP_TYPE_RESET_PASSWORD:
		code, err = pkg.GenerateNumericCode(constants.RESET_PASSWORD_OTP_LENGTH)
		otp.ExpiresAt = time.Now().Add(constants.RESET_PASSWORD_OTP_EXPIRY)
	case constants.OTP_TYPE_VERIFY_EMAIL:
		code, err = pkg.GenerateRandomState()
		otp.ExpiresAt = time.Now().Add(constants.VERIFY_EMAIL_TOKEN_EXPIRY)
	default:
		return "", errors.New("unknown OTP type")
	}
	if err != nil {
		return "", err
	}

	if err := o.ExpireUserOTPs(otp.UserID, otp.Type); err != nil {
		return "", err
	}

	otp.OTP = pkg.EncodeToHexString(code)
	if err := db.Create(&otp).Error; err != nil {
		return "", err
	}

	return code, nil
}

func (o *OTP) FindByCode(code string, otpType string) (OTP, error) {
	var otp OTP
	if err := db.Scopes(scopeEnv).
		Where("\"OTP\" = ? AND \"type\" = ?", pkg.EncodeToHexString(code), otpType).
		First(&otp).Error; err != nil && err != gorm.ErrRecordNotFound {
		return otp, err
	}

	return otp, nil
}

func (o *OTP) FindByUserAndCode(userID string, code string, otpType string) (OTP, error) {
	var otp OTP
	if err := db.Scopes(scopeEnv).
		Where("\"userID\" = ? AND \"OTP\" = ? AND \"type\" = ?", userID, pkg.EncodeToHexString(code), otpType).
		First(&otp).Error; err != nil && err != gorm.ErrRecordNotFound {
		return otp, err
	}

	return otp, nil
}

func (o *OTP) FindLatestByUserAndType(userID string, otpType string) (OTP, error) {
	var otp OTP
	if err := db.Scopes(scopeEnv).
		Where("\"userID\" = ? AND \"type\" = ?", userID, otpType).
		Order("\"createdAt\" DESC").
		First(&otp).Error; err != nil && err != gorm.ErrRecordNotFound {
		return otp, err
	}

	return otp, nil
}

// RecordFailedAttempt counts a wrong code against the user's live code of otpType and burns it once the limit is reached
func (o *OTP) RecordFailedAttempt(userID string, otpType string) error {
	latest, err := o.FindLatestByUserAndType(userID, otpType)
	if err != nil || latest.ID == "" || latest.IsUsed || latest.ExpiresAt.Before(time.Now()) {
		return err
	}

	latest.Attempts++
	if latest.Attempts >= constants.RESET_PASSWORD_OTP_MAX_ATTEMPTS {
		latest.ExpiresAt = time.Now()
	}

	_, err = latest.Update()
	return err
}

func (o *OTP) Update() (OTP, error) {
	if err := db.Scopes(scopeEnv).Model(&OTP{}).Where("id = ?", o.ID).
		Updates(map[string]interface{}{
			"isUsed":     o.IsUsed,
			"isVerified": o.IsVerified,
			"attempts":   o.Attempts,
			"expiresAt":  o.ExpiresAt,
		}).Error; err != nil {
		return *o, err
	}

	return *o, nil
}

func (o *OTP) ExpireUserOTPs(userID string, otpType string) error {
	return db.Scopes(scopeEnv).Model(&OTP{}).
		Where("\"userID\" = ? AND \"type\" = ? AND \"isUsed\" = ? AND \"expiresAt\" > ?", userID, otpType, false, time.Now()).
		Update("expiresAt", time.Now()).Error
}
