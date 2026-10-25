# Scans

A scan is one page, one input, one rule set and one stored report. The engine decides findings and scores (engine skill). This file covers everything around it: who may scan, what they get, how a scan is fetched or rendered, how it is stored, and how it is read back. Table definitions are in `data-model.md`.

## Who gets what

The handler decides the rule set and mode from the caller. The engine never sees who is asking.

| Caller | How the server knows | Rule set | URL input | HTML / Gym input | Stored as |
|---|---|---|---|---|---|
| Anonymous | no valid session, **or** a session whose user hasn't verified their email | `CORE`: the 9 P0 rules | `STATIC`: fetched with `pkg.FetchPublicPage` | `STATIC` | `userID NULL`, `triggeredBy ANONYMOUS`, `visibility PUBLIC` |
| Verified user | valid session cookie, `emailVerified` | `FULL`: all 17 rules | `RENDERED` in the server's Chromium | `STATIC`; OPT-204/301/302 come back `NEEDS_RENDERED` | owner, `triggeredBy USER`, `PRIVATE` |
| API token | `Authorization: Bearer opt_…` with `scan:create:own` | `FULL` | `RENDERED` | `STATIC` | token owner + `apiTokenID`, `triggeredBy API_TOKEN`, `PRIVATE` |

- `CORE` is the 9 must-have rules (101, 102, 103, 104, 106, 201, 202, 203, 401). `FULL` adds the 8 optional ones (105, 205, 402, 403, 107 and the rendered-only 204, 301, 302).
- Anonymous scans are `PUBLIC` because nobody owns them. Their unguessable UUID is the share link.
- Signed-in scans start `PRIVATE`; the owner shares one by setting `visibility: PUBLIC`.
- An unverified user scans exactly like an anonymous visitor, and the scan is not attached to their account.
- The report always states `ruleSet` and `mode`. The client shows a banner on `CORE` results ("9 core rules — sign in to run all 17") and on static scans of client-rendered pages.

`handlers/scan/resolveScanCaller.go` holds that decision in one place:

```go
type scanCaller struct {
	userID      *string
	apiTokenID  *string
	triggeredBy string // ANONYMOUS, USER, API_TOKEN
	ruleSet     string // CORE, FULL
	visibility  string // PUBLIC, PRIVATE
	canRender   bool
}
```

It reads locals only:

- `apiToken` (set by `AuthAPI`) → token caller.
- Else `user` (set by `OptionalAuth`) with `EmailVerified` → verified user.
- Otherwise → anonymous.

## Endpoints

One handler per endpoint, registered on both surfaces where the behaviour is the same (backend SKILL.md § 3).

| Method · path | Middleware | Handler | Notes |
|---|---|---|---|
| `POST /api/v1/scan` | `OptionalAuth → ScanRateLimit` | `CreateScan` | anyone |
| `GET /api/v1/scan` | `Auth → VerifiedEmail` | `GetScans` | the caller's scans |
| `GET /api/v1/scan/:id` | `OptionalAuth` | `GetScan` | `PUBLIC` scans, or the caller's own; else 404 |
| `PATCH /api/v1/scan/:id` | `Auth → VerifiedEmail` | `UpdateScan` | owner only |
| `DELETE /api/v1/scan/:id` | `Auth → VerifiedEmail` | `DeleteScan` | owner only |
| `POST /client/v1/scan` | `AuthAPI → RequirePermission(scan:create:own) → ScanRateLimit` | `CreateScan` | accepts the CI fields |
| `GET /client/v1/scan` | `AuthAPI → RequirePermission(scan:view:own)` | `GetScans` | the token owner's scans |
| `GET /client/v1/scan/:id` | `AuthAPI → RequirePermission(scan:view:own)` | `GetScan` | the owner's only, even if `PUBLIC` |
| `PATCH /client/v1/scan/:id` | `AuthAPI → RequirePermission(scan:edit:own)` | `UpdateScan` | |
| `DELETE /client/v1/scan/:id` | `AuthAPI → RequirePermission(scan:delete:own)` | `DeleteScan` | |

`ScanRateLimit` runs **after** the auth middleware because it keys on the caller.

## Create

```go
type CreateScanInput struct {
	HTML      *string `json:"html"`
	URL       *string `json:"url"`
	Gym       *string `json:"gym"`
	Route     *string `json:"route"`
	Title     *string `json:"title"`

	Repository *string `json:"repository"`
	Branch     *string `json:"branch"`
	CommitSHA  *string `json:"commitSHA"`
	PRNumber   *int    `json:"prNumber"`
	RunURL     *string `json:"runURL"`
}
```

Validation, in this order. The first failure wins, and none of these create a row.

| Check | Response |
|---|---|
| `Content-Type` isn't `application/json` | 415 |
| Body doesn't parse | 400 |
| Not exactly one of `html`, `url`, `gym` | 400 "Provide exactly one of html, url or gym" |
| `html` over 2 MB (`MAX_SCAN_HTML_BYTES`) | 413 `TOO_LARGE` |
| `html` empty after trimming | 400 |
| `url` not absolute `http`/`https` | 400 |
| `gym` not a known page id (`gym.Page(id)`) | 400 |
| `route` not starting with `/`, or over 512 characters | 400. When omitted, the default is the URL's path for URL scans, `/gym/pages/<id>.html` for Gym, and `/` for HTML |
| `title` over 120 characters | 400 |
| Any CI field on the browser API (no `apiToken` local) | 400 "Only API tokens can set CI fields" |
| `commitSHA` not 7–64 hex characters, `repository` not `owner/name`, `prNumber` < 1 | 400 |
| URL with a non-web scheme (`file:`, `ftp:`, `gopher:`) | 400 `SSRF_BLOCKED` "This address isn't allowed" |
| URL fails the pre-flight (port/resolve to a public address) | 400 `SSRF_BLOCKED`; an unresolvable host is a plain 400 |

The pipeline (`handlers/scan/runScan.go`, unexported, shared by both surfaces):

1. **Insert** the scan as `RUNNING`, with ownership, input fields, `mode`, `ruleSet`, `engineVersion`, `rulesetHash` and `startedAt`.
2. **Snapshot**:
   - `html` → `snapshot/static.Build(html)`
   - `gym` → the embedded page → static
   - `url`, static → `pkg.FetchPublicPage(url)` → static (`fetchMs`)
   - `url`, rendered → `snapshot/rendered.Build(ctx, url)` (`renderMs`)
   - Record `finalURL`, `httpStatus`, `contentType`, `redirectCount`, `inputSha256`, `inputBytes`.
3. **Analyse**: `engine.Scan(snapshot, rules.Set(ruleSet))` (`analyzeMs`).
4. **Screenshot** (rendered scans only): upload it to S3 as `scan-screenshots/<scanID>.jpg` (`references/attachments.md`). Missing S3 config or an upload error only means no screenshot.
5. **Persist in one transaction**:
   - Update the scan with scores, counts, `pageTitle`, `pageLang`, `nodeCount`, `controlCount`, `reportHash`, `status = COMPLETED`, `completedAt` and `durationMs`.
   - Insert one `ScanRuleResult` per rule in the set.
   - Insert the findings in report order, at most `MAX_FINDINGS_PER_SCAN` (500); past the cap, set `findingsTruncated`.
   - Use `CreateInBatches` (100).
   - Insert the screenshot's `Attachment` row and set `screenshotAttachmentID`. If the transaction fails, delete the uploaded object.
6. **On any failure after step 1**, update the row to `FAILED` with `errorCode`, `errorMessage` and `completedAt`, then return the reason error. A busy renderer is the exception: its `RUNNING` row is deleted, because the scan never started.

| Failure | `errorCode` / response |
|---|---|
| Fetch or render exceeded its budget | 422 `FETCH_TIMEOUT` / `RENDER_TIMEOUT` |
| Response isn't `text/html` | 422 `NOT_HTML` |
| Body over 2 MB | 413 `TOO_LARGE` |
| A redirect leads to a blocked address | 400 `SSRF_BLOCKED` |
| No render slot within 10 s | 429 `RENDERER_BUSY` with `Retry-After` |
| Anything else (engine panic recovered, DB error) | 500; `errorCode = INTERNAL` on the row |

Timeouts are 422, not 504, because a 5xx loses its reason code and message (backend SKILL.md § 4). The target being slow is something the user must act on.

Success is **201** with the full report (below) and the message `"Scan completed"`.

## Read one

`GET /scan/:id`: a malformed id is a 400 (`uuid.Validate`); otherwise `FindOne` loads the scan with its rule results and findings. Visibility rules:

- **Browser API**: return it if `visibility = PUBLIC`, or if `userID` equals the caller's. Otherwise **404**, the same answer as a missing scan.
- **Token API**: return it only if `userID` equals the token owner's.

The response carries the scan, its rule results and its findings in `position` order:

```json
{
  "status": "success",
  "data": {
    "id": "…", "title": null, "visibility": "PRIVATE", "status": "COMPLETED",
    "triggeredBy": "USER", "inputType": "URL", "mode": "RENDERED", "ruleSet": "FULL",
    "isOwner": true,
    "target": { "url": "https://example.com/pricing", "finalURL": "https://example.com/pricing",
                "gymPageID": null, "route": "/pricing", "httpStatus": 200,
                "pageTitle": "Pricing", "pageLang": "en" },
    "scores": { "overall": 82, "operable": 70, "perceivable": 100, "stable": 85, "discoverable": 100 },
    "counts": { "findings": 4, "critical": 1, "serious": 2, "moderate": 1, "minor": 0,
                "rulesPassed": 13, "rulesFailed": 3, "rulesNotApplicable": 1, "rulesNeedRendered": 0,
                "findingsTruncated": false },
    "engine": { "engineVersion": "0.1.0", "rulesetHash": "…", "reportHash": "…" },
    "ci": { "repository": null, "branch": null, "commitSHA": null, "prNumber": null, "runURL": null },
    "timing": { "startedAt": "…", "completedAt": "…", "durationMs": 3920, "fetchMs": null, "renderMs": 3480, "analyzeMs": 21 },
    "error": null,
    "screenshot": { "id": "…", "url": "https://…/scan-screenshots/<id>.jpg?X-Amz-Expires=1800&…", "expiresAt": "…",
                    "contentType": "image/jpeg", "size": 60138, "width": 1280, "height": 800 },
    "rules": [
      { "ruleID": "OPT-101", "name": "Hidden control", "category": "OPERABLE", "priority": "P0",
        "severity": "CRITICAL", "weight": 10, "result": "FAIL", "findingsCount": 1 }
    ],
    "findings": [
      { "id": "…", "ruleID": "OPT-101", "category": "OPERABLE", "severity": "CRITICAL",
        "fingerprint": "…", "selectorPath": "#ring > svg > g:nth-of-type(2) > button",
        "tag": "button", "role": "button", "accessibleName": "Seek to iteration 2",
        "nameFrom": "CONTENT", "snippet": "<button class=\"arc\">Seek to iteration 2</button>",
        "message": "This button sits inside role=\"img\", so agents can't see or press it.",
        "evidence": { "hiddenBy": "ROLE_IMG", "hidingAncestorPath": "#ring > svg" } }
    ],
    "createdAt": "…", "updatedAt": "…"
  }
}
```

- The rule `name` comes from the live catalog; everything else comes from the stored rows.
- `isOwner` lets the client show edit controls without comparing ids itself.
- Build the map in `handlers/scan/scanResponseData.go` (`scanSummaryData`, `scanReportData`), never by serialising the model.
- A `FAILED` scan has `scores` all null, empty `rules`/`findings`, and `error: {code, message}`.

## Read many

`GET /scan` follows the `getActiveSessions.go` recipe (`limit+1`, a `createdAt` cursor, the four `pagination` keys). The query is always `"userID" = <caller>`.

- Filters (all optional, all validated): `status`, `inputType`, `triggeredBy`, `commitSHA`, `prNumber` (`projectID` once projects land). An unknown enum value or an unknown cursor is a 400.
- Items are `scanSummaryData`: the report without `rules` and `findings`, each with a freshly signed `screenshot`.

## Update and delete

```go
type UpdateScanInput struct {
	Title      *string `json:"title"`
	Visibility *string `json:"visibility"`
}
```

- Owner only; anything else is 404.
- Only the provided fields change, through `Model(&Scan{}).Where("id = ?", id).Updates(map…)`.
- `visibility` is `PRIVATE` or `PUBLIC`.
- Findings and scores are immutable: re-running means a new scan.
- `DELETE` removes the scan and its screenshot row (rule results and findings cascade), then deletes the screenshot object. It returns 200 with a message.
- Anonymous scans can't be edited or deleted by anyone through the API.

## Rate limits and render slots

`middlewares/scanRateLimit.go` reuses the in-memory `rateLimiter` from `rateLimit.go`, with its own instances:

| Key | Limit |
|---|---|
| Anonymous, per IP | `SCAN_RATE_LIMIT_ANONYMOUS` 30 per 10 min, and URL scans 5 per minute |
| Verified user, per `userID` | 60 per 10 min |
| Token, per `apiTokenID` | 60 per 10 min |

- It sets `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and on 429 `Retry-After`. `cmd/main.go` already exposes those headers through CORS.
- Rendering is also capped by a process-wide semaphore of `MAX_CONCURRENT_RENDERS` (2), to fit the service's 2-CPU limit. A request waits up to `RENDER_SLOT_WAIT` (10 s), then returns 429 `RENDERER_BUSY`.

## Fetching a URL (static mode)

`pkg.FetchPublicPage(ctx, rawURL)` is **the only way the server fetches a user-supplied URL**. Its rules:

- `http`/`https` only, ports 80 and 443.
- Resolve the host, and reject unless every address is public. That excludes loopback, private, link-local (including `169.254.169.254`), CGNAT `100.64/10`, multicast, unspecified, IPv6 ULA and link-local, and IPv4-mapped forms of any of those. Decimal and octal host spellings (`2130706433`) resolve and are then rejected.
- `pkg/publicDialer.go` re-checks the **dialed** IP in `net.Dialer.Control`, which defeats DNS rebinding. The same dialer is used by the render proxy.
- At most 3 redirects, each one re-validated.
- 8 s total timeout, 2 MB body cap, `text/html` only.
- A fixed `User-Agent: optiki-scanner/<engineVersion> (+https://optikii.netlify.app)`.

`GET /gym/redirect-private` answers 302 to `http://127.0.0.1/` so tests can prove redirects are re-validated. Its target is fixed, so it isn't an open redirect.

## Rendering a URL (rendered mode)

`internal/snapshot/rendered` drives the Chromium in the image (`CHROME_BIN`, `CHROMEDP_NO_SANDBOX`). The engine skill's `references/rendered-snapshot.md` covers what is collected. This section covers keeping it safe and bounded:

- **One browser for the process** (`snapshot/rendered/browser.go`, a `Renderer`), started lazily, restarted if it dies. Each scan gets its **own browser context** (incognito: no cookies, storage or cache shared between scans or users) and closes it afterwards.
- **Every request Chrome makes goes through an in-process forward proxy** (`snapshot/rendered/proxy.go`) on `127.0.0.1:<random port>`. That covers the document, subresources, redirects, fetch/XHR and WebSockets.
  - The proxy handles plain HTTP and `CONNECT`, allows only ports 80/443, and dials through `pkg.PublicDialer()`. A refused request gets a 403 with `X-Optiki-Blocked`; a blocked main document becomes `SSRF_BLOCKED`.
  - So the private-address rule covers everything the page loads, not just the first URL, and rebinding can't slip past Chrome's own resolver.
  - Launch flags:
    - `--proxy-server=http://127.0.0.1:<port>`, plus `--proxy-bypass-list=<-loopback>` so loopback is proxied (and refused) too
    - `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`
    - `--disable-extensions` · `--disable-background-networking` · `--disable-dev-shm-usage` · `--no-first-run` · `--headless=new`
- The target URL goes through `FetchPublicPage`'s pre-flight check first. A blocked target then gets a clean `SSRF_BLOCKED` before Chrome starts. A blocked subresource just fails to load, and the scan continues.
- **Budgets**:
  - 15 s per scan in total, with an 8 s navigation timeout.
  - Each proxied connection stops after 10 MB (`RENDER_MAX_BYTES_PER_CONNECTION`). One proxy serves every render, so there is no per-scan byte count; the 15 s budget bounds the rest.
  - Viewport 1280×800, recorded on the scan.
  - `alert`/`confirm`/`prompt` are replaced in-page by recorders before any page script runs (OPT-107). Any native dialog that still opens is dismissed through CDP.
  - A full-page JPEG screenshot is taken last (1280 wide, height capped at 6,000 px).
- The rendered DOM is serialised once to compute `inputSha256`/`inputBytes`. It is never stored.

## Files

```
handlers/scan/
  createScan.go  getScans.go  getScan.go  updateScan.go  deleteScan.go
  resolveScanCaller.go  runScan.go  scanResponseData.go  signScreenshots.go  validateScanInput.go
models/scan.go                 Create, FindOne (rule results + findings + screenshot), FindAllByUser(filters, limit, cursor),
                               UpdateDetails, Delete (returns the screenshot), DeleteRunning, Complete — one
                               transaction — and Fail(code, message)
models/attachment.go           BeforeCreate; rows are created inside Scan.Complete
middlewares/optionalAuth.go    session lookup like Auth, never rejects
middlewares/scanRateLimit.go
pkg/fetchPublicPage.go  pkg/publicDialer.go   (+ _test.go each)
pkg/s3.go
snapshot/static/  snapshot/rendered/  (browser.go, build.go, proxy.go + tests)
constants: MAX_SCAN_HTML_BYTES, MAX_FINDINGS_PER_SCAN, MAX_SNIPPET_LENGTH, SCAN_RATE_LIMIT_*,
           MAX_CONCURRENT_RENDERS, RENDER_SLOT_WAIT, RENDER_TIMEOUT, FETCH_TIMEOUT, SCAN_* enum values
errors:    ErrReasonSSRFBlocked, ErrReasonNotHTML, ErrReasonTooLarge, ErrReasonFetchTimeout,
           ErrReasonRenderTimeout, ErrReasonRendererBusy
```

## Gotchas

- `OptionalAuth` must do the full session lookup, as `Auth` does. `SetUserInRequest` only decodes the JWT, so a revoked session would still look signed in. Factor the shared lookup into one unexported helper in `middlewares/`.
- Never return the stored snippet inside HTML or `dangerouslySetInnerHTML`. It is user-controlled markup.
- Never log submitted HTML or full URLs with query strings. Log the scan id.
- A scan that fails validation creates no row, so failed-validation attempts never appear in a user's history.
