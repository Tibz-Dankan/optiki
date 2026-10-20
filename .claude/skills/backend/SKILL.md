---
name: backend
description: >-
  Conventions and recipes for the optikí Go/Fiber/GORM backend in server/.
  Use whenever adding or changing anything under server/ — a route, handler,
  middleware, model, schema field, pkg util, constant, email template, the
  scan engine wiring, or the deploy/container setup — or when asked where
  backend code belongs, how responses and errors are shaped, how the shared
  database keeps PR previews and production apart (the env tag), what needs
  tests, or how to wire a new domain end to end. The engine's own rules live
  in the engine skill. Does not apply to client/.
---

# optikí backend conventions

Go 1.26 · Fiber v2 · GORM + Postgres · module `github.com/Tibz-Dankan/optiki` (module root is `server/`).

These conventions come from the GradeScript backend this server was bootstrapped from; where optikí differs, this file says so. Follow it exactly.

## 1. The tree

```
server/
  cmd/main.go                  Fiber app, global middleware, env checks, port, Listen
  cmd/purge/main.go            purge <env> — deletes one env's rows (closed PR previews)
  cmd/optiki/                  (PR #7) the CLI: rendered scans with chromedp, diff, upload
  Makefile                     make run · install · test · build · purge ENV=…
  internal/
    routes/routes.go           THE only route table — every path in the app
    handlers/<domain>/         one file per endpoint, package == folder name
    middlewares/               one file per middleware, func(c *fiber.Ctx) error
    models/
      db.go                    Postgres singleton + advisory-locked AutoMigrate list
      schema.go                ALL GORM structs, nothing else
      envScope.go              scopeEnv / stampEnv — the shared-database contract (§ 6)
      purgeEnv.go              deletes one env's rows from every tagged table
      <entity>.go              methods for exactly one entity
    engine/                    (PR #2) PURE scan engine — see the engine skill
    snapshot/static|rendered/  (PR #2 / #7) HTML or Chrome → engine.Snapshot
    gym/                       (PR #3) fixture pages, //go:embed, shared by engine tests and a static route
    pkg/                       stateless cross-cutting helpers, one concern per file
    constants/                 constants.go — tunables; errors.go — error strings and reason codes
    templates/                 templates.go (//go:embed) + email/layout.html and one file per email
    types/ data/ assets/       shared types · seed/enum tables · embedded assets (openapi.yaml)
```

**Why `engine/`, `snapshot/` and `gym/` exist** (a new top-level directory under `internal/` needs a stated reason): the scan engine is optikí's core logic — pure, deterministic, heavily tested, and imported by both the server and the CLI. Flattening it into `pkg/` would bury ~30 files of one concern among unrelated helpers. Nothing under `engine/` may import `models`, `handlers`, Fiber, or do I/O.

## 2. Naming

- Files are `lowerCamelCase.go`, named after the one exported symbol they contain: `signUp.go` → `SignUp`, `validateQueryLimit.go` → `ValidateQueryLimit`. Rules follow the same rule: `opt101HiddenControl.go`.
- One endpoint = one file. Never two handlers in a file. Unexported helpers shared inside a handler package get their own file too (`startSession.go`, `userResponseData.go`).
- Handler names read `<Verb><Noun>`. Where the HTTP verb is not obvious, the file carries it: `getAppStatus.go`.
- Package name == folder name, lowercase, no underscores.
- Enum-ish string columns take `SCREAMING_SNAKE` values, listed in a trailing `//` comment on the struct field.

**Comments: default to none.** Write one only where the reason for a line is unrecoverable from the code — one line, above it. Exempt: exported `pkg/` helpers carry a single-line doc comment; `schema.go` keeps its enum-value trailing comments and `// Relationships` markers; `routes.go` keeps its per-group `// Auth` labels; `TODO:` markers stay.

## 3. Handler recipes

### Write endpoints (create, update)

```go
package auth

type UpdateUserInput struct {
	Name string `json:"name"`
}

var UpdateUser = func(c *fiber.Ctx) error {
	userID := c.Params("id")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}
	if userID != user.ID {
		return fiber.NewError(fiber.StatusForbidden, constants.ErrNotPermitted)
	}

	input := UpdateUserInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	// validate input …

	updatedUser, err := user.Update()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Profile updated successfully!",
		"data":    userResponseData(updatedUser),
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
```

Rules:

- `var X = func(c *fiber.Ctx) error` — the assigned-closure form, not `func X(...)`.
- **Always declare a `<HandlerName>Input` struct with `json` tags and parse into that.** Never `BodyParser` into a `models.*` struct: that makes every model field — `role`, `emailVerified`, `password`, `env` — settable from the request body. (GradeScript's sign-up/sign-in broke this rule; optikí's ports fix it.)
- Read request context with the comma-ok form, never a bare assertion. Available locals: `clientIP` (always), `userID` (whenever a valid cookie exists), `user` and `session` (only behind `middlewares.Auth`).
- Side effects that must not fail the request — sending email — log and continue.

### Read one

Singular handler name, id from the path, `status` + `data` only (no `message`). The model's `FindOne` does the lookup (and any preloading). A resource the caller doesn't own is a **404**, not a 403 — don't confirm it exists.

### Read many (cursor pagination)

`auth/getActiveSessions.go` is the reference. Plural handler name, `limit`/`cursor` query params, the **`limit+1` lookahead**:

1. `limit` and `cursor` come from `c.Query`. A missing cursor means "first page".
2. Size the page with `pkg.ValidateQueryLimit`. A bad limit is a **400**, not a clamp.
3. Call the model with **`limit+1`**. Never `limit`.
4. If the result is longer than `limit`, drop the last row, take `nextCursor` from the new last row's `ID`, set `hasNextItems`.
5. `pagination` always carries all four keys — `limit`, `nextCursor`, `hasNextItems`, `count`.
6. An empty result is `"data": []`, not a 404.

## 4. Response and error contract

| Endpoint | Keys |
|---|---|
| Write (create, update, delete) | `status`, `message`, `data` (or a well-known domain key: `session`, `user`, `otp`) |
| Read one | `status`, `data` |
| Read many | `status`, `data`, `pagination` |

- **`message` belongs to writes only.** Use `fiber.Map` for the envelope (`pagination` is built as `map[string]interface{}`).
- **Never serialise a model that carries secrets.** `User` (password hash), `Session` (token hashes) and `OTP` (code hash) are returned through explicit field maps — `userResponseData`, `sessionResponseData`. Their `json:"-"` tags are a second line of defence, not the first.
- `StatusCreated` for creates, `StatusOK` otherwise.

Every failure path returns an error; never hand-roll an error JSON body. `pkg.DefaultErrorHandler` renders:

| Code | `status` | `error` | `message` the client sees |
|------|----------|---------|---------------------------|
| 4xx | `fail` | the reason code, else the status name (`BAD_REQUEST`, `NOT_FOUND`, …) | your message, verbatim |
| 5xx | `error` | the status name | `"Ooops, something went wrong, try again later!"` — yours only reaches the log |

**Reason codes.** When a client or a test must branch on *why* a request failed, return `pkg.NewReasonError(status, "SCREAMING_SNAKE_REASON", message)` instead of `fiber.NewError`. The reason becomes the `error` field. Current reasons: `EMAIL_NOT_VERIFIED`; coming with scans: `SSRF_BLOCKED`, `NOT_HTML`, `FETCH_TIMEOUT`. Every reason is a constant in `constants/errors.go` and is mirrored in the client's `TServerErrorName`.

**A 5xx message is developer-facing only. Anything the user must act on has to be 4xx.**

## 5. Model recipe

Adding an entity touches three files. Miss `db.go` and the table is silently never created.

**1. `schema.go`** — the struct, and nothing but structs:

```go
type Scan struct {
	ID        string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	Env       string    `gorm:"column:env;not null;index" json:"-"`
	UserID    *string   `gorm:"column:userID;type:uuid;default:null;index" json:"userID"`
	Mode      string    `gorm:"column:mode;not null" json:"mode"` // STATIC, RENDERED
	CreatedAt time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}
```

`ID` is `type:uuid;primaryKey`. Every column gets an explicit camelCase `column:` tag. `CreatedAt` and `UpdatedAt` are indexed. **Every table holding user data has the `Env` column** (§ 6). Relationships go last under `// Relationships`.

**2. `<entity>.go`** — `BeforeCreate` sets the UUID **and calls `stampEnv(tx)`**, then methods on a pointer receiver. Every query starts with `db.Scopes(scopeEnv)`.

**3. `db.go`** — add the type to the `AutoMigrate` list, **and** add the table to `purgeEnv.go`.

### GORM gotchas

- Columns are camelCase, so **every raw SQL fragment must quote them**: `db.Where("\"userID\" = ?", userID)`, `db.Order("\"createdAt\" DESC")`.
- Lookups tolerate absence: filter out `gorm.ErrRecordNotFound` and let the caller test `row.ID == ""`.
- **Never `db.Save` an existing row.** When its update matches zero rows, `Save` falls back to an upsert — combined with the env scope that can silently insert into the wrong environment. Update with `Model(&T{}).Where("id = ?", id).Updates(map[string]interface{}{…})` and list the columns you mean to change.
- Cursor pagination is timestamp-keyed, never OFFSET.
- `models.Db()` is a `sync.Once` singleton exposed as the package-level `db`. Never open a second connection.

## 6. One database for every environment — the `env` contract

Every PR preview and production run against **one** Postgres database. They are kept apart by data, not by connection:

- `pkg.GetDeployEnv()` returns the env tag: `OPTIKI_ENV` (`pr-12`, `production`, …), defaulting to `local` in local development. Deployed containers refuse to boot without it.
- **Stamp:** every user-data model's `BeforeCreate` calls `stampEnv(tx)`.
- **Scope:** every query on a tagged table goes through `db.Scopes(scopeEnv)` — reads, updates and deletes. A query without it reads or changes another PR's (or production's) data.
- **Uniqueness is per environment**: a unique business key includes `env` (`users` has `uniqueIndex:idx_users_env_email` on both columns). That is what lets every preview seed the same TestSprite account.
- **Purge:** `purgeEnv.go` lists every tagged table, children first. `cmd/purge` calls it when a PR closes, and refuses `production`.
- **Migrations are additive-only.** A PR's AutoMigrate runs against production's schema the moment its preview boots. So in a PR: new tables and new columns only, and new columns must be nullable or have a default. **Never** rename, retype or drop a column in a PR — that is a manual migration run after merge. AutoMigrate runs inside a Postgres advisory lock (`constants.MIGRATION_ADVISORY_LOCK_KEY`) so concurrent boots don't race.
- **System paths** — code that deliberately works across envs (only `PurgeEnv` today) — carry a `// System path:` comment saying why.

## 7. Routes

One table: `routes.AppRoutes(app)`. Group per domain; pass middleware positionally per route in the order `AuthRateLimit → Auth → VerifiedEmail → handler`:

```go
// Auth
authGroup := app.Group("/api/v1/auth", func(c *fiber.Ctx) error {
	return c.Next()
})
authGroup.Post("/signin", middlewares.AuthRateLimit, auth.SignIn)
authGroup.Get("/me", middlewares.Auth, auth.GetMe)
authGroup.Patch("/user/:id", middlewares.Auth, middlewares.VerifiedEmail, auth.UpdateUser)
```

- Application routes live under `/api/v1/<domain>`. The token-authenticated CLI API (PR #8) lives under `/client/v1/<domain>`.
- Operational endpoints — `/health` (reports `commit` and `env`; CI waits until `commit` equals the pushed SHA) and `/status` — sit outside the version prefix.
- Then `// Client`: `app.Static` serves the built client from `./public`, and `client.ServeIndex` returns `index.html` for any other GET outside `/api/` and `/client/` (the SPA fallback).
- The catch-all JSON 404 `app.Use("*", …)` stays last. Nothing registers after it.
- No business logic in this file. It is a table.

## 8. Middleware

Signature `func Name(c *fiber.Ctx) error`, ending in `c.Next()`. One per file.

| Middleware | Where | Behaviour |
|---|---|---|
| `LimitRequestBody` | global | 413s any body over `MAX_REQUEST_BODY_SIZE` (4 MB) |
| `SetClientIP` | global | `X-Real-IP` → first `X-Forwarded-For` → `c.IP()` into `clientIP` |
| `SetUserInRequest` | global | Optional auth: sets `userID` when a valid cookie exists, **never rejects** |
| `AuthRateLimit` | per route | Per-IP, per-route window (`AUTH_RATE_LIMIT`/minute) on credential and code endpoints; sets `RateLimit-*` headers and `Retry-After` |
| `Auth` | per route | Hard gate: valid `accessToken` cookie → session (looked up by token hash, env-scoped, not revoked, not expired) → user. Sets `userID`, `user`, `session`. Authn failures are **401** |
| `VerifiedEmail` | per route, after `Auth` | 403 with reason `EMAIL_NOT_VERIFIED` |

`SetClientIP` trusts forwarding headers because **Traefik is the only ingress** and overwrites them. Containers must never publish their port to the host — otherwise a client can spoof `X-Real-IP` and dodge the rate limiter.

## 9. pkg

Stateless helpers, one concern per file, no handler logic. Reuse these:

| Helper | Use |
|---|---|
| `GetAppEnv()` | the runtime switch: `local_development`, `deployed_development` (PR previews), `deployed_production` |
| `GetDeployEnv()` | the row tag (§ 6) |
| `GetTokenExpiry(role)`, `SignJWTToken(userID, expiresAt)`, `DecodeJWT(token)` | 12 h access / 30 d refresh; HS256 only; a random `jti` keeps tokens issued in the same second distinct |
| `SetAuthCookies`, `SetAccessTokenCookie`, `ClearAuthCookies` | the two httpOnly cookies — `SameSite=Lax` (one origin), `Secure` when `GO_ENV=production` |
| `EncodeToHexString` | SHA-256 hex — how OTPs, verification tokens and session tokens are stored |
| `GenerateNumericCode(n)`, `GenerateRandomState()` | `crypto/rand` OTPs and URL-safe tokens (GradeScript's `math/rand` OTPs are not ported) |
| `Email{Recipient}` + `SendWelcome`/`SendVerifyEmail`/`SendResetPassword` | Resend, templates embedded; with no `RESEND_API_KEY` in local dev the email is logged instead (never in deployed envs) |
| `NormalizeEmail`, `IsValidEmail`, `ValidateInput`, `ValidateQueryLimit`, `IsValidTheme` | input handling |
| `GetClientBaseURL()`, `AllowedOrigins()`, `IsAllowedOrigin()` | `APP_BASE_URL` (this deployment's origin), used in email links and CORS |
| `NewReasonError`, `DefaultErrorHandler`, `StatusCodeName`, `ListQueryError` | the error contract (§ 4) |
| `FetchPublicPage` *(PR #5)* | **the only way to fetch a user-supplied URL** — SSRF-safe (see § 11) |

Adding an email is three edits: a template in `templates/email/` supplying the `content` and `preheader` blocks the layout expects, a `subject…` constant in `email.go`, and a `Send…` method delegating to `renderAndSend`.

## 10. Environment and config

`.env` loads only in local development (`make run` sets `GO_ENV=development`). Every secret comes from the environment; never log a token, a code, a DSN or a key.

| Variable | Notes |
|---|---|
| `OPTIKI_DEV_DSN_LOCAL` / `OPTIKI_DEV_DSN` / `OPTIKI_PROD_DSN` | DSN per `GetAppEnv()`; the two deployed ones hold the **same** database URL |
| `OPTIKI_ENV` | row tag; required when deployed |
| `JWT_SECRET` | ≥ 32 chars, or the server refuses to boot |
| `APP_BASE_URL` | required when deployed; set by the deploy scripts, e.g. `https://pr-12.optiki.example.com` |
| `GIT_SHA` | reported by `/health` |
| `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` | email |
| `SEED_DEMO`, `DEMO_EMAIL`/`DEMO_PASSWORD`(/`_2`) | verified TestSprite accounts, created once per env on boot |

Ports: 8000 (local and previews), 8001 (production).

## 11. Security rules

- **Ownership**: every list query filters on the caller (`"userID" = ?`) inside `scopeEnv`; single-row handlers compare the owner and answer 404 for others. (GradeScript's RBAC/`ResourceScope` tables are not ported.)
- **User-supplied URLs** go through `pkg.FetchPublicPage` only: http/https on 80/443, resolve then reject private/loopback/link-local/CGNAT/multicast/IPv4-mapped addresses, re-check the dialed IP in `net.Dialer.Control`, re-validate every redirect (max 3), 8 s timeout, 2 MB cap, `text/html` only. Blocked → `NewReasonError(400, "SSRF_BLOCKED", …)`.
- **Never render user HTML.** Scan input is parsed by the engine and only ever returned as escaped snippets.
- **No file uploads, no multipart.** Scan input is JSON (`html`, `url`, or `gym`).
- **OTPs**: single use, expire, and burn after `RESET_PASSWORD_OTP_MAX_ATTEMPTS` wrong guesses. Forgot-password never reveals whether an account exists. A password reset revokes every other session.
- **No secrets in the repo** — only `.env.example`. A gitleaks job is a required check.
- **Fail closed.** Any gate (the optiki Action, CI scripts) exits non-zero on errors; a missing score is never a pass.

## 12. Tests

**Only the engine, the snapshot builders and `pkg/fetchPublicPage` get Go tests** — the deterministic core and the security boundary. CRUD handlers ship without Go tests; they are covered by the TestSprite API suite against every PR preview (see the `testsprite` skill). Don't add test files elsewhere unless asked.

- Unit tests sit next to the code as `<file>_test.go`, need no database, and run with `make test` (`go test -race ./internal/...`).
- Engine tests are table-driven over the Gym fixtures plus golden reports — the engine skill has the recipe.

## 13. Container and deployment

- One image (root `Dockerfile`): builds `client/dist` with pnpm, builds `optiki-server` and `purge`, and runs on Alpine with the client copied to `./public`. Chromium is added when rendered scans land (PR #7).
- On the Contabo VPS (`deploy/compose.yml`), Traefik routes `pr-<n>.<OPTIKI_DOMAIN>` to container `optiki-pr-<n>` (port 8000) and `<OPTIKI_DOMAIN>` (e.g. `optiki.example.com`) to `optiki-prod` (port 8001) by Docker labels. App containers join the `optiki-edge` network (Traefik) and the internal `optiki-db` network (Postgres) and **publish no ports**. Scripts: `scripts/deploy-preview.sh`, `destroy-preview.sh` (runs `purge pr-<n>`), `deploy-prod.sh`, sharing `scripts/lib.sh`. Container env comes from `~/optiki/preview.env` or `~/optiki/prod.env` (examples in `deploy/`) plus `OPTIKI_ENV`, `APP_BASE_URL` and `GIT_SHA` from the script.
- CI (`.github/workflows/preview.yml`) builds `ghcr.io/tibz-dankan/optiki:pr-<n>-<sha>`, deploys it over SSH, and waits until the public `/health` reports the SHA. The TestSprite GitHub App triggers on that workflow's completion. `preview-cleanup.yml` destroys and purges on close; `deploy-prod.yml` deploys `main`.
- **A new endpoint updates `internal/assets/openapi.yaml`** in the same PR — TestSprite's API mode reads it from `/api/v1/openapi.yaml`.

## 14. Anti-patterns

- Business logic in `routes.go`; a second DB connection; `panic` in a request path.
- `BodyParser` into a `models.*` struct instead of an `Input` struct.
- Returning a `User`, `Session` or `OTP` struct (or anything preloading one) instead of an explicit field map.
- **A query on an env-tagged table without `db.Scopes(scopeEnv)`**; a tagged table missing from `purgeEnv.go`; a new user-data table without the `Env` column.
- **A destructive migration in a PR** (rename, retype, drop), or a new `NOT NULL` column without a default.
- **`db.Save` on an existing row.**
- Fetching a user-supplied URL with anything but `pkg.FetchPublicPage`; rendering user HTML; multipart endpoints.
- A `message` key on a read response, or a read-many response missing `pagination`; paginating with `limit` instead of `limit+1`; clamping a bad `limit`.
- Unquoted camelCase columns in raw SQL; a GORM struct declared anywhere but `schema.go`.
- `errors.New(constants.ErrNotPermitted)` instead of the `ErrNotPermittedError` sentinel; a 5xx for something the user must act on.
- Secrets, tokens, codes or DSNs in logs; publishing a container port to the host.
- A test file outside `engine/`, `snapshot/` and `pkg/fetchPublicPage`.
- A JSDoc-style or multi-paragraph comment explaining what a handler does.

## 15. Before you call it done

- [ ] Route registered in `routes.go`, correct group, middleware order `AuthRateLimit → Auth → VerifiedEmail → handler`
- [ ] Handler file named for its one exported symbol, `<Name>Input` struct declared
- [ ] Model struct in `schema.go` with `Env`; methods use `scopeEnv`; `BeforeCreate` stamps env; added to `AutoMigrate` **and** `purgeEnv.go`
- [ ] Migration is additive-only; new columns nullable or defaulted
- [ ] Raw SQL fragments quote their camelCase columns; no `db.Save` on existing rows
- [ ] Every failure path returns an error; user-actionable messages are 4xx; reasons the client branches on use `NewReasonError`
- [ ] Response envelope matches the verb; nothing secret is serialised
- [ ] A TestSprite API scenario covers the endpoint (testsprite skill)
- [ ] `gofmt -l .` empty, `go vet ./...` and `go build ./...` pass, `make test` passes
- [ ] `make run` boots and logs `Auto Migration successful`
