# optikí: see your app the way an AI agent does

> Working spec for **TestSprite Hackathon Season 4**, "One week. One loop. Every PR." This is idea 9 ("Agent Lighthouse") from `S3-winners-analysis-and-S4-ideas.md`, renamed.
> Submissions close **Mon Oct 26, 11:59 PM PT** (extended from Thu Oct 22). Stack: Go + React/TypeScript. Builder: solo. Last revised Sat Oct 24.

## Context

- **The problem.** AI agents act on a page through its accessibility tree. That includes TestSprite's cloud test runner, browser agents and assistive tech. When a control is hidden, unnamed, masked or ambiguous, the agent can't act on it. The test run then comes back `blocked` or `failed` even though the app works for people with a mouse.
  - The S3 winners hit this again and again. Ouroboros wrote 8 lessons about it (L1–L8). Timeora rebuilt its calendar's DOM contract. Nora rewrote ambiguous plans and lost runs to "agent ran out of runway".
- **What optikí does.** It scans pages for agent-legibility problems, scores them in four categories, and shows the exact fix. Anyone can scan from the browser. Signed-in users and API tokens get the full rule set and real-browser rendering. An API token lets CI scan every pull request, so a change that makes the app harder for agents is caught before merge.
- **Name.** *optikí* comes from Greek οπτική, "optics; point of view". The display name is **optikí**. Use **`optiki`** (ASCII) for the repo, Go module, domain and file names.
- **Decisions made:**
  - A legibility scanner with a hosted engine: static scans for everyone; rendered scans (Chromium on the server) for verified users and API tokens. There is no CLI.
  - Hosting:
    - The API is on the shared Contabo server: a Docker Swarm service behind tuliime's Traefik, at `https://optikiapi.tuliime.com`.
    - The client is on Netlify, at `https://optikii.netlify.app`.
    - One production Postgres database.
    - **Per-PR client previews** at `https://deploy-preview-<PR number>--optikii.netlify.app` (Netlify draft deploys from `ci-previews.yaml`, which first deploys the PR's server to production). They talk to the production API.
  - API tokens belong to users and carry gradescript-style permissions. Projects are optional groupings of scans.
  - The repo structure follows the gradescript project (`client/` + `server/`); §17 lists where optikí departs from it.
  - Accounts use email + password, email verification, and password reset by emailed code.

---

## 1. Pitch

**One line:** optikí tells you whether your app just got harder for AI agents to use, and how to fix it, on every PR.

**Positioning against Google Lighthouse's Agentic Browsing category** (Chrome 150, June 2026). Judges may know it, so say this plainly in the README.

| | Google Lighthouse, Agentic Browsing | optikí |
|---|---|---|
| Scope (per its docs) | One page load: a subset of accessibility audits (names/labels, tree integrity, interactive content hidden from the tree), layout shift (CLS), `llms.txt`, WebMCP tools and schemas | Any page, from the browser or from CI with an API token |
| Output | Informational pass ratio; "experimental", "unbenchmarked" | 0–100 score per category plus overall, with element-level findings and before/after fixes, stored and shareable |
| Focus | Standards readiness (WebMCP, `llms.txt`) | Failure modes logged in real AI test runs: same-name controls with different actions, clickable things that aren't controls, `aria-label` masking visible text, content carried only by SVG/canvas, controls that only appear after an entrance animation, text too small for screenshot-reading agents |
| Workflow | Run it and read it | **PR-native:** CI scans each PR with an API token; base vs head compare by finding fingerprint (the GitHub Action comes after the core features) |

**Use both:** Lighthouse for WebMCP/`llms.txt`, optikí for flow-breaking legibility problems and PR gating. Don't claim optikí covers what it hasn't measured.

**How it scores on the S4 rubric**

- **Project quality (40):** a polished, instantly understandable tool.
  - Paste HTML or a URL, or pick a demo page, and get a scored report in seconds — no account needed.
  - The Gym (intentionally broken vs. fixed pages) makes every rule tangible.
- **Tests that run themselves (40):**
  - The engine is deterministic, so assertions are exact (rule IDs, counts, scores).
  - There's a rich security surface to test: SSRF (including a rendered browser), rate limits, auth, token permissions, ownership.
- **Innovation (20):**
  - The rules are distilled from real agent-test failures.
  - Rule tiers by caller and a token API built for CI.
  - Dogfooding: optikí's own UI must pass optikí's rules.

---

## 2. Scope and cut lines

| Tier | What | Why it's in this tier |
|---|---|---|
| **Done** | Accounts: sign-up, sign-in, email verification, password reset by emailed code, sessions, theme. Deploys: the API to Contabo and the client to Netlify, from `main` | The pipeline and the auth surface exist before any feature |
| **Must** | Static engine + the 9 P0 rules (`CORE`) + scoring · scan storage and CRUD · playground (HTML / URL / Gym) open to anonymous users · report page + share links · scan history · rules catalog · Gym pages · SSRF-safe URL fetch + per-IP/user/token rate limits · API tokens with permissions + `/client/v1/scan` · TestSprite suite · README "What the suite covers" | The demo, the deep tests, and what CI needs |
| **Should** | Projects (dashboard and token API) · the 8 optional rules (`FULL`): static P1 105, 205, 402, 403 and P2 107; rendered-only 204, 301, 302 on server-side Chromium for verified users and tokens | Grouping and the complete rule set |
| **Later** | The optikí GitHub Action (scans each PR with an API token, sticky comment, fails closed) · base-vs-head compare and trend · README badge · `data-optiki-ignore` suppressions · calibration study · anonymous-scan retention | After the core is solid |

**Cut rule:** if behind on Sun Oct 25 evening, drop rendered rules before projects, and projects before tokens. Never cut tests, the README or token-scoped scanning.

---

## 3. Rule catalog (v1)

- **S** = works on static HTML. **R** = needs a rendered page (the server's Chromium).
- Severity weights: critical 10, serious 7, moderate 3, minor 1.
- **P0** is Must, **P1** is Should, **P2** is Could.
- *Baseline* rules overlap standard accessibility checkers. *Agent-failure* rules come from logged AI-test failures.

**Rule sets by caller.** The handler picks the set; the engine just runs it.

| Set | Rules | Who gets it |
|---|---|---|
| `CORE` | the 9 P0 rules | anonymous visitors (no session, or an unverified one) |
| `FULL` | all 17 | verified signed-in users and API tokens |

URL scans in `FULL` are rendered, so the 3 rendered-only rules apply. HTML and Gym input stay static, and those 3 show "needs rendered scan".

**Operable: can an agent act?**

| ID | Rule | Flags when… | Fix | Sev · Mode · P | Origin |
|---|---|---|---|---|---|
| OPT-101 | Hidden control | An interactive element is not exposed: it sits inside `aria-hidden="true"`, under `role="img"`/`presentation`, or under any role with presentational children | Remove the masking role; put real `<button>`s over the graphic | critical · S+R · P0 | Ouroboros L1 (baseline) |
| OPT-102 | Unnamed control | A button, link, field or menu item has no accessible name (icon-only, empty link) | Add visible text, `aria-label` or `<title>` | critical · S+R · P0 | Baseline |
| OPT-103 | Look-alike controls | 2 or more exposed controls share a role and a normalized name. In repeated rows (li/tr/article) it's *moderate*; otherwise *serious* | Make names distinct ("Delete invoice #42", "Seek to…" vs. "Open…") | serious · S+R · P0 | Ouroboros L5, Timeora (Confirm among 9 buttons) |
| OPT-104 | Clickable non-control | S: `on*=` handler or `tabindex` on a non-interactive element, or `<a>` without `href`. R: `cursor:pointer` on a non-interactive element with no role | Use `<button>`/`<a href>`, or give it a role + tabindex + keyboard handler | serious · S+R · P0 | Agent-failure |
| OPT-105 | Nested controls | A control is inside another control (button in link, link in button) | Un-nest; one control per action | moderate · S · P1 | Baseline |
| OPT-106 | Unlabeled field | A form field has no programmatic label; placeholder-only counts as unlabeled | `<label for>` or a wrapping `<label>` | serious · S+R · P0 | Baseline |
| OPT-107 | Native blocking dialog | `confirm()` / `alert()` / `prompt()` appears in an inline handler (S) or is called during the rendered load (R) | Use an in-page dialog with `role="dialog"` | moderate · S+R · P2 | Timeora #21 |

**Perceivable: can an agent read it?**

| ID | Rule | Flags when… | Fix | Sev · Mode · P | Origin |
|---|---|---|---|---|---|
| OPT-201 | Masked label | The accessible name (from `aria-label`/`labelledby`) doesn't contain the visible text (WCAG 2.5.3) | Drop the label, or include the visible words in it | serious · S+R · P0 | Ouroboros L7 (tripped twice) |
| OPT-202 | Content-only graphic | An SVG with `<text>`, or a `<canvas>`, carries information but is hidden or has no text equivalent | Add a `<title>`/`aria-label` or an adjacent screen-reader-only text block | serious · S+R · P0 | Ouroboros L8 |
| OPT-203 | Image without alt | `<img>` has no `alt` attribute (`alt=""` is fine for decoration) | Add `alt` | moderate · S+R · P0 | Baseline |
| OPT-204 | Tiny meaningful text | Text in controls, labels or headings renders below 12 CSS px | Raise the size so screenshots stay legible | moderate · R · P1 | Ouroboros L4 |
| OPT-205 | Broken references | `aria-labelledby`/`describedby` or `label[for]` points at a missing ID, or a referenced ID is duplicated | Fix the IDs | moderate · S · P1 | Baseline |

**Stable: does it hold still long enough?**

| ID | Rule | Flags when… | Fix | Sev · Mode · P | Origin |
|---|---|---|---|---|---|
| OPT-301 | Late controls | A control in the final snapshot wasn't visible/enabled at the 1,000 ms sample (samples at 500 / 1,000 / 3,000 ms) | Cap entrance animations; never gate interactivity on them | serious · R · P1 | Ouroboros L6 |
| OPT-302 | Layout shift | CLS > 0.1 within 3 s of load | Reserve space; size media | moderate · R · P1 | Baseline (also in Lighthouse) |

**Discoverable: can an agent orient itself?**

| ID | Rule | Flags when… | Fix | Sev · Mode · P | Origin |
|---|---|---|---|---|---|
| OPT-401 | Missing page anchors | No `<title>`, no `<h1>`, or no `main` landmark | Add them | moderate · S · P0 | Baseline |
| OPT-402 | Unnamed dialog | `role="dialog"`/`<dialog>` has no accessible name | `aria-labelledby` on the heading | moderate · S+R · P1 | Baseline |
| OPT-403 | Untitled frame | `<iframe>` has no `title` | Add `title` | minor · S · P1 | Baseline |

---

## 4. Scoring

- **Audit result per rule in the set:**
  - **pass:** zero findings.
  - **fail:** one or more findings.
  - **n/a:** nothing applicable.
  - **needs rendered scan:** the rule is rendered-only and the scan was static. Never shown as a pass.
- **Category score** = 100 × (weight of passing applicable audits) ÷ (weight of applicable audits), rounded to an integer. It is binary per audit like Lighthouse accessibility, so it's easy to explain. A category with no applicable audits shows "—".
- **Overall score** = weighted mean of the categories present (Operable 40, Perceivable 30, Stable 15, Discoverable 15), re-normalized over the categories that apply. Static scans say so on the report.
- **Finding fingerprint** (stable across commits, for new/fixed deltas): `sha256(ruleID + route + selectorPath + role + normalizedName)`. `selectorPath` is a tag:nth-of-type chain from the nearest ancestor with an `id`.
- **Determinism:**
  - Findings are sorted by (rule ID, document order).
  - Each report carries `engineVersion`, `ruleSet`, `rulesetHash` and `reportHash`.
  - The same snapshot and rule set give byte-identical JSON and the same report hash. A test enforces this.
  - Reports compare only when their `rulesetHash` matches.
- **Gate options** for the future GitHub Action: `--min-score 90`, `--fail-on critical|serious`, `--no-new serious` (fail if the PR adds findings at or above that severity versus its base scan).

---

## 5. Architecture

```
  Browser ──https──► https://optikii.netlify.app      Netlify: static React build (client/), SPA fallback via _redirects
     │
     │  fetch(credentials: 'include')  — cross-site, so cookies are SameSite=None; Secure
     ▼
  https://optikiapi.tuliime.com  ──► Contabo server, tuliime's Traefik (only ingress, Let's Encrypt)
     │                                     │
     │                                     ▼
     │                        Docker Swarm stack app-stack → service optiki-backend :8001
     │                        one image: Fiber API  /api/v1 (session cookies)
     │                                              /client/v1 (Bearer opt_… API tokens)
     │                                              /gym/pages/*.html, /health, /status
     │                                   + Chromium + an in-process SSRF-safe forward proxy (rendered scans)
     │                                     │
     │                                     ▼
     │                        external Postgres (OPTIKI_PROD_DSN) — one production database
     │
  CI / scripts ──Bearer opt_<prefix>_<token>──► /client/v1/scan, /client/v1/project

Push to main → "Build and Deploy To Contabo": build image (GIT_SHA baked in) → Docker Hub → SSH →
               scripts/optiki-deploy.sh → docker stack deploy → wait for 1/1 and /health via Traefik
             → "Deploy Optiki Client to Netlify": pnpm build → Netlify
```

**Key choices and why**

- **Client and API on different sites.**
  - The client is a static build on Netlify; the API is a long-lived container on the shared Contabo server.
  - Auth cookies are therefore `SameSite=None; Secure` when deployed, and CORS allows the Netlify origin from `GetClientBaseURL`, and its previews (`https://*--optikii.netlify.app`), with credentials.
  - Browsers that block third-party cookies (Safari) won't keep the session. The fix is a `*.tuliime.com` custom domain for the client (§15).
- **One API, no environment tags.** Each PR deploys its server to production, then a Netlify preview of the client that talks to it. One production database; local development uses its own database. Migrations stay additive, and anything destructive is a manual SQL migration run before the deploy that needs it.
- **Every feature runs locally too, without Docker.** Nothing is gated on the environment; only config differs (DSN, port, cookie flags, client origin, and the console fallback for email). Rendered scans use the installed Chromium, screenshots go to the same real S3 bucket as production, and `.env.example` seeds verified demo accounts.
- **Rendered scans on the server.**
  - Each rendered scan also captures a full-page JPEG screenshot. It is stored in a private S3 bucket as an attachment and returned with a 30-minute presigned URL; without S3 configured, scans still work, without screenshots.
  - The image already ships Chromium. Verified users' and tokens' URL scans render there, with every request Chrome makes forced through an in-process forward proxy that only dials public addresses.
  - Static scans need no browser and serve anonymous visitors.
  - At most 2 renders at once, to fit the service's 2-CPU limit.
- **Tokens for CI.** A token acts as its user with only the permissions it was given. The future GitHub Action uses one to scan each PR; nothing else is needed on the runner.

**Repo layout** (gradescript-shaped; see §17)

```
optiki/
├─ optiki.md  README.md  Dockerfile  .dockerignore  .gitignore
├─ .claude/skills/{backend,frontend,engine,testsprite}/SKILL.md   (+ references/*.md per skill)
├─ .github/workflows/{contabo-deploy,netlify-deploy}.yaml
├─ scripts/optiki-deploy.sh                     # run on the server by contabo-deploy
├─ server/                                      # Go 1.26 · Fiber v2 · GORM · module github.com/Tibz-Dankan/optiki
│  ├─ cmd/main.go
│  └─ internal/
│     ├─ routes/ handlers/<domain>/ middlewares/ models/ pkg/ constants/ data/ templates/email/ assets/
│     ├─ engine/                                # PURE: model, roles, accname, rule sets, rules, score — no I/O
│     │  ├─ rules/opt101HiddenControl.go …      # one file per rule + _test.go
│     │  └─ testdata/golden/*.json
│     ├─ gym/pages/*.html  gym/gym.go           # fixtures, //go:embed, served at /gym/pages/
│     └─ snapshot/{static,rendered}/            # x/net/html and chromedp → engine.Snapshot
└─ client/                                      # React 19 · Vite · TS · TanStack Query · zustand · Tailwind v4 · shadcn
   └─ src/{api,constants,hooks,modules/{auth,home,scan,settings,shared,…},providers,routes,stores,styles,types,utils}
```

---

## 6. Engine design (Go)

The engine lives in `server/internal/engine/`. It is pure: it never imports `models`, `handlers` or `pkg`, and does no I/O. Each rule gets one lowerCamelCase file plus a test (`rules/opt101HiddenControl.go` and `rules/opt101HiddenControl_test.go`). `.claude/skills/engine/SKILL.md` has the recipe.

```go
type Node struct {
    ID, Parent  int
    Children    []int
    Tag         string
    Attrs       map[string]string
    Text        string   // own text, whitespace-normalized
    Role, Name  string   // computed (static approximation, or Chrome's in rendered mode)
    NameFrom    string   // ARIA_LABELLEDBY | ARIA_LABEL | NATIVE | CONTENT | TITLE | PLACEHOLDER
    Interactive bool
    Exposed     bool     // present (not ignored) in the accessibility tree
    Path        string   // stable selector path
    // rendered-only; nil in static mode
    Visible *bool; FontPx *float64; Cursor *string; FirstSeenMs *int; Box *Rect
}
type Snapshot struct { URL, Route, Mode string; Title, Lang string; Nodes []Node; CLS *float64; Dialogs []string }
type Options  struct { RuleSet string } // CORE, FULL
type Rule interface {
    Meta() RuleMeta                              // ID, category, severity, modes, priority, docs
    Check(s *Snapshot) (findings []Finding, applicable bool)
}
```

**Static snapshot** (`golang.org/x/net/html`)

- **Implicit roles:** button, `a[href]`, input types, select, textarea, summary, img, svg, headings, landmarks, dialog.
- **Exposure:** `aria-hidden`, the `hidden` attribute, `role=none|presentation`, and presentational-children ancestors (img, button…). Inline `style="display:none"` is handled; stylesheet CSS is not, and that's documented.
- **Accessible-name subset**, in order:
  1. `aria-labelledby`
  2. `aria-label`
  3. Native source: `label[for]`/wrapping label, `alt`, `value` on input buttons, `<title>` in svg, `legend`, `caption`
  4. Name from content (button, link, heading, tab, menuitem, option, summary)
  5. `title`
  6. `placeholder`, which is flagged by OPT-106
- **Interactive:** native controls, `[tabindex>=0]`, ARIA widget roles, `[contenteditable]`.

**Rendered snapshot** (chromedp, in the API container)

1. Each scan gets a fresh incognito browser context, viewport 1280×800. All traffic goes through the SSRF-safe proxy.
2. Inject a CLS observer, a dialog recorder and a first-visibility stamper before navigation (`page.AddScriptToEvaluateOnNewDocument`).
3. Navigate, then wait for network idle + 500 ms.
4. Sample controls at 500, 1,000 and 3,000 ms for OPT-301.
5. Run one collector script that returns every element's tag, attributes, text, computed `cursor`/`font-size`/visibility and bounding box.
6. Fetch Chrome's real tree with `accessibility.GetFullAXTree` (cdproto) and merge by backend node ID. Chrome's role, name and "ignored" flag are authoritative.

The details are in `.claude/skills/engine/references/rendered-snapshot.md`. **Rendered beats static:** the static engine is an approximation, and every report shows its `mode`.

---

## 7. API

The browser API is under `/api/v1` (session cookies); the token API for scripts and CI is under `/client/v1` (`Authorization: Bearer opt_<prefix>_<token>`). A hand-written OpenAPI 3.1 document is served at `/api/v1/openapi.yaml` (TestSprite's API mode reads it). It is embedded from `server/internal/assets/openapi.yaml`, and each PR that adds an endpoint updates it.

| Method · Path | Auth | Purpose |
|---|---|---|
| `POST /api/v1/scan` | optional session, rate-limited | Exactly one of `{html}`, `{url}`, `{gym}` (+ `route`, `title`, `projectID`). Anonymous → `CORE`, static, stored `PUBLIC`. Verified → `FULL`, URL rendered, stored `PRIVATE`. Returns the stored report |
| `GET /api/v1/scan` | session + verified | The caller's scans, cursor-paginated, filterable |
| `GET /api/v1/scan/:id` | optional session | A `PUBLIC` scan, or the caller's own; otherwise 404. Rendered scans include `screenshot: {url, expiresAt, …}` — a fresh 30-minute presigned S3 link on every read |
| `PATCH /api/v1/scan/:id` · `DELETE …` | session + verified | Title, visibility (share), project · delete |
| `POST/GET /api/v1/project`, `GET/PATCH/DELETE /api/v1/project/:id` | session + verified | Optional projects *(Should)* |
| `POST/GET /api/v1/apitoken`, `GET …/permissions`, `GET/PATCH/DELETE …/:id`, `PATCH …/:id/revoke` | session + verified | API tokens: `opt_<prefix>_<token>`, shown once, SHA-256 of the secret stored, `resource:action:own` permissions, optional expiry |
| `POST/GET /client/v1/scan`, `GET/PATCH/DELETE /client/v1/scan/:id` | Bearer token + `scan:*:own` | The same scan handlers for CI. `FULL` rule set, URL rendered, plus `repository`, `branch`, `commitSHA`, `prNumber`, `runURL` |
| `/client/v1/project` (same five) | Bearer token + `project:*:own` | Projects for CI *(Should)* |
| `GET /api/v1/rules[?set=CORE\|FULL]`, `GET /api/v1/rules/:id` | public | Catalog with rationale, fix, origin, priority and sets |
| `GET /api/v1/gym`, `GET /gym/pages/:file`, `GET /gym/redirect-private` | public | Fixture pairs, the pages themselves, and the SSRF redirect fixture |
| `/api/v1/auth/*`: `signup` · `signin` · `signout` · `signout-all` · `refresh` · `me` · `forgot-password` · `verify-otp` · `reset-password/:otp` · `verify-email/initiate` · `verify-email` · `user/change-email` · `user/session` (+ `/:sessionID/revoke`) · `user/:id/change-password` · `user/:id` | mixed | Email + password accounts. **Done** |
| `POST /api/v1/appearance`, `GET …/me`, `PATCH …/:id` | session | Theme preference. **Done** |
| `GET /health` | public | `{status, data: {status, commit}}`. **Done** |

**Errors** share one envelope: `{"status": "fail" | "error", "error": <code>, "message": <text>}`.

- `error` is a **reason code** when the caller has to branch on it:
  - `SSRF_BLOCKED` (400), `TOO_LARGE` (413), `NOT_HTML` (422)
  - `FETCH_TIMEOUT` / `RENDER_TIMEOUT` (422), `RENDERER_BUSY` (429)
  - `EMAIL_NOT_VERIFIED` (403), `MISSING_PERMISSION` (403), `TOKEN_REVOKED` / `TOKEN_EXPIRED` (401)
- Otherwise `error` is the HTTP status name (`BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`, `TOO_MANY_REQUESTS`).
- Other users' resources are `404`. Rate-limited responses carry `RateLimit-*` and `Retry-After`. Target timeouts are 4xx because a 5xx hides its reason.

**Data model** (GORM structs in `server/internal/models/schema.go`; quoted camelCase columns; AutoMigrate). The full structs, enums, indexes and FK behaviour are in `.claude/skills/backend/references/data-model.md`.

```
User{id, name, email unique, password(bcrypt), role, emailVerified, emailVerifiedAt, profileBgColor}        — done
Session{id, userID, accessToken, refreshToken, generatedVia, userAgent, ip, isRevoked, *ExpiresAt}       — done (raw tokens, never serialised)
OTP{id, userID, OTP(sha-256), type, isUsed, isVerified, attempts, expiresAt}                             — done
Appearance{id, userID, theme}                                                                            — done
Attachment{id, userID, type[SCAN_SCREENSHOT], key (S3), contentType, size, width, height}               — done; reads sign a 30-minute URL
Permission{id, name unique (resource:action:scope), resource, action, scope, description}               — seeded (scan:* today)
APIToken{id, userID, name, prefix unique, tokenHash, expiresAt, isRevoked, revokedAt, lastUsedAt, lastUsedIP}
APITokenPermission{id, apiTokenID, permissionID}  unique(apiTokenID, permissionID)
Project{id, userID, name, description, baseURL, repository, createdVia, apiTokenID}  unique(userID, name)  — not built yet
Scan{id, userID?, apiTokenID?, screenshotAttachmentID?, triggeredBy, visibility, title,   (+ projectID? with projects)
     inputType, targetURL, finalURL, gymPageID, route, inputSha256, inputBytes, redirectCount, httpStatus, contentType, pageTitle, pageLang,
     mode, ruleSet, engineVersion, rulesetHash, reportHash, viewport, nodeCount, controlCount,
     status, errorCode, errorMessage, startedAt, completedAt, durationMs, fetchMs, renderMs, analyzeMs,
     overall + 4 category scores, severity counts, rule outcome counts, findingsTruncated,
     repository, branch, commitSHA, prNumber, runURL}
ScanRuleResult{id, scanID, ruleID, position, category, priority, severity, weight, result, findingsCount}  unique(scanID, ruleID)
ScanFinding{id, scanID, ruleID, category, severity, fingerprint, position, documentOrder, selectorPath,
            tag, role, accessibleName, nameFrom, snippet, message, evidence jsonb}  unique(scanID, fingerprint)
```

---

## 8. Security (each item is also a test target)

- **SSRF-safe fetcher (`server/internal/pkg/fetchPublicPage.go`):**
  - Only `http`/`https` on ports 80 and 443.
  - Resolve the host, then reject loopback, private, link-local (incl. `169.254.169.254`), CGNAT, multicast, unspecified, IPv6 ULA/link-local and IPv4-mapped addresses.
  - Re-check the *actually dialed* IP in `net.Dialer.Control` (`pkg/publicDialer.go`), which defeats DNS rebinding.
  - Re-validate each of at most 3 redirects.
  - 8 s timeout, 2 MB cap, `text/html` only.
- **Rendered scans can't reach inside either.**
  - Chrome is launched with `--proxy-server` pointing at an in-process forward proxy, and `--proxy-bypass-list=<-loopback>`. The proxy dials with the same public-only dialer, so every subresource, redirect, fetch and WebSocket is checked.
  - WebRTC's non-proxied UDP is disabled.
  - Each scan gets a fresh incognito context: 15 s budget, 20 MB transfer budget, downloads denied, and at most 2 at once.
- **Rate limits in memory**, in one long-lived container:
  - Anonymous scans: 30 per 10 minutes per IP, URL scans 5 per minute.
  - Signed-in users and tokens: 60 per 10 minutes each.
  - Auth routes: 20 per minute per IP. All send `RateLimit-*` headers.
  - The client IP comes from Traefik's `X-Real-IP`. That needs Traefik to be the only ingress, so **port 8001 is never published on the host**: Swarm's ingress mesh bypasses UFW. Traefik still passes a client-sent `X-Real-IP` through (`forwardedHeaders.insecure=true`); that is a follow-up.
- **Auth:**
  - Passwords are hashed with bcrypt (minimum 8 characters).
  - Access and refresh JWTs are in `HttpOnly`, `Secure`, `SameSite=None` cookies (cross-site client). CORS allows only the client's origin, plus the Vite dev server locally.
  - Sessions store the raw tokens (a deliberate simplification) and are never serialised. Sessions can be listed and revoked.
  - Email verification gates everything beyond the account itself (`403 EMAIL_NOT_VERIFIED`), including the `FULL` rule set.
  - Password reset uses a 6-digit code from `crypto/rand`, stored hashed. It expires after 20 minutes and burns after 5 wrong guesses. Forgot-password answers the same whether or not the account exists. A reset revokes every other session.
  - Other users' resources return `404`.
- **API tokens:**
  - Format `opt_<12 hex>_<64 hex>` from `crypto/rand`, shown once. Only `sha256(secret)` is stored, and it is verified in constant time before revealing revoked/expired.
  - Optional expiry (≥ 1 day); revocable; `lastUsedAt` is recorded.
  - Permissions are limited to `scan:{create,view,edit,delete}:own` and `project:{create,view,edit,delete}:own`. Tokens can't manage tokens.
- **Never render user HTML.** Snippets are shown as escaped text only, and raw scanned HTML is never stored.
- **No secrets in the repo:** only `.env.example` is committed. Demo passwords live in `~/optiki.env` on the server and in the TestSprite portal. (The gitleaks job left with the CI workflow; re-add it with the CI decision.)
- **Fail closed:** the future Action exits non-zero on any network/API/parse error. A missing score is never treated as a pass.

---

## 9. The Gym (fixtures that double as test data and demos)

- **Single source of truth:** `server/internal/gym/pages/`. `gym.go` embeds the pages into the Go binary (so `{gym:"opt-101-broken"}` needs no network). The same embedded files are served at `/gym/pages/<id>.html`, so URL scans, rendered scans and TestSprite can open them. Nothing is copied into the client.
- **Pairs:** one `-broken.html` and one `-fixed.html` for **every** rule. Each broken page has a banner: "Intentionally broken for OPT-xxx." The scenes are listed in `.claude/skills/engine/references/gym.md`. P0 examples:

| Pair | Scene |
|---|---|
| opt-101 | A ring of iteration arcs inside `<svg role="img">` (a nod to Ouroboros) |
| opt-102 | Icon-only toolbar |
| opt-103 | "Seek to iteration 2" vs. "Open iteration 2" look-alike controls |
| opt-104 | `<div>` "buttons" |
| opt-106 | Placeholder-only sign-up form |
| opt-201 | A "Press ? for shortcuts" hint with a masking `aria-label` |
| opt-202 | SVG-only stats card |
| opt-203 | Image link without `alt` |
| opt-401 | No `<title>`, `<h1>` or `<main>` |

- **`kitchen-sink.html`:** one violation of each of the 14 static-capable rules plus the rendered triggers. `CORE` fails exactly 9; `FULL` static fails 14, with 3 "needs rendered scan"; `FULL` rendered fails 17.
- **`perfect.html`:** must score 100 in every set and mode.
- **SSRF fixture:** a Fiber route `GET /gym/redirect-private` that answers `302` to `http://127.0.0.1/`. The target is fixed, so this is not an open redirect.

---

## 10. Test strategy

### Layer 1: Go unit tests (`make test` → `go test -race ./internal/...`)

Only `engine`, `snapshot`, `pkg/fetchPublicPage`, `pkg/publicDialer` and `pkg/apiToken` get Go tests (the backend skill's rule). TestSprite covers handlers, auth and the UI end to end. No CI job runs them today; one returns with the CI/TestSprite trigger decision.

- Table-driven positive and negative cases for every rule, using the Gym pages.
- Golden reports for `kitchen-sink` and `perfect`, per rule set.
- Invariants:
  - Scores stay within [0, 100].
  - Adding a violation never raises a score.
  - Byte-identical output across runs.
- Fetcher tests with a stub resolver: private ranges, IPv6, mapped IPv4, decimal IP hosts, redirect chains.
- Token tests: generate/parse round-trip, malformed tokens, constant-time verify.

There are no frontend unit tests (gradescript's convention). The checks Vitest would have made (text equivalents for every gauge, a keyboard-navigable findings list) are covered by U1/U2 and, later, the optikí Action.

### Layer 2: TestSprite suite

Built in the **portal**, UI tests only. The TestSprite GitHub App runs them on every ready (non-draft) PR against its Netlify preview (`https://deploy-preview-{pr}--optikii.netlify.app`) and blocks the merge on red. The production URLs are `https://optikii.netlify.app` and `https://optikiapi.tuliime.com`.

The cases and their steps are in [`testsprite/ui-test-plan.md`](testsprite/ui-test-plan.md): U1–U6 and U11 scan signed out (Gym pages by URL, a static URL scan of `https://docease-v2.netlify.app`, SSRF and form errors, the sign-in prompt for guest history), and U7–U10 sign in with the demo account (the scan page, a rendered URL scan with a screenshot, making a scan public, deleting one). There are no API, sign-up or password-reset tests.

**Authoring rules (the S3 lessons):**
- One verb per step, and one decisive assertion.
- `Navigate to` only on step 1.
- Use "Load example" buttons instead of typing long HTML.
- Desktop viewport only.
- Name every test as a behavior.

**Data setup:**
- The API boots with `SEED_DEMO=true` and creates **verified** demo accounts from `DEMO_*` variables if they're missing.
- TestSprite can't read an inbox, so signed-in tests use a seeded account, and there are no sign-up tests.
- There is one shared production database, so tests assert on the scan they just created and never on history order or totals.

### Layer 3: the optikí GitHub Action *(Later)*

- It runs on every PR, using an API token stored as a repository secret.
- It scans optikí's own key pages through `/client/v1/scan`, then compares head vs base by fingerprint.
- It posts a sticky PR comment, and fails closed with `--min-score 95 --fail-on critical --no-new serious`.

### Sabotage PRs (proof that the gates hold the merge; close them unmerged and link them in the README)

Both use the TestSprite PR trigger. After closing a sabotage PR, re-run the last **Build and Deploy To Contabo** run on `main` to put `main` back in production.

1. **S1 (engine):** disable OPT-101's ancestor check. The broken page passes, U1 goes red and the merge is blocked.
2. **S2 (UI):** wrap the score gauge in `role="img"` and drop its text. U3 fails (and the optikí Action, once it exists), and the merge is blocked.

### README "What the suite covers" (required by S4)

Table columns: test → UI/API → what it proves → the PR where it caught something.

---

## 11. S4 wiring checklist

The README's "Deploying" section has the exact commands.

- [x] **DNS:** an A record for `optikiapi.tuliime.com` → the Contabo server. No wildcard and no preview subdomains.
- [x] **Server:** `~/optiki.env` (from `server/.env.example`) with `OPTIKI_PROD_DSN`, `JWT_SECRET`, Resend and the demo accounts. The `optiki-backend` service is in tuliime's `docker-compose.yaml`.
- [x] **GitHub secrets** for both deploy workflows (Docker Hub, Contabo SSH, Netlify).
- [ ] **Production DB:** run the one-off SQL in `.claude/skills/backend/references/data-model.md` (§ Migrations) if the database predates the `env` removal.
- [ ] **Ports:** no container port published on the host; only Traefik's 80/443 (Traefik is the only way in).
- [ ] **Resend:** verify the sending domain (the test sender only delivers to your own address).
- [ ] **TestSprite portal project:** the client URL, demo credentials, the PRD (§12) and the cases from `testsprite/ui-test-plan.md`. Trigger: the PR trigger on the `Netlify` status (README §6).
- [ ] **Branch protection on `main`:** decide the required checks along with the TestSprite trigger.

---

## 12. PRD (paste into the TestSprite portal)

> **optikí** scans web pages for problems that stop AI agents (and assistive technology) from using them.
>
> **Users:** developers who test their web apps with AI agents.
>
> **Features and acceptance criteria**
>
> 1. **Scan.** On `/scan` (signed in: `/u/scan`), anyone can enter a page's address and press "Scan URL". The report opens when the scan is done.
>    - The report shows an overall score (0–100) and Operable, Perceivable, Stable and Discoverable scores as visible numbers.
>    - Signed-out visitors get the 9 core rules and a banner saying so, and 3 free scans; after that they must sign in to scan more. Signed-in, verified users get all 17 rules, and URL scans render in a real browser.
>    - Static scans show Stable as "needs rendered scan".
> 2. **Findings.** Each failed rule lists its ID (e.g. OPT-101), name, severity, element snippet and a "How to fix" example.
>    - Scanning the fixed variant of a Gym page makes that rule pass and raises the score.
> 3. **Determinism.** The same input always produces the same score and findings.
> 4. **Safety.**
>    - URLs that resolve to private or loopback addresses (or redirect to them) are rejected with "This address isn't allowed".
>    - Inputs over 2 MB are rejected.
>    - Too many scans return a "slow down" message.
> 5. **History and sharing.** Signed-in users see their scans on the Scan page and under Scans. A scan is private until its owner shares it from the report's "Scan actions" menu; a shared link reopens the same report. A signed-out visitor's scans are listed under the scan form, kept in that browser with a banner asking them to sign in, and move to their account (as private scans) when they sign in.
> 6. **Rules catalog.** `/rules` lists every rule; each rule page shows why agents fail, the fix and the WCAG reference.
> 7. **Gym.** `/gym` lists broken/fixed example pairs. Broken pages display a banner naming their rule.
> 8. **Accounts.**
>    - Sign up with name, email and password. A new account sees a "Verify your email" screen until it opens the emailed link.
>    - Sign in and out. "Forgot password" emails a 6-digit code; the answer is the same whether or not the email has an account. A wrong code is rejected, and five wrong codes invalidate it.
>    - Settings let the user change their name, password and theme, and list and revoke their active sessions.
> 9. **API tokens.** In Settings → API tokens, a user creates a named token with chosen permissions and an optional expiry. The token is shown once; afterwards only its prefix is visible. Tokens can be edited, revoked and deleted.
> 10. **Projects** *(if shipped)*. Users can group scans into projects in the app or with a token. Deleting a project keeps its scans. Users never see each other's projects or scans.
>
> **Out of scope:** WebMCP and `llms.txt` checks; mobile viewports; scanning pages behind a login.

---

## 13. PR roadmap

| PR | Content | TestSprite tests it adds |
|---|---|---|
| #1 | Scaffold from gradescript: accounts, theme, landing + dashboard shell, `/health` + OpenAPI, Dockerfile, deploys, Claude skills | A12, A13, A14, A15, U11, U12 |
| #1b | Cleanup: drop env tagging and purge, raw-token session lookups, cross-site cookies, docs and skills for the new design | — |
| #2–#7, #9 | **Built together on `feat/scans-and-tokens`, to be split into PRs:** the engine with all 17 rules, rule sets, Gym, golden tests; static + rendered (Chromium + SSRF-safe proxy) snapshots with screenshots in S3; scan CRUD on both surfaces; SSRF-safe fetch and rate limits; rules catalog; API tokens + permissions; the playground, report, history, token settings, rules and Gym pages | A1–A11, U1–U9 |
| #2 | Engine core: static snapshot, roles, accname, rule sets, OPT-101/102, scoring; `Scan` tables; `POST /api/v1/scan {html}` with `OptionalAuth`; `GET /scan/:id` | A4, A5 (partial) |
| #3 | P0 rules 103/104/106/201/202/203/401 + Gym pages + golden tests | A1, A2, A3 |
| #4 | Report UI + playground + Gym index + scan history | U1, U2, U3, U7, U8 |
| #5 | URL scans: SSRF-safe fetcher, scan rate limits, redirect fixture | A5, A6, A7, A8, U4 |
| #6 | Rules catalog; scan PATCH (share) and DELETE | U5, U6 |
| #7 | API tokens + permissions + `AuthAPI` + `/client/v1/scan` + token settings UI | A9, A10, A11, U9 |
| #8 *(Should)* | Projects on both surfaces + UI | A16, U10 |
| #9 *(Should)* | Optional static rules 105/205/402/403/107 + rendered snapshot with the proxy + 204/301/302 | Extended A1–A3, A9 |
| S1, S2 | Sabotage PRs (closed unmerged), once a PR gate exists | Red, blocked by design |
| Later | The optikí GitHub Action; compare and trend | — |

---

## 14. Submission checklist

- [ ] Public repo with a README covering: the app, the live URLs, "What the suite covers", how optikí relates to Lighthouse, and limitations (static vs. rendered, the core vs full rule sets).
- [ ] No secrets committed.
- [ ] At least one merged PR whose TestSprite check passed (ideally every PR), plus the two linked sabotage PRs.
- [ ] Suite built in the TestSprite portal, under the same email you submit with.
- [ ] Discord post in `#hackathon-submissions`: PR link, live URL, TestSprite email + name.
- [ ] Optional but scored as engagement: demo video, X posts per milestone, a Discord poll, a write-up.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Too much scope for the remaining days | The tiers in §2 and the cut rule; tests and README are never cut |
| Static accessible names differ from browsers | Label every report's `mode`; rendered mode uses Chrome's tree; document the deviations |
| False positives (e.g. repeated "Delete" buttons) | Severity tiers for repeated rows; `data-optiki-ignore` with a required reason *(Later)* |
| Looking like a copy of Google's category | The §1 comparison table in the README; focus on the agent-failure rules, the rule tiers and the token API |
| Cross-site cookies: Safari (and any browser blocking third-party cookies) won't keep the session between `optikii.netlify.app` and `optikiapi.tuliime.com` | Cookies are `SameSite=None; Secure` and work in Chrome and Firefox; the real fix is a custom domain such as `optiki.tuliime.com` on Netlify, which makes the client and API same-site |
| A schema change that AutoMigrate can't apply (drop, rename, retype) breaks inserts in the one production database | Additive-only migrations; destructive changes ship with manual SQL run before the deploy (backend skill § 6) |
| SSRF through the rendered browser (subresources, redirects, rebinding) | Every Chrome request goes through the public-only forward proxy; loopback is proxied too; WebRTC UDP disabled; A7 covers the URL path |
| Rendering load on a 2-CPU service | At most 2 concurrent renders, then `429 RENDERER_BUSY`; anonymous scans never render; per-user and per-token rate limits |
| A published container port lets a client bypass Traefik and spoof `X-Real-IP` (Swarm's ingress mesh bypasses UFW) | No `ports:` on any app service; only Traefik publishes 80/443 |
| Leaked or over-privileged API tokens | Shown once, hashed, optional expiry, revocable, `:own` permissions only, no token management by tokens |
| chromedp/cdproto API drift | Pin versions; fall back to collector-only rendered mode |
| Email delivery (Resend test sender only reaches your own inbox) | Verify the domain; TestSprite never depends on email (seeded verified accounts) |
| Credit burn (Timeora went from ~150 to ~74) | Short, decisive plans; rerun only failed tests while iterating; full suite at milestones |

---

## 16. After the hackathon

- Test-plan pre-flight: match each test step to the page's accessibility tree before a run.
- Optional WebMCP/`llms.txt` checks (or defer to Lighthouse).
- A browser extension with a live "agent view" overlay.
- A published calibration study: findings vs. real agent run outcomes on the Gym pairs.
- SARIF output for GitHub code scanning.
- Retention for anonymous scans; async rendered scans with a queue.

---

## 17. Gradescript alignment

The repo reuses the structure and conventions of the gradescript project for both `client/` and `server/`. Only generic infrastructure was ported, and it was rebranded: auth, theme, shadcn primitives and conventions. The Claude skills in `.claude/skills/` record the rules. Where optikí's needs don't fit gradescript's shape, this is what was done (or will be).

| optikí needs | Gradescript has | What optikí does |
|---|---|---|
| A pure scan engine (rules, accessible names, scoring) | No equivalent; logic sits in flat `pkg/` | New `server/internal/engine/`: pure, no imports from `models`/`handlers`/`pkg`, one rule per file. The backend skill records why it's a new top-level directory |
| Gym fixtures | `internal/assets/` (reserved, empty) | `server/internal/gym/` with `pages/*.html` + `gym.go` (`//go:embed`), shared by the engine, the tests and the `/gym` routes |
| Static and rendered snapshots | — | `server/internal/snapshot/{static,rendered}`. Rendering runs in the API container's Chromium behind an SSRF-safe proxy; there is no CLI |
| SSRF-safe URL fetching | `pkg/` one-concern helpers | `pkg/fetchPublicPage.go` + `pkg/publicDialer.go` (+ tests) |
| Tests | "Only grading gets tests" | "Only `engine`, `snapshot`, the fetcher/dialer and `pkg/apiToken` get Go tests"; TestSprite covers the rest. No frontend unit tests |
| An OpenAPI spec for TestSprite's API mode | None | Hand-written `server/internal/assets/openapi.yaml`, embedded and served at `/api/v1/openapi.yaml`. Handlers keep gradescript's closure recipe (done) |
| Machine-readable error reasons (`SSRF_BLOCKED`) | The `error` field is the HTTP status name | `pkg.NewReasonError(code, "SSRF_BLOCKED", msg)`, which `DefaultErrorHandler` emits as `error`, mirrored in the client's `TServerErrorName` (done; `EMAIL_NOT_VERIFIED` is the first) |
| Database layer | GORM AutoMigrate, one database per environment | Kept: one database per runtime (local, production). The short-lived `env` row tag for per-PR previews was removed with the previews |
| Redis/Valkey, streams, SSE | `models/cache.go`, `stream.go`, subscribers | Not ported; scans run synchronously within the request |
| Sessions | Device + location + a WEB/CONSOLE app split, raw tokens in the database | `Session` stores `userAgent` + `ip` and the raw tokens (like gradescript); location, devices and the app split are dropped. One cookie pair (done) |
| Site visits and anonymous-user tracking | `PageCapturer`, `X-Device`/`X-Anonymous-ID` headers, devices, ip-api.com locations, reconcile on sign-in | Ported for capture only: `POST /api/v1/sitevisit` and `/auth/user/:id/anony-reconcile`, with devices, locations and anonymous IDs. There are no read endpoints. The device and anonymous ID travel in the request body, the server resolves page names, and the gradescript bugs that weren't copied are listed in the backend skill's `references/site-visits.md` (done) |
| Activity logs | Redis streams, wired everywhere | Not ported (no Redis) |
| RBAC / orgs / resource scopes | Seeded roles, permissions, `UserOrgRole`, `ResourceScope` | Only `role` (`USER`) and owner filters. The `resource:action:scope` permission naming survives for API tokens only |
| API keys | Org-scoped `APIKey` (`gsk_<id>_<secret>`) with grants through `RolePermission`, `AuthAPI`, console-only management | User-scoped `APIToken` (`opt_<prefix>_<token>`), a plain `api_token_permissions` join over a seeded `permissions` table, `AuthAPI` + `RequirePermission`, managed from settings. The gradescript bugs that weren't copied are listed in the backend skill's `references/api-tokens.md` |
| A separate public API handler tree | `internal/apihandlers/v1/<domain>/` | One handler per endpoint, registered on both `/api/v1` and `/client/v1` when behaviour matches |
| Admin area `/a/*` | A separate admin route tree | Dropped; one user tree, `/u/*` |
| Public pages (scan, report, rules, gym) | Public routes repeated in every tree in `App.tsx` | Same approach: `/`, `/scan`, `/scans/:id`, `/rules`, `/rules/:id`, `/gym` go into each of the three trees (signed out, unverified, user) |
| File uploads | Presigned S3 only | None needed: HTML arrives as JSON text (≤ 2 MB) |
| Client ↔ API origin | Separate hosts, `SERVER_URL` chosen by hostname, `SameSite=None` | Separate sites again (Netlify + Contabo). `SERVER_URL` is chosen by Vite mode in `constants/urls.ts`; cookies `SameSite=None; Secure` when deployed, `Lax` locally (done) |
| Deployment | Cloudflare Pages + Docker Swarm on Hostinger, `main` only | Netlify + the shared Contabo Docker Swarm stack, `main` only (done) |
| Email templates | Read from a working-directory path | Embedded with `//go:embed`. In local development without a Resend key, the email is logged instead of sent; deployed, it is never logged (done) |
| Verified test accounts for TestSprite | — | `handlers/auth/seedDemoAccounts.go` runs when `SEED_DEMO=true`. Credentials come from env and are never committed (done) |
| Code gradescript itself flags "do not copy" | Model `BodyParser` in sign-up/sign-in; `use-get-me` as a mutation; a misspelled filename | Ported correctly: Input structs, `useQuery`, `verifyOTP.go` (done) |

---

## References

- S4 brief: https://www.testsprite.com/hackathon-s4 · TestSprite GitHub integration: https://docs.testsprite.com/web-portal/integrations/github-integration · TestSprite docs: https://docs.testsprite.com
- Lighthouse Agentic Browsing: https://developer.chrome.com/docs/lighthouse/agentic-browsing · Chrome agent-ready toolkit: https://developer.chrome.com/blog/agent-ready-toolkit
- Traefik Docker provider: https://doc.traefik.io/traefik/providers/docker/ · Netlify redirects: https://docs.netlify.com/routing/redirects/
- Cookies across sites (`SameSite=None`): https://web.dev/articles/samesite-cookies-explained
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- GORM: https://gorm.io/docs/ · Fiber v2: https://docs.gofiber.io/
- chromedp protocol bindings (`cdproto`): https://pkg.go.dev/github.com/chromedp/cdproto
- S3 lessons this spec builds on: Ouroboros `LESSONS.md` (https://github.com/Yazan-O/ouroboros/blob/main/LESSONS.md), Timeora `LOOP.md`, Nora `LOOP.md`, and the Mantiz `action.yml` fail-open example (see `S3-winners-analysis-and-S4-ideas.md`)
