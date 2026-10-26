# Site visits

The client records a site visit on every client-side navigation. The server stores the page name, the path, the browser's anonymous ID and, when there is one, the signed-in user. It also stores a device row and an IP location. After a session starts, `anony-reconcile` gives that browser's earlier anonymous visits, and its guest scans, to the user.

The design is ported from gradescript's `handlers/sitevisit/postSiteVisit.go`, `handlers/auth/reconcileAnonymousUser.go`, `models/{siteVisit,device,location,anonymousUserLink}.go` and `pkg/resolvePageName.go`. **Only the capture side is ported: there are no read endpoints.** Inspect visits in the database. Its known bugs are fixed; see the last section.

## Where the pieces live

| Piece | File |
|---|---|
| Tables | `models/schema.go` → `Device`, `Location`, `SiteVisit`, `AnonymousUserLink` (full structs in `references/data-model.md`) |
| Capture | `handlers/sitevisit/postSiteVisit.go`, behind `OptionalAuth` → `SiteVisitRateLimit` |
| Page names | `data/siteVisitPageNames.go` + `pkg/resolvePageName.go` |
| Device | `models/device.go` → `FindOrCreate(userID, name)` |
| Location | `models/location.go` → `GetOrCreateByIP(ip)`, which calls `pkg/lookupIPGeolocation.go` |
| Reconcile | `handlers/auth/reconcileAnonymousUser.go` → `models.AnonymousUserLink.Link` |
| Client | `client/src/hooks/use-capture-page-visit.ts`, `stores/anonymous.ts`, `utils/reconcile-anonymous-user.ts` (frontend skill, "Site visits") |

## `POST /api/v1/sitevisit`

Body: `{ path, capturedAt, anonymousID, device }`. All of it comes from the client, so all of it is validated:

| Field | Rule | Failure |
|---|---|---|
| `path` | starts with `/`, at most `MAX_SITE_VISIT_PATH_LENGTH` (512) | 400 |
| `capturedAt` | RFC 3339 (`toISOString()` output, fractional seconds allowed) | 400 |
| `anonymousID` | a UUID | 400 |
| `device` | trimmed, cut to 64 runes, `Unknown` when empty | — |

Then:

1. **The owner is `user` from `OptionalAuth`**, a real session lookup. It is not the bare JWT decode in `SetUserInRequest`, so a revoked session doesn't attribute visits.
2. **`page = pkg.ResolvePageName(path)`.** The server owns the page-name table. The client sends no page name, so there is no second table to keep in sync and no boot backfill. A route missing from `SiteVisitPageNames` is recorded as `Page Not Found`, so **every new client route adds an entry there**.
3. **The device** is found or created by `(userID, name)`. Anonymous visits share one `userID NULL` row per name.
4. **The location** is found by the `ip` column. If there is none, `LookupIPGeolocation` runs:
   - It parses the IP first, so a spoofed `X-Real-IP` can't inject into the URL.
   - It skips anything `pkg.IsPublicIP` rejects. Local development (`127.0.0.1`, `::1`) never calls out.
   - It calls `http://ip-api.com/json/<ip>` with a 5 s timeout (`IP_GEOLOCATION_TIMEOUT`), reads at most 64 KB, and keeps the body only on HTTP 200 with `"status":"success"`.
   - The free tier is HTTP-only, non-commercial, and allows 45 requests a minute. Each IP is looked up until it succeeds once, and then it is cached in `locations`.
5. A device or location failure is **logged and the visit is saved anyway**, since both FKs are nullable. A failed lookup is retried on that IP's next visit.
6. The response is 201 `{status, message, data: {id, page, path, capturedAt}}`.

The client fires and forgets: it never shows a capture error, and a 429 or 404 is silent.

**The X-Real-IP caveat** (SKILL.md § 8 TODO): while Traefik passes a client-sent `X-Real-IP` through, a caller can pick its own IP. That defeats the per-IP rate limit, and fresh IPs force ip-api lookups. The worst case is that ip-api throttles the server's IP for a while; visits still save without a location.

## `POST /api/v1/auth/user/:id/anony-reconcile`

`Auth` only, without `VerifiedEmail`: sign-up reconciles while the user is still unverified. Body: `{ anonymousID }`.

| Case | Answer |
|---|---|
| `:id` isn't the session's user | 403 |
| `anonymousID` isn't a UUID | 400 |
| The ID is already linked to this user | 200, `linkedVisits: 0`, and still claims any new scans (`linkedScans`) |
| The ID is linked to another user | 409 `ErrAnonymousIDLinkedElsewhere` |
| Otherwise | 201, `{anonymousID, userID, linkedVisits, linkedScans}` |

`Link` runs in one transaction. It inserts the link (`ON CONFLICT DO NOTHING`), then sets `userID` and `linkedAt` on that ID's visits **where `"userID" IS NULL`**, so visits that already have an owner never move. If a concurrent request linked the ID first, the insert affects no row, nothing is updated, and the handler compares the stored link's owner (200 or 409).

In both the 200 and 201 cases the handler then runs `Scan.ClaimAnonymous`: that ID's unowned scans get the user and become `PRIVATE` (`references/scans.md`). The 409 case claims nothing, so the one-owner-per-ID rule also protects scans.

The client calls it after sign-up, sign-in, reset-password, email verification (signed in) and every session refresh. Sign-out clears the browser's anonymous ID, so later anonymous browsing gets a fresh ID that nobody owns.

## What changed from gradescript, and why

| gradescript | optikí |
|---|---|
| Reconcile never checks whose `:id` it is: any signed-in user can claim visits for any user | `:id` must be the session's user (403) |
| Reconcile indexes `updatedSiteVisits[0]`, which panics when no visit matches | returns a count |
| Reconcile re-points visits that already have an owner, and never sets `linkedAt` | only `"userID" IS NULL` rows, and `linkedAt` is set |
| An anonymous ID linked to another user hits the unique index → 500 | 409 |
| Each anonymous visit `db.Create`s an empty device (name `UNKNOWN`) | find-or-create by `(userID, name)` with quoted `Where` strings |
| `http.Get` to ip-api with no timeout, inside the model | `pkg.LookupIPGeolocation`: parsed IP, public only, timeout, body cap, `status` check |
| Locations matched on `info->>'query'` with a GIN index; `Location.userID` set by whoever came first | a unique `ip` column; no owner on a location |
| A failed lookup leaves `locationID` empty under `NOT NULL`, so the insert fails and the visit is lost | nullable `deviceID`/`locationID`; the visit always saves |
| BodyParser errors are 500 | 400 |
| `X-Device`/`X-Anonymous-ID` headers on every request (needs a CORS change) | both in the site-visit body only; CORS untouched |
| Page names kept on both client and server, plus a boot backfill | server-only table; no backfill |
| `clientApp` (`WEB`/`CONSOLE`) column and an activity-log stream entry per signed-in visit | dropped: one client app, no Redis |
| No rate limit on an unauthenticated write | `SiteVisitRateLimit` |

## Testing

- No Go tests: handlers and models are outside the test allowlist (SKILL.md § 12).
- Verified locally on 2026-10-25 with curl, and with headless Chromium against a Vite dev server:
  - page names, including `:param` routes and a trailing `/`
  - each 400, and 429 on the 61st request in a minute
  - one location row for `8.8.8.8`, reused afterwards, and none for loopback
  - reconcile's 201, 200, 403, 409 and 401
  - the anonymous ID persists across reloads, sign-in links earlier visits, and sign-out clears the ID
- TestSprite: A17 in the testsprite skill's suite map.
