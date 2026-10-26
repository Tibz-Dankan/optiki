---
name: backend
description: >-
  Conventions and recipes for the optikí Go/Fiber/GORM backend in server/.
  Use whenever adding or changing anything under server/ — a route, handler,
  middleware, model, schema field, migration, pkg util, constant, email
  template, scans (anonymous, signed-in and API-token callers, rule sets,
  static fetch and rendered Chromium scans, storage), scan screenshots in S3
  (attachments, presigned URLs), projects, API tokens and their permissions,
  the /client/v1 token API, or the deploy/container
  setup — or when asked where backend code belongs, how responses and errors
  are shaped, what needs tests, or how to wire a new domain end to end. The
  engine's own rules live in the engine skill. Does not apply to client/.
---

# optikí backend conventions

Go 1.26 · Fiber v2 · GORM + Postgres · module `github.com/Tibz-Dankan/optiki` (module root is `server/`).

These conventions come from the GradeScript backend this server was bootstrapped from; where optikí differs, this file says so. Follow it exactly.

The API is deployed at `https://optikiapi.tuliime.com` and the client separately on Netlify at `https://optikii.netlify.app`. There is one production database. Each PR deploys its server here (`ci-previews.yaml`) before its Netlify client preview, so production runs the last-deployed PR until the next merge.

## References

| File | Read it when |
|---|---|
| `references/data-model.md` | Adding or changing any table, column, index, FK or seed; writing a migration |
| `references/scans.md` | Anything about scans: who gets which rule set, the create pipeline, fetching or rendering a URL, storage, read/list/update/delete, rate limits |
| `references/api-tokens.md` | Token format, `AuthAPI`, permissions, token management endpoints, the `/client/v1` surface |
| `references/attachments.md` | Scan screenshots: the S3 client, the `attachments` table, upload/link/sign/delete, presigned URLs |
| `references/projects.md` | Project CRUD and how scans attach to projects (not built yet) |
| `references/site-visits.md` | Site visit capture: `POST /sitevisit`, devices, IP locations, page names, anonymous IDs and `anony-reconcile` |

## 1. The tree

```
server/
  cmd/main.go                  Fiber app, global middleware, env checks, port, Listen
  Makefile                     make run · install · test · build
  internal/
    routes/routes.go           THE only route table — every path in the app
    handlers/<domain>/         one file per endpoint, package == folder name
                               auth/ appearance/ docs/ health/ status/ scan/ apitoken/ rules/ gym/ sitevisit/ (project/ later)
    middlewares/               one file per middleware
    models/
      db.go                    Postgres singleton + AutoMigrate list
      schema.go                ALL GORM structs, nothing else
      <entity>.go              methods for exactly one entity
    engine/                    PURE scan engine — see the engine skill
    snapshot/static|rendered/  HTML (x/net/html) or Chromium (chromedp) → engine.Snapshot
    gym/                       fixture pages, //go:embed, shared by engine tests and the /gym routes
    pkg/                       stateless cross-cutting helpers, one concern per file
    constants/                 constants.go — tunables and enum values; errors.go — error strings and reason codes
    data/                      seed lists and lookup tables — permissions.go (the grantable API token permissions),
                               siteVisitPageNames.go (client path → site visit page name)
    templates/                 templates.go (//go:embed) + email/layout.html and one file per email
    types/ assets/             shared types · embedded assets (openapi.yaml)
```

**Why `engine/`, `snapshot/` and `gym/` exist** (a new top-level directory under `internal/` needs a stated reason): the scan engine is optikí's core logic — pure, deterministic, heavily tested. Flattening it into `pkg/` would bury ~30 files of one concern among unrelated helpers. Nothing under `engine/` may import `models`, `handlers`, Fiber, or do I/O. `snapshot/rendered` is I/O (it drives Chromium) and lives outside `engine/` for that reason.

The server serves **only the API**. It does not serve the client: that is a static build on Netlify.

## 2. Naming

- Files are `lowerCamelCase.go`, named after the one exported symbol they contain: `signUp.go` → `SignUp`, `validateQueryLimit.go` → `ValidateQueryLimit`. Rules follow the same rule: `opt101HiddenControl.go`.
- One endpoint = one file. Never two handlers in a file. Unexported helpers shared inside a handler package get their own file too (`startSession.go`, `userResponseData.go`, `runScan.go`).
- Handler names read `<Verb><Noun>`. Where the HTTP verb is not obvious, the file carries it: `getAppStatus.go`.
- Package name == folder name, lowercase, no underscores (`apitoken`, not `api_token`).
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
- **Always declare a `<HandlerName>Input` struct with `json` tags and parse into that.** Never `BodyParser` into a `models.*` struct: that makes every model field — `role`, `emailVerified`, `password`, `userID` — settable from the request body.
- Read request context with the comma-ok form, never a bare assertion. Available locals:
  - `clientIP` (always)
  - `userID` (whenever a valid cookie or token exists)
  - `user` (behind `Auth`, `AuthAPI`, or `OptionalAuth` when signed in)
  - `session` (behind `Auth`/`OptionalAuth`)
  - `apiToken` and `apiTokenPermissions` (behind `AuthAPI` only)
- Side effects that must not fail the request — sending email, touching `lastUsedAt` — log and continue.

### One handler, two surfaces

Scans and projects are reachable from the browser (`/api/v1`, session cookie) and from scripts (`/client/v1`, API token). **When the behaviour is the same, it is the same handler, registered twice in `routes.go`.**

- Ownership code reads `user`, which both `Auth` and `AuthAPI` set.
- Branch on `apiToken` only where the surfaces genuinely differ: recording `apiTokenID`, `triggeredBy API_TOKEN`, accepting the CI fields, and reading only one's own scans.
- There is no `apihandlers/` tree (gradescript's split); a second copy of each handler would drift.

### Read one

Singular handler name, id from the path, `status` + `data` only (no `message`). The model's `FindOne` does the lookup (and any preloading). A resource the caller doesn't own is a **404**, not a 403 — don't confirm it exists. A malformed UUID is a 400.

### Read many (cursor pagination)

`auth/getActiveSessions.go` is the reference. Plural handler name, `limit`/`cursor` query params, the **`limit+1` lookahead**:

1. `limit` and `cursor` come from `c.Query`. A missing cursor means "first page".
2. Size the page with `pkg.ValidateQueryLimit` (default 12, 1–25). A bad limit is a **400**, not a clamp.
3. Call the model with **`limit+1`**. Never `limit`.
4. If the result is longer than `limit`, drop the last row, take `nextCursor` from the new last row's `ID`, set `hasNextItems`.
5. `pagination` always carries all four keys — `limit`, `nextCursor`, `hasNextItems`, `count`.
6. An empty result is `"data": []`, not a 404.
7. The cursor lookup is scoped to the caller too (`id = ? AND "userID" = ?`), and an unknown cursor is a 400, not a 500. (`Session.FindAllActiveByUser` predates this rule; fix it when you next touch it.)

## 4. Response and error contract

| Endpoint | Keys |
|---|---|
| Write (create, update, delete) | `status`, `message`, `data` (or a well-known domain key: `session`, `user`, `otp`) |
| Read one | `status`, `data` |
| Read many | `status`, `data`, `pagination` |

- **`message` belongs to writes only.** Use `fiber.Map` for the envelope (`pagination` is built as `map[string]interface{}`).
- **Never serialise a model.** Every response goes through an explicit field map: `userResponseData`, `sessionResponseData`, `scanReportData`, `apiTokenData`, `projectResponseData`. `json:"-"` on secrets (`password`, session tokens, `OTP`, `tokenHash`) is a second line of defence, not the first.
- `StatusCreated` for creates, `StatusOK` otherwise.

Every failure path returns an error; never hand-roll an error JSON body. `pkg.DefaultErrorHandler` renders:

| Code | `status` | `error` | `message` the client sees |
|------|----------|---------|---------------------------|
| 4xx | `fail` | the reason code, else the status name (`BAD_REQUEST`, `NOT_FOUND`, …) | your message, verbatim |
| 5xx | `error` | the status name | `"Ooops, something went wrong, try again later!"` — yours only reaches the log |

**Reason codes.** When a client, a script or a test must branch on *why* a request failed, return `pkg.NewReasonError(status, "SCREAMING_SNAKE_REASON", message)` instead of `fiber.NewError`. The reason becomes the `error` field. Every reason is a constant in `constants/errors.go` and is mirrored in the client's `TServerErrorName`.

| Reason | Status | Raised by |
|---|---|---|
| `EMAIL_NOT_VERIFIED` | 403 | `VerifiedEmail`, `AuthAPI` (exists today) |
| `SSRF_BLOCKED` | 400 | URL pre-flight, redirects, render proxy |
| `TOO_LARGE` | 413 | HTML input or fetched body over 2 MB |
| `NOT_HTML` | 422 | fetched content isn't `text/html` |
| `FETCH_TIMEOUT` · `RENDER_TIMEOUT` | 422 | the target took too long |
| `RENDERER_BUSY` | 429 | no render slot within 10 s |
| `TOKEN_REVOKED` · `TOKEN_EXPIRED` | 401 | `AuthAPI` |
| `MISSING_PERMISSION` | 403 | `RequirePermission` |

**A 5xx message is developer-facing only. Anything the user must act on has to be 4xx** — that is why target timeouts are 422, not 504.

## 5. Model recipe

Adding an entity touches three files. Miss `db.go` and the table is silently never created. `references/data-model.md` has every table's full struct.

**1. `schema.go`** — the struct, and nothing but structs:

```go
type Project struct {
	ID         string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID     string    `gorm:"column:userID;type:uuid;not null;index" json:"userID"`
	Name       string    `gorm:"column:name;size:64;not null" json:"name"`
	CreatedVia string    `gorm:"column:createdVia;not null" json:"createdVia"` // WEB, API_TOKEN
	CreatedAt  time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}
```

- `ID` is `type:uuid;primaryKey`. Every column gets an explicit camelCase `column:` tag. `CreatedAt` and `UpdatedAt` are indexed.
- Optional columns are pointers with `default:null`.
- Relationships go last under `// Relationships`. Pick `OnDelete` deliberately: `CASCADE` for rows that mean nothing without their parent (findings without their scan), `SET NULL` for history that should outlive a label (scans when a project or token is deleted).

**2. `<entity>.go`** — `BeforeCreate` sets the UUID, then methods on a pointer receiver. Methods that answer for a user take the `userID` and filter on it.

**3. `db.go`** — add the type to the `AutoMigrate` list, parents before children.

### GORM gotchas

- Columns are camelCase, so **every raw SQL fragment must quote them**: `db.Where("\"userID\" = ?", userID)`, `db.Order("\"createdAt\" DESC")`.
- Lookups tolerate absence: filter out `gorm.ErrRecordNotFound` and let the caller test `row.ID == ""`.
- **Never `db.Save` an existing row.** When its update matches zero rows, `Save` falls back to an upsert and can silently insert a row. Update with `Model(&T{}).Where("id = ?", id).Updates(map[string]interface{}{…})` and list the columns you mean to change.
- State changes that must happen once — revoking a token, completing a scan — are **conditional updates** (`WHERE … AND "isRevoked" = false`) checked by `RowsAffected`.
- Multi-row writes that must land together (a scan's results and findings; a token and its grants) run in `db.Transaction`.
- Cursor pagination is timestamp-keyed, never OFFSET.
- `models.Db()` is a `sync.Once` singleton exposed as the package-level `db`. Never open a second connection.

## 6. Database and migrations

- One database per runtime: `OPTIKI_DEV_DSN_LOCAL` for `make run`, `OPTIKI_PROD_DSN` for the deployed container. No row carries an environment tag, and nothing filters on one.
- `AutoMigrate` runs on every boot and **only adds**: tables, columns, indexes, constraints. So:
  - New columns are nullable or have a default (existing rows need a value).
  - A **drop, rename, retype or tightening** is a manual SQL migration. Write it, run it on the local DB, run it on production **before** the deploy that needs it, and put it in the PR description.
  - Removing a field from a struct leaves its column in the database. If that column is `NOT NULL` without a default, every insert fails. `references/data-model.md` has the October 2026 example (dropping `env` and the session hash columns).
- Unique business keys are plain: `users.email`, `api_tokens.prefix`, `(userID, name)` on projects.
- Seed lists (`data/permissions.go`) are applied on every boot, idempotently, after AutoMigrate.

## 7. Routes

One table: `routes.AppRoutes(app)`. Group per domain and surface; pass middleware positionally per route.

```go
// Auth
authGroup := app.Group("/api/v1/auth", func(c *fiber.Ctx) error {
	return c.Next()
})
authGroup.Post("/signin", middlewares.AuthRateLimit, auth.SignIn)
authGroup.Get("/me", middlewares.Auth, auth.GetMe)
authGroup.Patch("/user/:id", middlewares.Auth, middlewares.VerifiedEmail, auth.UpdateUser)

// Scan
scanGroup := app.Group("/api/v1/scan", func(c *fiber.Ctx) error {
	return c.Next()
})
scanGroup.Post("/", middlewares.OptionalAuth, middlewares.ScanRateLimit, scan.CreateScan)
scanGroup.Get("/:id", middlewares.OptionalAuth, scan.GetScan)

// Scan (token API)
scanAPIGroup := app.Group("/client/v1/scan", func(c *fiber.Ctx) error {
	return c.Next()
})
scanAPIGroup.Post("/", middlewares.AuthAPI, middlewares.RequirePermission(constants.PERMISSION_SCAN_CREATE), middlewares.ScanRateLimit, scan.CreateScan)
```

- **`/api/v1/<domain>`** is the browser API (session cookies). Middleware order: `AuthRateLimit → Auth | OptionalAuth → VerifiedEmail → ScanRateLimit → handler`.
- **`/client/v1/<domain>`** is the token API, for scripts and CI. Middleware order: `AuthAPI → RequirePermission(…) → ScanRateLimit → handler`. It is never reached with cookies, and it has scan and project routes only.
- Token management (`/api/v1/apitoken`) is browser-only; a token can't manage tokens.
- Public read endpoints (`/api/v1/rules`, `/api/v1/gym`) and the Gym pages (`/gym/pages/:file`, `/gym/redirect-private`) take no auth.
- Operational endpoints — `/health` (`{status, data: {status, commit}}`) and `/status` — sit outside the version prefix.
- Static paths register before `/:id` (`/apitoken/permissions` before `/apitoken/:id`).
- The catch-all JSON 404 `app.Use("*", …)` stays last. Nothing registers after it.
- No business logic in this file. It is a table.

## 8. Middleware

Signature `func Name(c *fiber.Ctx) error`, ending in `c.Next()`, one per file. The one exception is `RequirePermission(permission string) fiber.Handler`, which takes the permission it checks.

| Middleware | Where | Behaviour |
|---|---|---|
| `LimitRequestBody` | global | 413s any body over `MAX_REQUEST_BODY_SIZE` (4 MB) |
| `SetClientIP` | global | `X-Real-IP` → first `X-Forwarded-For` → `c.IP()` into `clientIP` |
| `SetUserInRequest` | global | Decodes the access-token JWT into `userID`, **never rejects**, does no DB lookup — not enough to trust for anything that matters |
| `AuthRateLimit` | per route | Per-IP, per-route window (`AUTH_RATE_LIMIT`/minute) on credential and code endpoints; sets `RateLimit-*` headers and `Retry-After` |
| `Auth` | per route | Hard gate: valid `accessToken` cookie → session (by raw token, not revoked, not expired) → user. Sets `userID`, `user`, `session`. Authn failures are **401** |
| `OptionalAuth` | per route | The same lookup as `Auth`, but a missing or bad session just continues anonymously. Used where anonymous and signed-in callers share an endpoint (`POST /scan`, `GET /scan/:id`, `POST /sitevisit`) |
| `VerifiedEmail` | per route, after `Auth` | 403 with reason `EMAIL_NOT_VERIFIED` |
| `AuthAPI` | `/client/v1` | Bearer `opt_…` token → verified secret → not revoked/expired → verified owner. Sets `userID`, `user`, `apiToken`, `apiTokenPermissions` |
| `RequirePermission(p)` | `/client/v1`, after `AuthAPI` | 403 `MISSING_PERMISSION`; then touches `lastUsedAt` |
| `ScanRateLimit` | scan create, after auth | Per IP (anonymous), per user, or per token — see `references/scans.md` |
| `SiteVisitRateLimit` | `POST /sitevisit`, after `OptionalAuth` | Per IP, `SITE_VISIT_RATE_LIMIT` a minute: the endpoint is unauthenticated, writes a row and may trigger a geolocation lookup |

`SetClientIP` trusts forwarding headers because **Traefik is the only ingress**. The service publishes no host port: Traefik reaches 8001 over the stack's overlay network. Don't add a `ports:` entry for it. Swarm's ingress mesh bypasses UFW, so a published port is open to the internet whatever the firewall says. A client could then reach the container directly, spoof `X-Real-IP`, and dodge every per-IP limit.

TODO: Traefik runs with `forwardedHeaders.insecure=true` behind Cloudflare, so a client-sent `X-Real-IP` still passes through unchanged. The fix: read `CF-Connecting-IP`, trust only Cloudflare's ranges in Traefik, and limit origin 80/443 to Cloudflare.

## 9. pkg

Stateless helpers, one concern per file, no handler logic. Reuse these:

| Helper | Use |
|---|---|
| `GetAppEnv()` | `local_development` (`make run`, `GO_ENV=development`) or `deployed_production` (the container, `GO_ENV=production`) |
| `GetTokenExpiry(role)`, `SignJWTToken(userID, expiresAt)`, `DecodeJWT(token)` | 12 h access / 30 d refresh; HS256 only; a random `jti` keeps tokens issued in the same second distinct |
| `SetAuthCookies`, `SetAccessTokenCookie`, `ClearAuthCookies` | the two httpOnly cookies. Deployed: `SameSite=None; Secure`, because the Netlify client and the API are different sites. Local: `SameSite=Lax`, because `localhost:5173` and `localhost:8000` are the same site over plain http. Clearing sends a past `Expires`, since fasthttp drops a negative `max-age` |
| `EncodeToHexString` | SHA-256 hex — how OTPs are stored |
| `GenerateAPIToken`, `ParseAPIToken`, `HashAPITokenSecret`, `VerifyAPITokenSecret` | `opt_<prefix>_<token>` API tokens — `references/api-tokens.md` |
| `GenerateNumericCode(n)`, `GenerateRandomState()` | `crypto/rand` OTPs and URL-safe tokens |
| `Email{Recipient}` + `SendWelcome`/`SendVerifyEmail`/`SendResetPassword` | Resend, templates embedded. With no `RESEND_API_KEY` in local dev the email is logged instead; deployed, it is an error |
| `NormalizeEmail`, `IsValidEmail`, `ValidateInput`, `ValidateQueryLimit`, `IsValidTheme` | input handling |
| `GetClientBaseURL()`, `AllowedOrigins()` | the **client's** origin per `GetAppEnv()`, hardcoded in `clientURL.go`: `http://localhost:5173` locally, `https://optikii.netlify.app` deployed. Used in email links and as the CORS allow-list, which always includes `http://localhost:5173` and the client's Netlify previews (`https://*--optikii.netlify.app`, matched by `IsAllowedOrigin`, the `AllowOriginsFunc`) |
| `NewReasonError`, `DefaultErrorHandler`, `StatusCodeName`, `ListQueryError` | the error contract (§ 4) |
| `FetchPublicPage`, `ValidatePublicURL`, `PublicDialer` | **the only way to fetch a user-supplied URL**, its pre-flight check, and the dialer the render proxy shares (§ 11, `references/scans.md`) |
| `S3Configured`, `S3()` → `PutObject`, `DeleteObject`, `PresignGet` | the one S3 client, built once from env; signing is local (`references/attachments.md`) |
| `ResolvePageName(path)` | a client path's site visit page name from `data.SiteVisitPageNames`: exact match, then `:param` patterns, then `*` |
| `GeminiConfigured`, `Gemini()` → `Generate(ctx, GeminiRequest)`, `IsGeminiRateLimited` | the one Gemini client (`google.golang.org/genai`, as in GradeScript), built once from env, with retries on transient errors; used only by fix reports (`references/scans.md`) |
| `LookupIPGeolocation(ip)` | ip-api.com's JSON for a public IP; nil, with no request, for any other address (`references/site-visits.md`) |

Adding an email is three edits: a template in `templates/email/` supplying the `content` and `preheader` blocks the layout expects, a `subject…` constant in `email.go`, and a `Send…` method delegating to `renderAndSend`.

## 10. Environment and config

`.env` loads only in local development (`make run` sets `GO_ENV=development`). Every secret comes from the environment; never log a token, a code, a DSN or a key. The template is `server/.env.example`; on the server the values live in `~/optiki.env`.

**Every feature runs in both environments.** Never gate a feature on `GetAppEnv()` or `GO_ENV`. Only config may differ: the DSN, the port, the cookie flags, the client origin, and the console fallback for email without a Resend key. Local development runs without Docker, through the same code paths as production:
- Rendered scans use the installed Chrome or Chromium that `rendered.ChromePath()` finds (`CHROME_BIN`, else PATH). Only the image sets `CHROME_BIN`.
- Screenshots go to the same real S3 bucket as production, with its credentials in `.env`. Without them, scans are stored without screenshots.
- `.env.example` seeds two public demo accounts.
- `warnMissingFeatures` in `cmd/main.go` logs at boot whatever is missing (Chrome, S3, Resend).

A new optional service must work locally without Docker: real credentials in `.env`, or a graceful skip plus a line in `warnMissingFeatures`.

| Variable | Notes |
|---|---|
| `OPTIKI_DEV_DSN_LOCAL` / `OPTIKI_PROD_DSN` | DSN per `GetAppEnv()` |
| `JWT_SECRET` | ≥ 32 chars, or the server refuses to boot |
| `GIT_SHA` | reported by `/health`; baked into the image at build time (`--build-arg GIT_SHA`) |
| `CHROME_BIN`, `CHROMEDP_NO_SANDBOX` | set in the image (`/usr/bin/chromium`, `true`) for rendered scans; locally `CHROME_BIN` may stay empty and `rendered.ChromePath()` searches PATH |
| `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` | email |
| `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-3.8-flash`) | fix reports; without a key scans still work and get none, and `POST …/fix-report` answers 503 `FIX_REPORTS_UNAVAILABLE` |
| `S3_ACCESS_KEY_ID`, `S3_ACCESS_KEY`, `S3_BUCKET_NAME`, `AWS_REGION` (+ optional `S3_ENDPOINT`, `S3_USE_PATH_STYLE`) | scan screenshots, from the same real bucket locally and deployed; without them rendered scans are stored without one |
| `SEED_DEMO`, `DEMO_NAME`/`DEMO_EMAIL`/`DEMO_PASSWORD` (and `_2`) | verified accounts, created on boot if missing. The template seeds public local ones (`demo@example.com`); the server's are TestSprite's and private |

Ports: 8000 (local), 8001 (deployed).

## 11. Security rules

- **Ownership**: every list query filters on the caller (`"userID" = ?`); single-row handlers compare the owner and answer 404 for others. A token acts as its owner and sees exactly what the owner sees through the API.
- **Sessions** store the raw access and refresh JWTs. That is a deliberate simplification, so those columns never leave the server: `json:"-"` plus `sessionResponseData`. Revocation is a flag, checked on every `Auth`.
- **API tokens** store only `sha256(secret)`, verify in constant time, check the secret before revealing revoked/expired, and carry only the grantable `:own` permissions (`references/api-tokens.md`).
- **User-supplied URLs** go through `pkg.FetchPublicPage` only, and **rendered scans route every Chrome request through the in-process proxy** that dials with the same `PublicDialer`:
  - http/https on 80/443 only
  - public addresses only, re-checked on the dialed IP
  - every redirect re-validated, at most 3
  - size and time budgets
  - Blocked → `NewReasonError(400, "SSRF_BLOCKED", …)`. `references/scans.md` has the full rules and the Chrome flags.
- **Never render user HTML.** Scan input is parsed by the engine and only ever returned as escaped snippets, and raw HTML is never stored.
- **Attachments are private.** The bucket has no public access; clients only get 30-minute presigned URLs, signed on each read and never stored. Deleting a scan deletes its screenshot object.
- **Gym pages are served sandboxed** (`Content-Security-Policy: sandbox …`): they run on the API's origin, so they get an opaque origin and no network.
- **No file uploads, no multipart.** Scan input is JSON (`html`, `url`, or `gym`).
- **OTPs**: single use, expire, and burn after `RESET_PASSWORD_OTP_MAX_ATTEMPTS` wrong guesses. Forgot-password never reveals whether an account exists. A password reset revokes every other session.
- **No secrets in the repo** — only `.env.example`.
- **Fail closed.** Any gate (the future optikí GitHub Action, CI scripts) exits non-zero on errors; a missing score is never a pass.

## 12. Tests

**Only the deterministic core and the security boundaries get Go tests:**

- `engine/` (rules, golden reports, invariants — `make golden` rewrites the goldens)
- `snapshot/` (the rendered tests drive local Chrome against the Gym pages and skip without it; `snapshot/links` is the multiple-page scan's link discovery)
- `pkg/fetchPublicPage` and `pkg/publicDialer`
- `pkg/apiToken`
- `pkg/isAllowedOrigin` (the credentialed CORS allow-list)

CRUD handlers ship without Go tests; they are covered by the TestSprite API suite (see the `testsprite` skill). Don't add test files elsewhere unless asked.

- Unit tests sit next to the code as `<file>_test.go`, need no database, and run with `make test` (`go test -race ./internal/...`).
- Engine tests are table-driven over the Gym fixtures plus golden reports — the engine skill has the recipe.

## 13. Container and deployment

- One backend-only image (root `Dockerfile`):
  - `golang:1.26-bookworm` builds `optiki-server`.
  - `debian:bookworm-slim` runs it as user `optiki`, with `curl` and Chromium (`CHROME_BIN=/usr/bin/chromium`, `CHROMEDP_NO_SANDBOX=true`) for rendered scans.
  - The client is not in the image; it deploys to Netlify. `GIT_SHA` is a build arg baked into the image.
- Production runs on the Contabo server shared with tuliime-backend and content-agent, as the `optiki-backend` service of their Docker Swarm stack `app-stack`.
  - **The service is defined in tuliime-backend's `docker-compose.yaml`, not in this repo.**
  - Image `tibzdankan/optiki-backend:latest`; limits 2 CPUs / 3 GB (reservations 0.5 / 768M).
  - tuliime's Traefik routes `optikiapi.tuliime.com` to port 8001.
  - Healthcheck: `curl` on `/health`. Port 8001 is not published on the host (§ 8). Only Traefik's 80/443 are, and no service in the stack publishes any other port.
  - The database is external (`OPTIKI_PROD_DSN`).
- Container env comes from `~/optiki.env` (template `server/.env.example`), copied to `~/app/optiki/.env` (the service's `env_file`) by `scripts/optiki-deploy.sh` and by tuliime's `deploy.sh`.
- CI (`.github/workflows/contabo-deploy.yaml`, on push to `main`):
  - Builds and pushes `tibzdankan/optiki-backend:<sha>` and `:latest` to Docker Hub, then runs `optiki-deploy.sh` over SSH.
  - The script runs `docker stack deploy app-stack` with the compose file's tag (`:latest`). It waits until the service is `1/1` and `https://optikiapi.tuliime.com/health` answers through Traefik on the server's loopback (`curl --resolve …:443:127.0.0.1`).
  - It does not compare `/health`'s `commit` with the pushed SHA.
- The client deploys to Netlify separately (`netlify-deploy.yaml`, on push to `main`).
- **On a PR to `main`, `ci-previews.yaml` runs instead.** It runs the same build and deploy jobs (pushing `:<sha>` and `:latest`), then deploys the client preview. The PR's code, including its AutoMigrate, is live in production until the next deploy.
- **A new endpoint updates `internal/assets/openapi.yaml`** in the same PR — TestSprite's API mode reads it from `/api/v1/openapi.yaml`. Document `/client/v1` routes under a `bearerAuth` security scheme.

## 14. Anti-patterns

- Business logic in `routes.go`; a second DB connection; `panic` in a request path.
- `BodyParser` into a `models.*` struct instead of an `Input` struct.
- Serialising any model directly instead of an explicit field map; a session token, `tokenHash` or OTP hash in a response.
- **A destructive change shipped without its manual migration** (removing a field from a struct, a rename, a retype), or a new `NOT NULL` column without a default.
- **`db.Save` on an existing row**; a once-only state change without a conditional update.
- Fetching a user-supplied URL with anything but `pkg.FetchPublicPage`; launching Chrome without the proxy; rendering or storing user HTML; multipart endpoints.
- Storing a presigned or permanent S3 URL; a public bucket; failing a scan because the screenshot upload failed; a second S3 client.
- Deciding the rule set inside the engine, or anywhere but `resolveScanCaller`.
- A second copy of a handler for `/client/v1` when the behaviour matches `/api/v1`.
- A token route without `RequirePermission`; a token that can manage tokens; a permission outside `data.APITokenPermissions`.
- A `message` key on a read response, or a read-many response missing `pagination`; paginating with `limit` instead of `limit+1`; clamping a bad `limit`.
- Unquoted camelCase columns in raw SQL; a GORM struct declared anywhere but `schema.go`.
- `errors.New(constants.ErrNotPermitted)` instead of the `ErrNotPermittedError` sentinel; a 5xx for something the user must act on.
- Secrets, tokens, codes, DSNs, submitted HTML or full URLs with query strings in logs; publishing a container port to the internet.
- A test file outside `engine/`, `snapshot/`, `pkg/fetchPublicPage`, `pkg/publicDialer`, `pkg/apiToken` and `pkg/isAllowedOrigin`.
- A JSDoc-style or multi-paragraph comment explaining what a handler does.

## 15. Before you call it done

- [ ] Route registered in `routes.go`, correct group and surface, middleware in the documented order
- [ ] Handler file named for its one exported symbol, `<Name>Input` struct declared; one handler serves both surfaces where behaviour matches
- [ ] Model struct in `schema.go`; added to `AutoMigrate`; owner filters on every user-data query
- [ ] Migration is additive, or its manual SQL is written, run locally, and in the PR description
- [ ] Raw SQL fragments quote their camelCase columns; no `db.Save` on existing rows
- [ ] Every failure path returns an error; user-actionable messages are 4xx; reasons the client branches on use `NewReasonError` and are mirrored in the client
- [ ] Response envelope matches the verb; everything goes through an explicit field map
- [ ] `openapi.yaml` updated; a TestSprite API scenario covers the endpoint (testsprite skill)
- [ ] `gofmt -l .` empty, `go vet ./...` and `go build ./...` pass, `make test` passes
- [ ] `make run` boots and logs `Auto Migration successful`
