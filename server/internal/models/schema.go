package models

import "time"

var db = Db()

type User struct {
	ID              string     `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	Name            string     `gorm:"column:name;not null" json:"name"`
	Email           string     `gorm:"column:email;not null;unique;index" json:"email"`
	Password        string     `gorm:"column:password;not null" json:"-"`
	Role            string     `gorm:"column:role;default:'USER';not null;index" json:"role"` // USER
	EmailVerified   bool       `gorm:"column:emailVerified;default:false" json:"emailVerified"`
	EmailVerifiedAt *time.Time `gorm:"column:emailVerifiedAt;default:null" json:"emailVerifiedAt"`
	ProfileBgColor  string     `gorm:"column:profileBgColor;default:null" json:"profileBgColor"`
	CreatedAt       time.Time  `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt       time.Time  `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	Sessions   []*Session  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"sessions,omitempty"`
	OTPs       []*OTP      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"otps,omitempty"`
	Appearance *Appearance `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"appearance,omitempty"`
}

type Session struct {
	ID                    string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID                string    `gorm:"column:userID;type:uuid;not null;index" json:"userID"`
	AccessToken           string    `gorm:"column:accessToken;not null;index" json:"-"`
	RefreshToken          string    `gorm:"column:refreshToken;not null;index" json:"-"`
	GeneratedVia          string    `gorm:"column:generatedVia;not null;index" json:"generatedVia"` // SIGN_UP, SIGN_IN, RESET_PASSWORD
	UserAgent             string    `gorm:"column:userAgent;default:null" json:"userAgent"`
	IP                    string    `gorm:"column:ip;default:null" json:"ip"`
	IsRevoked             bool      `gorm:"column:isRevoked;default:false" json:"isRevoked"`
	AccessTokenExpiresAt  time.Time `gorm:"column:accessTokenExpiresAt;not null;index" json:"accessTokenExpiresAt"`
	RefreshTokenExpiresAt time.Time `gorm:"column:refreshTokenExpiresAt;not null;index" json:"refreshTokenExpiresAt"`
	CreatedAt             time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt             time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

type OTP struct {
	ID         string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID     string    `gorm:"column:userID;type:uuid;not null;index" json:"userID"`
	OTP        string    `gorm:"column:OTP;not null;index" json:"-"`
	Type       string    `gorm:"column:type;not null;index" json:"type"` // RESET_PASSWORD, VERIFY_EMAIL
	IsUsed     bool      `gorm:"column:isUsed;default:false" json:"isUsed"`
	IsVerified bool      `gorm:"column:isVerified;default:false" json:"isVerified"`
	Attempts   int       `gorm:"column:attempts;default:0" json:"attempts"`
	ExpiresAt  time.Time `gorm:"column:expiresAt;not null;index" json:"expiresAt"`
	CreatedAt  time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

type Appearance struct {
	ID        string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID    string    `gorm:"column:userID;type:uuid;not null;index" json:"userID"`
	Theme     string    `gorm:"column:theme;default:'system';not null" json:"theme"` // light, dark, system
	CreatedAt time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}
