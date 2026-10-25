# API tokens

API tokens let a script or CI job act as a user without a session: scanning a URL, reading scans, managing projects. The first consumer will be optikí's own GitHub Action, which scans each PR with a token.

The design is ported from gradescript (`server/internal/pkg/apiKey.go`, `middlewares/authAPI.go`, `handlers/apikeys/*`, and the console's `modules/api-key/`), without its orgs and RBAC. Where optikí deliberately differs, the last section says so.

## The token

```
opt_<prefix>_<token>
opt_3f9a1c07be42_9d2c…64 hex…e1
```

| Part | Value | Stored as |
|---|---|---|
| `opt` | fixed (`constants.API_TOKEN_PREFIX`) | — |
| `<prefix>` | 6 random bytes → 12 lowercase hex characters | `api_tokens.prefix`, unique: the lookup key, shown in the UI |
| `<token>` | 32 random bytes → 64 lowercase hex characters | only `sha256(<token>)` as hex, in `api_tokens.tokenHash` |

- Both parts come from `crypto/rand`. Hex never contains `_`, so splitting on `_` is unambiguous.
- The full token is returned **once**, in the create response. Afterwards the UI shows `opt_<prefix>_••••`.
- SHA-256 without a salt is correct here: the secret has 256 bits of entropy, so there is nothing to brute-force. bcrypt would only slow down every API request.

`pkg/apiToken.go`, one concern with four functions, plus `apiToken_test.go`:

```go
// GenerateAPIToken returns a new opt_<prefix>_<token>, its prefix, and the SHA-256 of its secret
func GenerateAPIToken() (fullToken, prefix, tokenHash string, err error)

// ParseAPIToken splits a presented token; anything not shaped opt_<12 hex>_<64 hex> is ErrInvalidAPIToken
func ParseAPIToken(raw string) (prefix, secret string, err error)

// HashAPITokenSecret returns the SHA-256 hex of a token secret
func HashAPITokenSecret(secret string) string

// VerifyAPITokenSecret compares a secret with a stored hash in constant time
func VerifyAPITokenSecret(secret, storedHash string) bool // subtle.ConstantTimeCompare
```

- `ParseAPIToken` checks the literal `opt` part, both lengths, and that both parts are lowercase hex. gradescript only checked lengths.
- On create, a `prefix` unique-index collision is retried up to 3 times with a fresh token before the request fails. gradescript returned a 500.

## Permissions

Named `resource:action:scope`, as in gradescript. The scope is always `own`: a token acts only on its owner's rows. There are no orgs, so there is no `any`.

| Permission | Lets a token |
|---|---|
| `scan:create:own` | run scans (`FULL` rule set; URL scans render) |
| `scan:view:own` | list and read the owner's scans |
| `scan:edit:own` | change a scan's title, visibility or project |
| `scan:delete:own` | delete the owner's scans |
| `project:create:own` | create projects |
| `project:view:own` | list and read the owner's projects |
| `project:edit:own` | change a project's name, description, base URL or repository |
| `project:delete:own` | delete the owner's projects (their scans stay, unassigned) |

- The list lives in `internal/data/permissions.go` as `APITokenPermissions` (name + description). It is seeded into the `permissions` table on boot (`data-model.md`).
- **Today only the four `scan:*:own` permissions are seeded and grantable.** The `project:*:own` ones are added to that list in the same PR that builds projects.
- **These are the only grantable permissions.** Tokens never manage tokens, sessions or the account; those routes accept sessions only.
- Constants name them: `constants.PERMISSION_SCAN_CREATE = "scan:create:own"`, and so on. Routes use the constants, never string literals.
- Grants are rows in `api_token_permissions`. `models.APIToken{}.FindPermissionNames(tokenID)` reads them back as a `map[string]struct{}` with one join.

## Managing tokens (session only)

All under `/api/v1/apitoken`, all `Auth → VerifiedEmail`, all scoped to `"userID" = <caller>`. Another user's token is a **404**.

| Method · path | Handler | Notes |
|---|---|---|
| `POST /` | `CreateAPIToken` | 201; the only response that carries `token` |
| `GET /` | `GetAPITokens` | cursor list, newest first |
| `GET /permissions` | `GetAPITokenPermissions` | the grantable list with descriptions, for the picker. Registered **before** `/:id` |
| `GET /:id` | `GetAPIToken` | |
| `PATCH /:id` | `UpdateAPIToken` | `name` and/or `permissions` |
| `PATCH /:id/revoke` | `RevokeAPIToken` | soft: the row stays for its history |
| `DELETE /:id` | `DeleteAPIToken` | hard delete; its scans and projects keep `apiTokenID = NULL` |

### Create

```go
type CreateAPITokenInput struct {
	Name        string   `json:"name"`
	Permissions []string `json:"permissions"`
	ExpiresAt   *string  `json:"expiresAt"` // RFC 3339; null means never expires
}
```

Validation, in order:

1. The trimmed `name` is required and at most 64 characters (`API_TOKEN_MAX_NAME_LENGTH`).
2. Every permission is in `data.APITokenPermissions`. Otherwise: `Invalid permission "x"! Use one of …`.
3. Duplicates are dropped, and at least one permission remains.
4. `expiresAt` parses as RFC 3339 and is at least `API_TOKEN_MIN_LIFETIME` (24 h) minus `API_TOKEN_EXPIRY_CLOCK_SKEW` (5 min) from now.
5. The caller has fewer than `API_TOKEN_MAX_ACTIVE_PER_USER` (25) active tokens. Otherwise: 400 "You can have at most 25 active API tokens. Revoke one first."

Then one transaction does three things: generate the token, insert the `APIToken`, and insert one `APITokenPermission` per grant. If a permission name is missing from the table, the seed didn't run; that is a 500.

The response is 201 with `message: "API token created! Copy it now, you won't be able to see it again."` and `data: apiTokenData(token) + {"token": fullToken}`.

### Update, revoke, delete

- `UpdateAPIToken` takes `{name?, permissions?}` with the same validation, and replaces the grant rows in one transaction. A revoked token is 409 "This API token is revoked!". Expiry can't be changed; create a new token instead.
- `RevokeAPIToken` runs a conditional `UPDATE … SET "isRevoked" = true, "revokedAt" = now WHERE id = ? AND "userID" = ? AND "isRevoked" = false`.
  - Zero rows affected on a token the caller owns → 409 "This API token is already revoked!".
  - It responds with the row re-read after the update, not with `time.Now()`.
- `DeleteAPIToken` is a hard delete. Grants cascade; scans and projects keep their history with `apiTokenID = NULL`.

### Response map (`handlers/apitoken/apiTokenData.go`)

```json
{
  "id": "…", "name": "GitHub Action", "prefix": "3f9a1c07be42",
  "permissions": ["scan:create:own", "scan:view:own"],
  "status": "ACTIVE",
  "expiresAt": "2026-11-24T00:00:00Z", "lastUsedAt": null, "lastUsedIP": null,
  "isRevoked": false, "revokedAt": null,
  "createdAt": "…", "updatedAt": "…"
}
```

- `status` is derived: `REVOKED`, `EXPIRED` or `ACTIVE`.
- `permissions` is always an array, never `null`.
- `tokenHash` never leaves the server.

## Authenticating a token request — `middlewares/authAPI.go`

```go
func AuthAPI(c *fiber.Ctx) error {
	scheme, presented, _ := strings.Cut(strings.TrimSpace(c.Get(fiber.HeaderAuthorization)), " ")
	if !strings.EqualFold(scheme, constants.API_TOKEN_AUTH_SCHEME) || strings.TrimSpace(presented) == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Missing API token! Send it as Authorization: Bearer <token>.")
	}

	prefix, secret, err := pkg.ParseAPIToken(strings.TrimSpace(presented))
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrInvalidAPIToken)
	}

	apiToken := models.APIToken{}
	savedToken, err := apiToken.FindByPrefix(prefix)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if savedToken.ID == "" || !pkg.VerifyAPITokenSecret(secret, savedToken.TokenHash) {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrInvalidAPIToken)
	}
	if savedToken.IsRevoked {
		return pkg.NewReasonError(fiber.StatusUnauthorized, constants.ErrReasonTokenRevoked, "This API token has been revoked!")
	}
	if savedToken.ExpiresAt != nil && !savedToken.ExpiresAt.After(time.Now()) {
		return pkg.NewReasonError(fiber.StatusUnauthorized, constants.ErrReasonTokenExpired, "This API token has expired!")
	}

	// load the owner: missing → 401 ErrInvalidAPIToken; unverified → 403 EMAIL_NOT_VERIFIED
	// load permission names → map[string]struct{}

	c.Locals("userID", savedUser.ID)
	c.Locals("user", savedUser)
	c.Locals("apiToken", savedToken)
	c.Locals("apiTokenPermissions", permissions)
	return c.Next()
}
```

- **The secret is verified before revoked or expired is revealed**, so those messages only reach someone who holds the real secret.
- A missing prefix still returns the same "Invalid API token!" message.
- The token API is for scripts, not browsers. Nothing in `/client/v1` reads cookies, and CORS doesn't need `Authorization`.

### `middlewares/requirePermission.go`

The one middleware that takes a parameter: it returns a `fiber.Handler`, so the route table shows exactly what each endpoint needs.

```go
func RequirePermission(permission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		permissions, ok := c.Locals("apiTokenPermissions").(map[string]struct{})
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, constants.ErrInvalidAPIToken)
		}
		if _, granted := permissions[permission]; !granted {
			return pkg.NewReasonError(fiber.StatusForbidden, constants.ErrReasonMissingPermission,
				"This API token does not have the "+permission+" permission!")
		}
		// touch lastUsedAt / lastUsedIP — at most once per API_TOKEN_LAST_USED_RESOLUTION (1 min); log, don't fail
		return c.Next()
	}
}
```

`lastUsedAt` is touched **after** the permission check, so a denied request doesn't count as a use.

## The token API surface — `/client/v1`

```go
// Scan (token API)
scanAPIGroup := app.Group("/client/v1/scan", func(c *fiber.Ctx) error {
	return c.Next()
})
scanAPIGroup.Post("/", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_CREATE), middlewares.ScanRateLimit, scan.CreateScan)
scanAPIGroup.Get("/", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_VIEW), scan.GetScans)
scanAPIGroup.Get("/:id", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_VIEW), scan.GetScan)
scanAPIGroup.Patch("/:id", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_EDIT), scan.UpdateScan)
scanAPIGroup.Delete("/:id", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_DELETE), scan.DeleteScan)
```

Project routes will follow the same pattern (`projects.md`) once projects are built.

- **Same handlers as the browser API.** Both auth middlewares set `user`, so ownership code reads one local. `apiToken` is set only here; handlers use it to record `apiTokenID`, choose `triggeredBy API_TOKEN`, and accept the CI fields.
- **Owner-scoped, not token-scoped.** A token sees every scan and project its owner has, including ones made in the browser or by another of the owner's tokens. Permissions limit what it may *do*, not which of the owner's rows it sees.
- No `message` on reads, `pagination` on lists, and explicit response maps, exactly as on `/api/v1`.

## Constants and reason codes

```go
var API_TOKEN_PREFIX = "opt"
var API_TOKEN_PREFIX_BYTES = 6
var API_TOKEN_SECRET_BYTES = 32
var API_TOKEN_AUTH_SCHEME = "Bearer"
var API_TOKEN_MAX_NAME_LENGTH = 64
var API_TOKEN_MIN_LIFETIME = 24 * time.Hour
var API_TOKEN_EXPIRY_CLOCK_SKEW = 5 * time.Minute
var API_TOKEN_LAST_USED_RESOLUTION = 1 * time.Minute
var API_TOKEN_MAX_ACTIVE_PER_USER = 25
```

| Reason (`constants/errors.go`) | Status | When |
|---|---|---|
| — (plain 401, `ErrInvalidAPIToken = "Invalid API token!"`) | 401 | missing, malformed, unknown, or wrong secret |
| `TOKEN_REVOKED` | 401 | right secret, revoked |
| `TOKEN_EXPIRED` | 401 | right secret, past `expiresAt` |
| `EMAIL_NOT_VERIFIED` | 403 | the owner's email is no longer verified |
| `MISSING_PERMISSION` | 403 | the token lacks the route's permission |

Each reason is mirrored in the client's `TServerErrorName`.

## What changed from gradescript, and why

| gradescript | optikí |
|---|---|
| `gsk_<8 hex>_<32 hex>`; a 32-bit key ID, and a collision is a 500 | `opt_<12 hex>_<64 hex>`; collisions retried |
| Keys belong to an org; grants are `UserOrgRole` + `RolePermission` rows with `apiKeyID`, so every membership query needs `"apiKeyID" IS NULL` | Tokens belong to a user; grants are a plain join table. Nothing else reads it, so there is no filter to forget |
| `:any` permissions that actually meant "the owner's rows in this org" | `:own`, which says what it means |
| `RolePermission` IDs typed as strings → `::text` casts | `uuid` FKs |
| `lastUsedAt` touched before the permission check | touched after it |
| `prefix` stored as `gsk_<id>` and the literal duplicated in a handler | `prefix` is the id; the literal lives only in `constants` |
| No update endpoint | `PATCH /:id` for name and permissions |
| Hourly expiry-warning emails (gocron) | not ported; there is no scheduler. The UI shows "Expires in 3 days" |
| Console-only management (`ConsoleSession`) | one client; management needs a verified session |

## Tests

`pkg/apiToken_test.go` is table-driven, needs no database, and covers:

- Generate → Parse round-trips, and the hash matches.
- Two generations never collide.
- Parse rejects: a wrong literal, uppercase hex, wrong lengths, a missing part, extra `_`, non-hex characters.
- Verify accepts the right secret and rejects a one-character change.

Everything else (AuthAPI, permissions, revoke) is covered by the TestSprite API suite (A10 in the testsprite skill).
