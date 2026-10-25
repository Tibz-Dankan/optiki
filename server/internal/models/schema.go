package models

import (
	"encoding/json"
	"time"
)

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
	APITokens  []*APIToken `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Scans      []*Scan     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
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

type Permission struct {
	ID          string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"column:name;size:64;not null;uniqueIndex" json:"name"` // resource:action:scope
	Resource    string    `gorm:"column:resource;size:32;not null" json:"resource"`     // scan
	Action      string    `gorm:"column:action;size:16;not null" json:"action"`         // create, view, edit, delete
	Scope       string    `gorm:"column:scope;size:8;not null" json:"scope"`            // own
	Description string    `gorm:"column:description;size:255;not null" json:"description"`
	CreatedAt   time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`
}

type APIToken struct {
	ID         string     `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID     string     `gorm:"column:userID;type:uuid;not null;index" json:"userID"`
	Name       string     `gorm:"column:name;size:64;not null" json:"name"`
	Prefix     string     `gorm:"column:prefix;size:12;not null;uniqueIndex" json:"prefix"`
	TokenHash  string     `gorm:"column:tokenHash;size:64;not null" json:"-"`
	ExpiresAt  *time.Time `gorm:"column:expiresAt;default:null;index" json:"expiresAt"`
	IsRevoked  bool       `gorm:"column:isRevoked;not null;default:false;index" json:"isRevoked"`
	RevokedAt  *time.Time `gorm:"column:revokedAt;default:null" json:"revokedAt"`
	LastUsedAt *time.Time `gorm:"column:lastUsedAt;default:null" json:"lastUsedAt"`
	LastUsedIP *string    `gorm:"column:lastUsedIP;size:45;default:null" json:"lastUsedIP"`
	CreatedAt  time.Time  `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt  time.Time  `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User        *User                 `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Permissions []*APITokenPermission `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

type APITokenPermission struct {
	ID           string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	APITokenID   string    `gorm:"column:apiTokenID;type:uuid;not null;uniqueIndex:idx_api_token_permissions_token_permission,priority:1" json:"apiTokenID"`
	PermissionID string    `gorm:"column:permissionID;type:uuid;not null;uniqueIndex:idx_api_token_permissions_token_permission,priority:2;index" json:"permissionID"`
	CreatedAt    time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	APIToken   *APIToken   `gorm:"foreignKey:APITokenID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Permission *Permission `gorm:"foreignKey:PermissionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

type Attachment struct {
	ID          string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID      *string   `gorm:"column:userID;type:uuid;default:null;index" json:"userID"`
	Type        string    `gorm:"column:type;not null;index" json:"type"` // SCAN_SCREENSHOT
	Key         string    `gorm:"column:key;size:255;not null;uniqueIndex" json:"-"`
	ContentType string    `gorm:"column:contentType;size:64;not null" json:"contentType"`
	Size        int64     `gorm:"column:size;not null" json:"size"`
	Width       *int      `gorm:"column:width;default:null" json:"width"`
	Height      *int      `gorm:"column:height;default:null" json:"height"`
	CreatedAt   time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

type Scan struct {
	ID                     string  `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID                 *string `gorm:"column:userID;type:uuid;default:null;index:idx_scans_user_created,priority:1" json:"userID"`
	APITokenID             *string `gorm:"column:apiTokenID;type:uuid;default:null;index" json:"apiTokenID"`
	ScreenshotAttachmentID *string `gorm:"column:screenshotAttachmentID;type:uuid;default:null;index" json:"screenshotAttachmentID"`
	TriggeredBy            string  `gorm:"column:triggeredBy;not null;index" json:"triggeredBy"`           // ANONYMOUS, USER, API_TOKEN
	Visibility             string  `gorm:"column:visibility;not null;default:'PRIVATE'" json:"visibility"` // PRIVATE, PUBLIC
	Title                  *string `gorm:"column:title;size:120;default:null" json:"title"`

	InputType     string  `gorm:"column:inputType;not null" json:"inputType"` // HTML, URL, GYM
	TargetURL     *string `gorm:"column:targetURL;default:null" json:"targetURL"`
	FinalURL      *string `gorm:"column:finalURL;default:null" json:"finalURL"`
	GymPageID     *string `gorm:"column:gymPageID;size:64;default:null" json:"gymPageID"`
	Route         string  `gorm:"column:route;size:512;not null;default:'/'" json:"route"`
	InputSha256   *string `gorm:"column:inputSha256;size:64;default:null" json:"inputSha256"`
	InputBytes    *int    `gorm:"column:inputBytes;default:null" json:"inputBytes"`
	RedirectCount int     `gorm:"column:redirectCount;not null;default:0" json:"redirectCount"`
	HTTPStatus    *int    `gorm:"column:httpStatus;default:null" json:"httpStatus"`
	ContentType   *string `gorm:"column:contentType;size:128;default:null" json:"contentType"`
	PageTitle     *string `gorm:"column:pageTitle;size:512;default:null" json:"pageTitle"`
	PageLang      *string `gorm:"column:pageLang;size:35;default:null" json:"pageLang"`

	Mode           string  `gorm:"column:mode;not null" json:"mode"`       // STATIC, RENDERED
	RuleSet        string  `gorm:"column:ruleSet;not null" json:"ruleSet"` // CORE, FULL
	EngineVersion  string  `gorm:"column:engineVersion;size:32;not null" json:"engineVersion"`
	RulesetHash    string  `gorm:"column:rulesetHash;size:64;not null" json:"rulesetHash"`
	ReportHash     *string `gorm:"column:reportHash;size:64;default:null;index" json:"reportHash"`
	ViewportWidth  *int    `gorm:"column:viewportWidth;default:null" json:"viewportWidth"`
	ViewportHeight *int    `gorm:"column:viewportHeight;default:null" json:"viewportHeight"`
	NodeCount      *int    `gorm:"column:nodeCount;default:null" json:"nodeCount"`
	ControlCount   *int    `gorm:"column:controlCount;default:null" json:"controlCount"`

	Status       string     `gorm:"column:status;not null;index" json:"status"` // RUNNING, COMPLETED, FAILED
	ErrorCode    *string    `gorm:"column:errorCode;size:64;default:null" json:"errorCode"`
	ErrorMessage *string    `gorm:"column:errorMessage;size:512;default:null" json:"errorMessage"`
	StartedAt    time.Time  `gorm:"column:startedAt;not null" json:"startedAt"`
	CompletedAt  *time.Time `gorm:"column:completedAt;default:null" json:"completedAt"`
	DurationMs   *int       `gorm:"column:durationMs;default:null" json:"durationMs"`
	FetchMs      *int       `gorm:"column:fetchMs;default:null" json:"fetchMs"`
	RenderMs     *int       `gorm:"column:renderMs;default:null" json:"renderMs"`
	AnalyzeMs    *int       `gorm:"column:analyzeMs;default:null" json:"analyzeMs"`

	OverallScore      *int `gorm:"column:overallScore;type:smallint;default:null" json:"overallScore"`
	OperableScore     *int `gorm:"column:operableScore;type:smallint;default:null" json:"operableScore"`
	PerceivableScore  *int `gorm:"column:perceivableScore;type:smallint;default:null" json:"perceivableScore"`
	StableScore       *int `gorm:"column:stableScore;type:smallint;default:null" json:"stableScore"`
	DiscoverableScore *int `gorm:"column:discoverableScore;type:smallint;default:null" json:"discoverableScore"`

	FindingsCount      int  `gorm:"column:findingsCount;not null;default:0" json:"findingsCount"`
	CriticalCount      int  `gorm:"column:criticalCount;not null;default:0" json:"criticalCount"`
	SeriousCount       int  `gorm:"column:seriousCount;not null;default:0" json:"seriousCount"`
	ModerateCount      int  `gorm:"column:moderateCount;not null;default:0" json:"moderateCount"`
	MinorCount         int  `gorm:"column:minorCount;not null;default:0" json:"minorCount"`
	RulesPassed        int  `gorm:"column:rulesPassed;not null;default:0" json:"rulesPassed"`
	RulesFailed        int  `gorm:"column:rulesFailed;not null;default:0" json:"rulesFailed"`
	RulesNotApplicable int  `gorm:"column:rulesNotApplicable;not null;default:0" json:"rulesNotApplicable"`
	RulesNeedRendered  int  `gorm:"column:rulesNeedRendered;not null;default:0" json:"rulesNeedRendered"`
	FindingsTruncated  bool `gorm:"column:findingsTruncated;not null;default:false" json:"findingsTruncated"`

	Repository *string `gorm:"column:repository;size:140;default:null;index:idx_scans_repository_commit,priority:1" json:"repository"`
	Branch     *string `gorm:"column:branch;size:255;default:null" json:"branch"`
	CommitSHA  *string `gorm:"column:commitSHA;size:64;default:null;index:idx_scans_repository_commit,priority:2" json:"commitSHA"`
	PRNumber   *int    `gorm:"column:prNumber;default:null" json:"prNumber"`
	RunURL     *string `gorm:"column:runURL;default:null" json:"runURL"`

	CreatedAt time.Time `gorm:"column:createdAt;index;index:idx_scans_user_created,priority:2" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User        *User             `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	APIToken    *APIToken         `gorm:"foreignKey:APITokenID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
	Screenshot  *Attachment       `gorm:"foreignKey:ScreenshotAttachmentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
	RuleResults []*ScanRuleResult `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Findings    []*ScanFinding    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

type ScanRuleResult struct {
	ID            string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	ScanID        string    `gorm:"column:scanID;type:uuid;not null;uniqueIndex:idx_scan_rule_results_scan_rule,priority:1" json:"scanID"`
	RuleID        string    `gorm:"column:ruleID;size:16;not null;index;uniqueIndex:idx_scan_rule_results_scan_rule,priority:2" json:"ruleID"`
	Position      int       `gorm:"column:position;not null" json:"position"`
	Category      string    `gorm:"column:category;not null" json:"category"` // OPERABLE, PERCEIVABLE, STABLE, DISCOVERABLE
	Priority      string    `gorm:"column:priority;not null" json:"priority"` // P0, P1, P2
	Severity      string    `gorm:"column:severity;not null" json:"severity"` // CRITICAL, SERIOUS, MODERATE, MINOR
	Weight        int       `gorm:"column:weight;not null" json:"weight"`
	Result        string    `gorm:"column:result;not null;index" json:"result"` // PASS, FAIL, NOT_APPLICABLE, NEEDS_RENDERED
	FindingsCount int       `gorm:"column:findingsCount;not null;default:0" json:"findingsCount"`
	CreatedAt     time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	Scan *Scan `gorm:"foreignKey:ScanID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

type ScanFinding struct {
	ID             string          `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	ScanID         string          `gorm:"column:scanID;type:uuid;not null;uniqueIndex:idx_scan_findings_scan_fingerprint,priority:1;index:idx_scan_findings_scan_position,priority:1" json:"scanID"`
	RuleID         string          `gorm:"column:ruleID;size:16;not null;index" json:"ruleID"`
	Category       string          `gorm:"column:category;not null" json:"category"`       // OPERABLE, PERCEIVABLE, STABLE, DISCOVERABLE
	Severity       string          `gorm:"column:severity;not null;index" json:"severity"` // CRITICAL, SERIOUS, MODERATE, MINOR
	Fingerprint    string          `gorm:"column:fingerprint;size:64;not null;index;uniqueIndex:idx_scan_findings_scan_fingerprint,priority:2" json:"fingerprint"`
	Position       int             `gorm:"column:position;not null;index:idx_scan_findings_scan_position,priority:2" json:"position"`
	DocumentOrder  int             `gorm:"column:documentOrder;not null" json:"documentOrder"`
	SelectorPath   string          `gorm:"column:selectorPath;size:1024;not null" json:"selectorPath"`
	Tag            string          `gorm:"column:tag;size:32;not null" json:"tag"`
	Role           *string         `gorm:"column:role;size:64;default:null" json:"role"`
	AccessibleName *string         `gorm:"column:accessibleName;size:512;default:null" json:"accessibleName"`
	NameFrom       *string         `gorm:"column:nameFrom;size:32;default:null" json:"nameFrom"` // ARIA_LABELLEDBY, ARIA_LABEL, NATIVE, CONTENT, TITLE, PLACEHOLDER
	Snippet        string          `gorm:"column:snippet;size:600;not null" json:"snippet"`
	Message        string          `gorm:"column:message;size:512;not null" json:"message"`
	Evidence       json.RawMessage `gorm:"column:evidence;type:jsonb;default:null" json:"evidence"`
	CreatedAt      time.Time       `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt      time.Time       `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	Scan *Scan `gorm:"foreignKey:ScanID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

type Device struct {
	ID        string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID    *string   `gorm:"column:userID;type:uuid;default:null;index" json:"userID"`
	Name      string    `gorm:"column:name;size:64;not null;index" json:"name"`
	CreatedAt time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

type Location struct {
	ID        string          `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	IP        string          `gorm:"column:ip;size:45;not null;uniqueIndex" json:"ip"`
	Info      json.RawMessage `gorm:"column:info;type:jsonb;default:null" json:"info"`
	CreatedAt time.Time       `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt time.Time       `gorm:"column:updatedAt;index" json:"updatedAt"`
}

type SiteVisit struct {
	ID          string     `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID      *string    `gorm:"column:userID;type:uuid;default:null;index" json:"userID"`
	AnonymousID string     `gorm:"column:anonymousID;type:uuid;not null;index" json:"anonymousID"`
	DeviceID    *string    `gorm:"column:deviceID;type:uuid;default:null;index" json:"deviceID"`
	LocationID  *string    `gorm:"column:locationID;type:uuid;default:null;index" json:"locationID"`
	Page        string     `gorm:"column:page;size:64;not null;index" json:"page"`
	Path        string     `gorm:"column:path;size:512;not null;index" json:"path"`
	CapturedAt  time.Time  `gorm:"column:capturedAt;not null;index" json:"capturedAt"`
	LinkedAt    *time.Time `gorm:"column:linkedAt;default:null" json:"linkedAt"`
	CreatedAt   time.Time  `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User     *User     `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
	Device   *Device   `gorm:"foreignKey:DeviceID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
	Location *Location `gorm:"foreignKey:LocationID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
}

type AnonymousUserLink struct {
	ID          string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	AnonymousID string    `gorm:"column:anonymousID;type:uuid;not null;uniqueIndex" json:"anonymousID"`
	UserID      string    `gorm:"column:userID;type:uuid;not null;index" json:"userID"`
	LinkedAt    time.Time `gorm:"column:linkedAt;not null;index" json:"linkedAt"`
	CreatedAt   time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}
