package models

import (
	"errors"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func (u *User) BeforeCreate(tx *gorm.DB) error {
	hashedPassword, err := u.HashPassword(u.Password)
	if err != nil {
		return err
	}

	tx.Statement.SetColumn("Password", hashedPassword)
	tx.Statement.SetColumn("ProfileBgColor", pkg.GetRandomColor())
	tx.Statement.SetColumn("ID", uuid.New().String())
	return nil
}

func (u *User) Create(user User) (User, error) {
	user.Email = pkg.NormalizeEmail(user.Email)
	if err := db.Create(&user).Error; err != nil {
		return user, err
	}

	return user, nil
}

func (u *User) FindOne(id string) (User, error) {
	var user User
	if err := db.First(&user, "id = ?", id).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return user, err
	}

	return user, nil
}

func (u *User) FindByEmail(email string) (User, error) {
	var user User
	if err := db.First(&user, "email = ?", pkg.NormalizeEmail(email)).
		Error; err != nil && err != gorm.ErrRecordNotFound {
		return user, err
	}

	return user, nil
}

func (u *User) Update() (User, error) {
	if err := db.Model(&User{}).Where("id = ?", u.ID).
		Updates(map[string]interface{}{
			"name":  u.Name,
			"email": pkg.NormalizeEmail(u.Email),
		}).Error; err != nil {
		return *u, err
	}

	return u.FindOne(u.ID)
}

func (u *User) MarkEmailVerified() (User, error) {
	if u.ID == "" {
		return *u, errors.New("user ID is required")
	}

	verifiedAt := time.Now()
	result := db.Model(&User{}).Where("id = ?", u.ID).
		Updates(map[string]interface{}{
			"emailVerified":   true,
			"emailVerifiedAt": verifiedAt,
		})
	if result.Error != nil {
		return *u, result.Error
	}
	if result.RowsAffected == 0 {
		return *u, gorm.ErrRecordNotFound
	}

	u.EmailVerified = true
	u.EmailVerifiedAt = &verifiedAt
	return *u, nil
}

func (u *User) SetPassword(password string) error {
	hashedPassword, err := u.HashPassword(password)
	if err != nil {
		return err
	}

	return db.Model(&User{}).Where("id = ?", u.ID).
		Update("password", hashedPassword).Error
}

func (u *User) PasswordMatches(plainTextPassword string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(plainTextPassword))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return false, nil
		}
		return false, err
	}

	return true, nil
}

func (u *User) HashPassword(plainTextPassword string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainTextPassword), 12)
	if err != nil {
		return "", err
	}

	return string(hashedPassword), nil
}
