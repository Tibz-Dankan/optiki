# Data model

Every GORM struct lives in `internal/models/schema.go`, and every table is listed in the `AutoMigrate` call in `internal/models/db.go`.

- **Built:** the account tables, plus permissions, API tokens, attachments, scans, rule results and findings, and the site-visit tables (devices, locations, site visits, anonymous user links).
- **Not built yet:** `projects`, and with it `scans.projectID` and the `project:*` permissions. That part of this file is the target design; it lands additively.

Conventions that apply to every table:

- `id` is `type:uuid;primaryKey`, set in `BeforeCreate` with `tx.Statement.SetColumn("ID", uuid.New().String())`.
- Every column has an explicit camelCase `column:` tag, so raw SQL must quote it: `"userID"`, `"createdAt"`.
- `createdAt` and `updatedAt` are indexed.
- Enum-ish strings are `SCREAMING_SNAKE`, listed in a trailing `//` comment. The values below are the complete set.
- Optional columns are pointers with `default:null`; the JSON shows `null`, never `""`.
- There is **no `env` column** anywhere. Local development and production use separate databases (`OPTIKI_DEV_DSN_LOCAL`, `OPTIKI_PROD_DSN`).

## Relationships at a glance

```
users ─┬─< sessions        (CASCADE)
       ├─< otps            (CASCADE)
       ├── appearances     (CASCADE, one per user — checked in createAppearance.go)
       ├─< api_tokens      (CASCADE) ─< api_token_permissions >─ permissions (seeded)
       ├─< attachments     (CASCADE)
       ├─< scans           (CASCADE)
       ├─< devices         (CASCADE; userID NULL rows are shared by anonymous visitors)
       ├─< site_visits     (SET NULL)
       ├─< anonymous_user_links (CASCADE)
       └─< projects        (CASCADE)                         — not built yet
devices     ─< site_visits (SET NULL)
locations   ─< site_visits (SET NULL; one row per public IP, no owner)
api_tokens  ─< scans       (SET NULL: deleting a token keeps its scans)
attachments ─< scans       (scans.screenshotAttachmentID, SET NULL; the scan delete removes it explicitly)
projects    ─< scans       (SET NULL)                        — not built yet
scans ─┬─< scan_rule_results (CASCADE)
       └─< scan_findings     (CASCADE)
```

Anonymous scans have `userID NULL` and belong to nobody until `anony-reconcile` claims them by their `anonymousID`.

## Existing tables (unchanged)

```go
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
	Projects   []*Project  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Scans      []*Scan     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}
```

The last three relationships are added in the PR that adds each table.

- `Session`: `userID`, `accessToken`, `refreshToken`, `generatedVia` (`SIGN_UP`, `SIGN_IN`, `RESET_PASSWORD`), `userAgent`, `ip`, `isRevoked`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`.
  - Tokens are stored **raw** (a deliberate simplification) and looked up with `"accessToken" = ?` / `"refreshToken" = ?`.
  - They are `json:"-"`, and sessions only leave the server through `sessionResponseData`.
- `OTP`: `userID`, `OTP` (SHA-256 of the code), `type` (`RESET_PASSWORD`, `VERIFY_EMAIL`), `isUsed`, `isVerified`, `attempts`, `expiresAt`.
- `Appearance`: `userID`, `theme` (`light`, `dark`, `system`).

## Site visits

The capture flow and the reconcile rules are in `references/site-visits.md`.

```go
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
```

- `devices`: one row per `(userID, name)`, plus one shared row per name with `userID NULL` for anonymous visits. `Device.FindOrCreate` uses quoted `Where` strings, because a struct condition ignores a nil `UserID` and would match a user's row.
- `locations`: one row per public IP; `ip` is unique, and a concurrent first insert uses `ON CONFLICT DO NOTHING` before re-reading. `info` is ip-api.com's JSON, stored only on `"status":"success"`. A non-public IP or a failed lookup gets no row, and the visit's `locationID` stays null.
- `site_visits`: `page` is resolved on the server from `path` (`pkg.ResolvePageName`). `deviceID` and `locationID` are nullable, so a failed lookup never loses the visit. `linkedAt` is set when reconciliation gives an anonymous visit its owner.
- `anonymous_user_links`: one row per anonymous ID (unique), written by `AnonymousUserLink.Link` in the same transaction that sets `userID` and `linkedAt` on that ID's ownerless visits.

## API tokens and permissions

```go
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

type Permission struct {
	ID          string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"column:name;size:64;not null;uniqueIndex" json:"name"` // resource:action:scope
	Resource    string    `gorm:"column:resource;size:32;not null" json:"resource"`     // scan, project
	Action      string    `gorm:"column:action;size:16;not null" json:"action"`         // create, view, edit, delete
	Scope       string    `gorm:"column:scope;size:8;not null" json:"scope"`            // own
	Description string    `gorm:"column:description;size:255;not null" json:"description"`
	CreatedAt   time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`
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
```

- `prefix` is the `<prefix>` of `opt_<prefix>_<token>`, the lookup key. `tokenHash` is `sha256(<token>)` as hex. The full token is never stored.
- A token's status is derived, never stored:
  - `REVOKED` if `isRevoked`
  - else `EXPIRED` if `expiresAt` is in the past
  - else `ACTIVE`
- `permissions` is a **reference table** seeded from `internal/data/permissions.go`: no `userID`, nothing user-written. Both foreign keys in the join are typed `uuid`. gradescript's string-typed IDs forced `::text` casts in every join.
- `api-tokens.md` has the token rules; this file only has their storage.

## Attachments

```go
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
```

- `key` is the S3 object key (`scan-screenshots/<scanID>.jpg`). No URL is ever stored; reads sign a 30-minute link.
- `attachments.md` has the full rules.

## Projects (not built yet)

```go
type Project struct {
	ID          string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID      string    `gorm:"column:userID;type:uuid;not null;index;uniqueIndex:idx_projects_user_name,priority:1" json:"userID"`
	Name        string    `gorm:"column:name;size:64;not null;uniqueIndex:idx_projects_user_name,priority:2" json:"name"`
	Description *string   `gorm:"column:description;size:280;default:null" json:"description"`
	BaseURL     *string   `gorm:"column:baseURL;default:null" json:"baseURL"`
	Repository  *string   `gorm:"column:repository;size:140;default:null;index" json:"repository"`
	CreatedVia  string    `gorm:"column:createdVia;not null" json:"createdVia"` // WEB, API_TOKEN
	APITokenID  *string   `gorm:"column:apiTokenID;type:uuid;default:null;index" json:"apiTokenID"`
	CreatedAt   time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User     *User     `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	APIToken *APIToken `gorm:"foreignKey:APITokenID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
	Scans    []*Scan   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"-"`
}
```

- Project names are unique per owner, case-sensitive: the handler trims, the index enforces.
- `repository` is `owner/name`. It is what the future GitHub Action will match on.
- `baseURL` is the site's public URL, used to prefill the playground. It is never fetched on save.

## Scans

One row per scan: one page, one input, one rule set.

```go
type Scan struct {
	ID          string  `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID                 *string `gorm:"column:userID;type:uuid;default:null;index:idx_scans_user_created,priority:1" json:"userID"`
	APITokenID             *string `gorm:"column:apiTokenID;type:uuid;default:null;index" json:"apiTokenID"`
	AnonymousID            *string `gorm:"column:anonymousID;type:uuid;default:null;index" json:"-"`
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
```

What each group of columns records:

| Group | Columns | Notes |
|---|---|---|
| Ownership | `userID`, `apiTokenID`, `anonymousID`, `screenshotAttachmentID`, `triggeredBy`, `visibility`, `title` (and `projectID` once projects land) | Anonymous scans are `userID NULL`, `triggeredBy ANONYMOUS`, `visibility PUBLIC`, with the browser's `anonymousID` (nullable; added October 2026, additive). A claim sets `userID` and `PRIVATE`. Everything else starts `PRIVATE` |
| Input | `inputType` … `pageLang` | `targetURL` is what was asked for, `finalURL` where redirects ended. `inputSha256`/`inputBytes` describe the HTML actually analysed (pasted, fetched or rendered). The HTML itself is never stored |
| Engine | `mode` … `controlCount` | `ruleSet` and `rulesetHash` say exactly which rules ran. `reportHash` is the engine's hash of the canonical report JSON |
| Lifecycle | `status` … `analyzeMs` | Scans run synchronously, so a row moves `RUNNING` → `COMPLETED` or `FAILED` inside one request. A `RUNNING` row older than a minute was interrupted (a container restart) |
| Scores | `overallScore` … `discoverableScore` | Integers 0–100, rounded by the engine. `NULL` until completed, and `NULL` for a category with no applicable rules (a static scan's Stable) |
| Counts | `findingsCount` … `findingsTruncated` | Severity counts use the *effective* severity. `findingsCount` is the true total even when more than 500 findings meant only the first 500 rows were stored |
| CI context | `repository` … `runURL` | Set only through the token API. Lets the future GitHub Action find a base commit's scan with `(repository, commitSHA)` |

```go
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
```

- One row per rule **in the scan's rule set**: 9 for `CORE`, 17 for `FULL`.
- A rendered-only rule in a static scan is `NEEDS_RENDERED`, never `PASS`.
- `category`, `priority`, `severity` and `weight` are copied from the catalog at scan time, so an old scan still explains its own score after the catalog changes.
- The rule's name, rationale and fix text come from the live catalog (`GET /api/v1/rules/:id`).

```go
type ScanFinding struct {
	ID             string          `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	ScanID         string          `gorm:"column:scanID;type:uuid;not null;uniqueIndex:idx_scan_findings_scan_fingerprint,priority:1;index:idx_scan_findings_scan_position,priority:1" json:"scanID"`
	RuleID         string          `gorm:"column:ruleID;size:16;not null;index" json:"ruleID"`
	Category       string          `gorm:"column:category;not null" json:"category"` // OPERABLE, PERCEIVABLE, STABLE, DISCOVERABLE
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
```

- `severity` is the effective severity, e.g. OPT-103 drops to `MODERATE` in repeated rows. The rule's base severity is on its `ScanRuleResult`.
- `position` is the report order (rule ID, then document order). Lists always `ORDER BY "position"`.
- Page-level findings (OPT-401, OPT-302) use `selectorPath = "html"` and `tag = "html"`.
- `snippet` is the start of the element's outer HTML, truncated to 600 characters. It is stored raw, so **the client renders it as escaped text only**.
- `message` is one sentence about this element, e.g. `Button "Delete" shares its name with 3 other buttons`.

`evidence` holds rule-specific detail as one small JSON object, never a page dump:

| Rule | `evidence` |
|---|---|
| OPT-101 | `{"hiddenBy":"ARIA_HIDDEN"\|"ROLE_IMG"\|"PRESENTATIONAL_CHILDREN"\|"IGNORED","hidingAncestorPath":"…"}` (controls hidden from everyone — `hidden`, `display:none` — aren't flagged) |
| OPT-103 | `{"sharedName":"Delete","peerPaths":["…"],"inRepeatedRow":true}` |
| OPT-104 | `{"trigger":"ONCLICK"\|"TABINDEX"\|"ANCHOR_WITHOUT_HREF"\|"CURSOR_POINTER"}` |
| OPT-105 | `{"outerPath":"…","outerRole":"link"}` |
| OPT-106 | `{"placeholderOnly":true}` |
| OPT-107 | `{"call":"confirm","attribute":"onclick"}`, or page-level `{"dialogs":["alert"]}` |
| OPT-201 | `{"visibleText":"Press ? for shortcuts","accessibleName":"Help"}` |
| OPT-202 | `{"graphic":"SVG"\|"CANVAS","textContent":"…"}` |
| OPT-205 | `{"attributes":["aria-describedby"],"missingIDs":["…"],"duplicateIDs":[]}` |
| OPT-401 | `{"missing":["title","h1","main"]}` |
| OPT-204 | `{"fontPx":10.5}` |
| OPT-301 | `{"firstSeenMs":1800}` |
| OPT-302 | `{"cls":0.23}` |
| any rendered finding | adds `"box":{"x":0,"y":0,"width":0,"height":0}` |

## AutoMigrate order and seeding

```go
err = gormDB.AutoMigrate(
	&User{}, &Session{}, &OTP{}, &Appearance{},
	&Device{}, &Location{}, &SiteVisit{}, &AnonymousUserLink{},
	&Permission{}, &APIToken{}, &APITokenPermission{},
	&Attachment{},
	&Scan{}, &ScanRuleResult{}, &ScanFinding{},
)
```

`&Project{}` goes before `&Scan{}` when projects land.

Parents come before children, so each foreign key's target exists.

`Permission` is seeded on every boot by `handlers/auth/initSeed.go` (`InitializeDataSeeding`, run from the package's `init()`, after the `models` package has connected and migrated). It seeds the permissions first, then the demo accounts when `SEED_DEMO=true`. Today the list holds the four `scan:*:own` permissions. Because it runs at import time, any test that imports `handlers/auth` would need a database; tests stay out of handler packages (SKILL.md § 12).

- It is idempotent: it inserts missing names and updates changed descriptions.
- It never deletes. Retiring a permission is a manual migration.

## Migrations

AutoMigrate only **adds**: tables, columns, indexes, constraints. It never drops, renames or retypes a column, and it can't add a `NOT NULL` column without a default to a table that already has rows.

- New columns are nullable or have a default.
- A drop, rename, retype or tightening is a **manual SQL migration**. Write it, run it on the local DB, and run it on production **before** the deploy that needs it. Mention it in the PR description.
- A field removed from a struct leaves its column behind. If that column is `NOT NULL` without a default, every insert fails. This is why the October 2026 cleanup that dropped `env` and the session hash columns needs this SQL:

```sql
BEGIN;
ALTER TABLE otps        DROP COLUMN IF EXISTS env;
ALTER TABLE appearances DROP COLUMN IF EXISTS env;
ALTER TABLE sessions    DROP COLUMN IF EXISTS env, DROP COLUMN IF EXISTS "accessTokenHash", DROP COLUMN IF EXISTS "refreshTokenHash";
DROP INDEX IF EXISTS idx_users_env_email;
ALTER TABLE users       DROP COLUMN IF EXISTS env;
COMMIT;
```
