# optikí: see your app the way an AI agent does

> Working spec for **TestSprite Hackathon Season 4**, "One week. One loop. Every PR." This is idea 9 ("Agent Lighthouse") from `S3-winners-analysis-and-S4-ideas.md`, renamed.
> Submissions close **Thu Oct 22, 11:59 PM PT**. Stack: Go + React/TypeScript. Builder: solo, near full-time. Today: Mon Oct 19.

## Context

- **The problem.** AI agents act on a page through its accessibility tree. That includes TestSprite's cloud test runner, browser agents and assistive tech. When a control is hidden, unnamed, masked or ambiguous, the agent can't act on it. The test run then comes back `blocked` or `failed` even though the app works for people with a mouse.
  - The S3 winners hit this again and again. Ouroboros wrote 8 lessons about it (L1–L8). Timeora rebuilt its calendar's DOM contract. Nora rewrote ambiguous plans and lost runs to "agent ran out of runway".
- **What optikí does.** It scans pages for agent-legibility problems, scores them in four categories, shows the exact fix, and runs on every pull request, so a change that makes the app harder for agents is caught before merge.
- **Name.** *optikí* comes from Greek οπτική, "optics; point of view". The display name is **optikí**. Use **`optiki`** (ASCII) for the repo, CLI binary, Go module, domain and file names.
- **Decisions made:**
  - A legibility scanner plus PR gate (no test-plan pre-flight), with a Go engine and a Go CLI using chromedp for rendered scans.
  - Hosting is a Contabo VPS: one Docker container per PR behind Traefik, all sharing **one Postgres database** whose rows carry an `env` tag.
  - The repo structure follows the gradescript project (`client/` + `server/`); §17 lists where optikí departs from it.
  - Accounts use email + password, email verification, and password reset by emailed code.

---

## 1. Pitch

**One line:** optikí tells you, on every PR, whether your app just got harder for AI agents to use, and how to fix it.

**Positioning against Google Lighthouse's Agentic Browsing category** (Chrome 150, June 2026). Judges may know it, so say this plainly in the README.

| | Google Lighthouse, Agentic Browsing | optikí |
|---|---|---|
| Scope (per its docs) | One page load: a subset of accessibility audits (names/labels, tree integrity, interactive content hidden from the tree), layout shift (CLS), `llms.txt`, WebMCP tools and schemas | Your key routes, on every PR |
| Output | Informational pass ratio; "experimental", "unbenchmarked" | 0–100 score per category plus overall, with element-level findings and before/after fixes |
| Focus | Standards readiness (WebMCP, `llms.txt`) | Failure modes logged in real AI test runs: same-name controls with different actions, clickable things that aren't controls, `aria-label` masking visible text, content carried only by SVG/canvas, controls that only appear after an entrance animation, text too small for screenshot-reading agents |
| Workflow | Run it and read it | **PR-native:** compare base vs. PR preview, list new and fixed findings, post a sticky PR comment, fail the required check on regressions |

**Use both:** Lighthouse for WebMCP/`llms.txt`, optikí for flow-breaking legibility problems and PR gating. Don't claim optikí covers what it hasn't measured.

**How it scores on the S4 rubric**

- **Project quality (40):** a polished, instantly understandable tool.
  - Paste HTML or a URL, or pick a demo page, and get a scored report in seconds.
  - The Gym (intentionally broken vs. fixed pages) makes every rule tangible.
- **Tests that run themselves (40):**
  - The engine is deterministic, so assertions are exact (rule IDs, counts, scores).
  - There's a rich security surface to test: SSRF, rate limits, auth, token scoping.
  - **Two gates on every PR:** TestSprite tests optikí, and optikí audits its own preview.
- **Innovation (20):**
  - The rules are distilled from real agent-test failures.
  - The PR-delta gate is novel.
  - Dogfooding: the agent-legibility tool must itself stay agent-legible, or its own PR is blocked.

---

## 2. Scope and cut lines

| Tier | What | Why it's in this tier |
|---|---|---|
| **Done (PR #1)** | Accounts: sign-up, sign-in, email verification, password reset by emailed code, sessions, theme · per-PR previews on the VPS · CI + gitleaks | The pipeline and the auth surface exist before any feature |
| **Must** | Static engine + 9 P0 rules + scoring · Playground (HTML / URL / Gym) + report page + share links · Rules catalog · Gym pages · SSRF-safe URL fetch + per-IP rate limit (in memory) · CLI rendered scan + `optiki diff` · GitHub Action (PR comment, fails closed) · TestSprite PR gating · README "What the suite covers" | The demo, the deep tests and the PR story |
| **Should** | Projects + API tokens + `/client/v1/ingest` + trend + compare UI · P1 static rules (105, 205, 402, 403) · rendered-only rules (204, 301, 302) | Auth-boundary tests (high value) and a dashboard |
| **Could** | Hosted rendered scans (Chromium is in the image from PR #7) · README badge · `data-optiki-ignore` suppressions with a required reason · calibration study (TestSprite runs on broken vs. fixed Gym pages, published on `/evidence`) · OPT-107 | Extra polish and evidence, only if ahead |

**Cut rule:** if you're behind at **Wed Oct 21, 12:00 PT**, drop all of Should except token-scoped ingest. Never cut tests, the README or the PR gating.

---

## 3. Rule catalog (v1)

- **S** = works on static HTML (hosted engine). **R** = needs a rendered page (CLI with Chrome).
- Severity weights: critical 10, serious 7, moderate 3, minor 1.
- **P0** is Must, **P1** is Should, **P2** is Could.
- *Baseline* rules overlap standard accessibility checkers. *Agent-failure* rules come from logged AI-test failures.

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

- **Audit result per rule:**
  - **pass:** zero findings.
  - **fail:** one or more findings.
  - **n/a:** nothing applicable, or the rule needs a rendered scan. n/a is shown as "needs rendered scan", never as pass.
- **Category score** = 100 × (weight of passing applicable audits) ÷ (weight of applicable audits), as a binary per audit like Lighthouse accessibility, so it's easy to explain. A category with no applicable audits shows "—".
- **Overall score** = weighted mean of the categories present (Operable 40, Perceivable 30, Stable 15, Discoverable 15), re-normalized over the categories that apply. Static scans say so on the report.
- **Gate options (CLI/Action):**
  - `--min-score 90`
  - `--fail-on critical|serious`
  - `--no-new serious`, which is the PR-delta gate: fail if the PR adds findings at or above that severity versus base.
- **Finding fingerprint** (stable across commits, for new/fixed deltas): `sha256(ruleID + route + selectorPath + role + normalizedName)`. `selectorPath` is a tag:nth-of-type chain from the nearest ancestor with an `id`.
- **Determinism:**
  - Findings are sorted by (rule ID, document order).
  - Each report carries `engineVersion` and `rulesetHash`.
  - The same input gives byte-identical JSON and the same report hash. A test enforces this.

---

## 5. Architecture

```
                 Contabo VPS ── Traefik v3 (only ingress, Let's Encrypt, Host() routing)
                       │
   https://pr-<n>.<domain> ──→ container optiki-pr-<n>   OPTIKI_ENV=pr-<n>      :8000
   https://<domain>        ──→ container optiki-prod     OPTIKI_ENV=production  :8001
                       │        one image: Fiber API (/api/v1, /client/v1, /health)
                       │                 + built React SPA (./public, SPA fallback)
                       │                 + /gym/pages/*.html (embedded fixtures)
                       │
                 Postgres 17 (internal network) ── ONE database `optiki`;
                 every user-data row carries env = pr-<n> | production | local

PR opened/pushed → workflow "Preview": build image → push to GHCR → SSH to VPS
  → scripts/deploy-preview.sh → wait until /health reports the PR's commit
  ├─ TestSprite GitHub App (trigger: "Preview" completed) → UI + API suite vs
  │  https://pr-{pr}.<domain> → bot comment → blocks merge
  └─ Action "optiki-gate" (PR #7): build CLI from the PR's commit → rendered scan of
     base (production) and head (preview) routes → `optiki diff` → sticky PR comment
     → exit code: 0 pass · 1 gate failed · 2 error (fails closed)
PR closed → "Preview cleanup": remove the container, `purge pr-<n>` deletes its rows
Push to main → "Deploy production" → same image → optiki-prod
```

**Key choices and why**

- **One container per PR behind Traefik.** Each PR gets `https://pr-<n>.<domain>`, which maps directly onto TestSprite's `{pr}` Target URL placeholder. UI and API share one origin, so cookies are `SameSite=Lax` and there's no CORS in production.
- **One shared database with `env`-tagged rows** instead of a database per PR (the user's call: fewer moving parts on one VPS).
  - `OPTIKI_ENV` names the environment. Every model query goes through one scope helper, and every insert is stamped with it.
  - Uniqueness is per environment (`env` + `email`), so the same TestSprite account exists in every preview.
  - Every container runs AutoMigrate against the same schema, behind a Postgres advisory lock. **Migrations are additive only** (new nullable or defaulted columns, new tables). Renames, retypes and drops are manual migrations after merge.
  - Closing a PR runs `purge pr-<n>`; the purge binary refuses `production`.
- **Rendered scans run in the CLI first.** GitHub's `ubuntu-latest` runners ship with Chrome, so the gate needs nothing hosted.
  - The hosted app scans static HTML and labels results "static scan".
  - Client-rendered pages (an empty shell after fetch) get a banner: "This page renders in the browser — run `optiki scan` for a full audit."
  - Because the server is a long-lived container (not serverless), Chromium can join the image later for hosted rendered scans *(Could)*.
- **The deploy waits for the commit.** `/health` returns `{status, commit, env}`. The workflow finishes only when the public preview URL reports the PR's head SHA, so TestSprite never tests a stale deploy.

**Repo layout** (gradescript-shaped; see §17)

```
optiki/
├─ optiki.md  README.md  Dockerfile  .dockerignore  .gitignore
├─ .claude/skills/{backend,frontend,engine,testsprite}/SKILL.md   (+ frontend/references/*.md)
├─ .github/workflows/{ci,preview,preview-cleanup,deploy-prod}.yml  (+ optiki-gate.yml in PR #7)
├─ .github/pull_request_template.md
├─ deploy/{compose.yml,.env.example,preview.env.example,prod.env.example}   # Traefik + Postgres
├─ scripts/{lib,deploy-preview,destroy-preview,deploy-prod}.sh
├─ action/action.yml                            # reusable "optiki-gate" composite action (PR #7)
├─ server/                                      # Go 1.26 · Fiber v2 · GORM · module github.com/Tibz-Dankan/optiki
│  ├─ cmd/main.go   cmd/purge/main.go           # + cmd/optiki/ (CLI: scan · diff · upload · rules) in PR #7
│  └─ internal/
│     ├─ routes/ handlers/<domain>/ middlewares/ models/ pkg/ constants/ templates/email/ assets/
│     ├─ engine/                                # PURE: model, roles, accname, rules, score — no I/O (PR #2)
│     │  ├─ rules/opt101HiddenControl.go …      # one file per rule + _test.go
│     │  └─ testdata/golden/*.json
│     ├─ gym/pages/*.html  gym/gym.go           # fixtures, //go:embed, served at /gym/pages/ (PR #3)
│     └─ snapshot/{static,rendered}/            # x/net/html and chromedp → engine.Snapshot
└─ client/                                      # React 19 · Vite · TS · TanStack Query · zustand · Tailwind v4 · shadcn
   └─ src/{api,constants,hooks,modules/{auth,home,dashboard,settings,shared},providers,routes,stores,styles,types,utils}
```

---

## 6. Engine design (Go)

The engine lives in `server/internal/engine/`. It is pure: it never imports `models`, `handlers` or `pkg`, and does no I/O. Each rule gets one lowerCamelCase file, as elsewhere in the server, plus a test (`rules/opt101HiddenControl.go` and `rules/opt101HiddenControl_test.go`). `.claude/skills/engine/SKILL.md` has the recipe.

```go
type Node struct {
    ID, Parent  int
    Children    []int
    Tag         string
    Attrs       map[string]string
    Text        string   // own text, whitespace-normalized
    Role, Name  string   // computed (static approximation, or Chrome's in rendered mode)
    NameFrom    string   // "aria-labelledby" | "aria-label" | "native" | "content" | "title" | "placeholder"
    Interactive bool
    Exposed     bool     // present (not ignored) in the accessibility tree
    Path        string   // stable selector path
    // rendered-only; nil in static mode
    Visible *bool; FontPx *float64; Cursor *string; FirstSeenMs *int
}
type Snapshot struct { URL, Route, Mode string; Title string; Nodes []Node; CLS *float64 }
type Rule interface {
    Meta() RuleMeta                              // ID, category, severity, modes, docs
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

**Rendered snapshot** (chromedp; CLI only)

1. Inject a CLS observer before navigation (`page.AddScriptToEvaluateOnNewDocument`).
2. Navigate, then wait for network idle + 500 ms.
3. Run one collector script that returns every element's tag, attributes, text, computed `cursor`/`font-size`/visibility and bounding box.
4. Fetch Chrome's real tree with `accessibility.GetFullAXTree` (cdproto) and merge by backend node ID. Chrome's role, name and "ignored" flag are authoritative.
5. Sample controls at 500, 1,000 and 3,000 ms for OPT-301.

Verify the exact cdproto call on day 2.

**Rendered beats static:** the hosted static engine is an approximation, and every report shows its `mode`.

---

## 7. API

The browser API is under `/api/v1`; the token API for the CLI and Action is under `/client/v1`. A hand-written OpenAPI 3.1 document is served at `/api/v1/openapi.yaml` (TestSprite's API mode reads it). It is embedded from `server/internal/assets/openapi.yaml`, and each PR that adds an endpoint updates it.

| Method · Path | Auth | Purpose |
|---|---|---|
| `POST /api/v1/scan` | public, rate-limited | Body has exactly one of `{html}`, `{url}`, `{gym}`, plus optional `save`. Returns the report; `save:true` also returns a `shareID` |
| `GET /api/v1/scan/share/:shareID` | public (unguessable ID) | Saved report |
| `GET /api/v1/rules`, `GET /api/v1/rules/:id` | public | Catalog with rationale, fix and origin |
| `GET /api/v1/gym` | public | List of fixture pairs |
| `/api/v1/auth/*`: `signup` · `signin` · `signout` · `signout-all` · `refresh` · `me` · `forgot-password` · `verify-otp` · `reset-password/:otp` · `verify-email/initiate` · `verify-email` · `user/change-email` · `user/session` (+ `/:sessionID/revoke`) · `user/:id/change-password` · `user/:id` | mixed | Email + password accounts. **Done in PR #1** |
| `POST /api/v1/appearance`, `GET …/me`, `PATCH …/:id` | session | Theme preference. **Done in PR #1** |
| `POST/GET /api/v1/project`, `GET/DELETE /api/v1/project/:id` | session + verified email | Projects *(Should)* |
| `POST /api/v1/project/:id/token`, `DELETE …/token/:tokenID` | session + verified email | Token `opk_<id>_<secret>`, shown once, stored as SHA-256, scoped to one project *(Should)* |
| `POST /client/v1/ingest` | Bearer token | CLI upload: report + repo, branch, SHA, PR number, routes *(Should)* |
| `GET /api/v1/project/:id/trend`, `GET …/compare?base=&head=` | session + verified email | Score history; new, fixed and unchanged findings *(Should)* |
| `GET /api/v1/badge/:projectID.svg` | public (opt-in) | README badge with `<title>` text *(Could)* |
| `GET /health` | public | `{status, data: {status, commit, env}}`. **Done in PR #1** |

**Errors** share one envelope: `{"status": "fail" | "error", "error": <code>, "message": <text>}`.
- `error` is a **reason code** when the client has to branch on it: `SSRF_BLOCKED`, `NOT_HTML`, `TOO_LARGE`, `FETCH_TIMEOUT`, `WRONG_PROJECT`, `EMAIL_NOT_VERIFIED`.
- Otherwise `error` is the HTTP status name (`BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`, `TOO_MANY_REQUESTS`).
- Statuses: `400` invalid input · `400 SSRF_BLOCKED` · `401` · `403 WRONG_PROJECT` / `EMAIL_NOT_VERIFIED` · `404` (also returned for other users' resources) · `413 TOO_LARGE` (HTML > 2 MB) · `415` · `422 NOT_HTML` · `429` (+ `RateLimit-*` headers) · `504 FETCH_TIMEOUT`.

**Data model** (GORM structs in `server/internal/models/schema.go`; quoted camelCase columns; AutoMigrate)

Every table carries `env` (indexed, set on insert, filtered on every query) and `createdAt`/`updatedAt`.

```
User{id, env, name, email, password(bcrypt), role, emailVerified, emailVerifiedAt, profileBgColor}  unique(env, email)  — PR #1
Session{id, env, userID, accessTokenHash, refreshTokenHash, generatedVia, userAgent, ip, isRevoked,
        accessTokenExpiresAt, refreshTokenExpiresAt}                                               — PR #1
OTP{id, env, userID, OTP(sha-256), type[RESET_PASSWORD|VERIFY_EMAIL], isUsed, isVerified, attempts, expiresAt} — PR #1
Appearance{id, env, userID unique, theme}                                                          — PR #1
Project{id, env, ownerID → User, name, baseURL, badgePublic}
APIToken{id, env, projectID → Project, name, tokenHash, last4, revokedAt}
Scan{id, env, shareID unique NULL, projectID NULL, source[playground|url|gym|cli], mode[static|rendered],
     targetURL, route, repo, branch, commitSHA, prNumber, overall, categories JSONB,
     engineVersion, rulesetHash, report JSONB}
Finding{id, env, scanID → Scan, ruleID, severity, fingerprint, path, role, name, snippet}  — idx (scanID), (fingerprint)
```

A new tagged table is also added to `models/purgeEnv.go`, so closing a PR deletes its rows.

---

## 8. Security (each item is also a test target)

- **SSRF-safe fetcher (`server/internal/pkg/fetchPublicPage.go`):**
  - Only `http`/`https` on ports 80 and 443.
  - Resolve the host, then reject loopback, private, link-local (incl. `169.254.169.254`), CGNAT, multicast, unspecified, IPv6 ULA/link-local and IPv4-mapped addresses.
  - Re-check the *actually dialed* IP in `net.Dialer.Control`, which defeats DNS rebinding.
  - Re-validate each of at most 3 redirects.
  - 8 s timeout, 2 MB cap, `text/html` only.
- **Rate limits in memory, per container.** Mantiz's lesson (memory limits break on serverless) doesn't apply: each environment is one long-lived container. Example: 30 scans per 10 minutes per IP, 5 URL scans per minute. Auth routes already allow 20 requests per minute per IP and send `RateLimit-*` headers.
  - The client IP comes from Traefik's `X-Real-IP`. That's trustworthy only because **app containers publish no ports**; Traefik is the only ingress and replaces any client-sent value.
- **Auth (PR #1):**
  - Passwords hashed with bcrypt (minimum 8 characters).
  - Access and refresh JWTs in `HttpOnly`, `Secure`, `SameSite=Lax` cookies on one origin. CORS allows only the app's own origin, plus the Vite dev server locally.
  - Sessions store **SHA-256 hashes** of both tokens, so a database leak can't replay a session. Sessions can be listed and revoked.
  - Email verification gates everything beyond the account itself (`403 EMAIL_NOT_VERIFIED`).
  - Password reset uses a 6-digit code from `crypto/rand`, stored hashed. It expires after 20 minutes and burns after 5 wrong guesses. Forgot-password answers the same whether or not the account exists. A reset revokes every other session.
  - Other users' resources return `404`.
  - Project tokens are 32 random bytes, shown once, stored hashed and revocable.
- **Never render user HTML.** Snippets are shown as escaped text only.
- **No secrets in the repo:**
  - Only `.env.example` is committed.
  - Demo and test passwords live in the VPS env files (`~/optiki/preview.env`, `~/optiki/prod.env`) and the TestSprite credentials.
  - A **gitleaks** job is a required check (S4 rule).
- **Fail closed (Mantiz's lesson):**
  - The Action exits `2` on any network/API/parse error.
  - A missing score is never treated as a pass.

---

## 9. The Gym (fixtures that double as test data and demos)

- **Single source of truth:** `server/internal/gym/pages/`. `gym.go` embeds the pages into the Go binary (so `{gym:"opt-101-broken"}` needs no network). The same embedded files are served at `/gym/pages/<id>.html`, so URL scans and TestSprite can open them. Nothing is copied into the client.
- **Pairs:** one `-broken.html` and one `-fixed.html` per P0 rule. Each broken page has a banner: "Intentionally broken for OPT-xxx."

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

- **`kitchen-sink.html`:** exactly one violation of each P0 rule.
- **`perfect.html`:** must score 100.
- **SSRF fixture:** a Fiber route `GET /gym/redirect-private` that answers `302` to `http://127.0.0.1/`. The target is fixed, so this is not an open redirect.

---

## 10. Test strategy

### Layer 1: Go unit tests (`go test -race ./internal/...` in `ci.yml`, a required check)

Only `engine`, `snapshot` and `pkg/fetchPublicPage` get Go tests (the backend skill's rule). TestSprite covers handlers, auth and the UI end to end.

- Table-driven positive and negative cases for every rule, using the Gym pages.
- Golden reports for `kitchen-sink` and `perfect`.
- Invariants:
  - Scores stay within [0, 100].
  - Adding a violation never raises a score.
  - Byte-identical output across runs.
- Fetcher tests with a stub resolver: private ranges, IPv6, mapped IPv4, decimal IP hosts, redirect chains.

There are no frontend unit tests (gradescript's convention). The checks Vitest would have made (text equivalents for every gauge, a keyboard-navigable findings list) are covered by the dogfood gate (Layer 3) and U1/U2.

### Layer 2: TestSprite suite

Built in the **portal**, run by the **GitHub App on every PR**, and set to **block the merge**.

| # | Type | Scenario (named as a behavior) | Proves |
|---|---|---|---|
| A1 | API | Scanning the kitchen-sink fixture fails exactly the 9 P0 rules with the expected counts | Engine correctness |
| A2 | API | Scanning the perfect fixture scores 100 with zero findings | No false positives |
| A3 | API | Each broken/fixed pair fails and then passes its own rule | Every rule, both directions |
| A4 | API | Scanning the same HTML twice returns the same report hash | Determinism |
| A5 | API | Empty body, both `html` and `url`, HTML over 2 MB, or the wrong content type is rejected (400 / 400 / 413 / 415) | Validation |
| A6 | API | Scanning the app's own public `/gym/pages/perfect.html` URL returns a static report | Real fetch path |
| A7 | API | `127.0.0.1`, `localhost`, `169.254.169.254`, `[::1]`, `10.0.0.1`, `2130706433`, `file://` and the redirect fixture are all blocked with `SSRF_BLOCKED` | SSRF defense |
| A8 | API | Exceeding the scan limit returns 429 with `RateLimit-*` headers | Rate limiter |
| A9 | API | Without a session, projects return 401; user B gets 404 on user A's project and scans | Auth + IDOR *(Should)* |
| A10 | API | A token ingests into its own project (201), gets 403 on another project and 401 once revoked, and is never shown again | Token scoping *(Should)* |
| A11 | API | Ingesting a base scan and then a head scan with 2 new and 1 fixed finding makes compare report +2 / −1 | PR-delta math *(Should)* |
| A12 | API | The OpenAPI spec and health endpoint respond, and health reports the commit | Contract |
| A13 | API | Sign-up returns a session, and the new user stays unverified (verified-only routes answer `403 EMAIL_NOT_VERIFIED`) | Verification gate |
| A14 | API | Forgot-password gives the same answer for an unknown email and a known one | No account enumeration |
| A15 | API | A wrong reset code is rejected, and after five wrong guesses even the right code is refused | OTP brute-force defense |
| U1 | UI | "Try a demo scan" shows an overall score and four category scores as text | First-run experience |
| U2 | UI | Loading the "Ring" example and scanning lists OPT-101 with a "How to fix" snippet | Core flow |
| U3 | UI | Switching to the fixed variant makes OPT-101 pass and raises the score | Feedback loop |
| U4 | UI | Scanning a private address shows "This address isn't allowed" | Error UX |
| U5 | UI | A shared report link opens the same score and findings | Persistence |
| U6 | UI | The rules catalog page for OPT-201 shows WCAG 2.5.3 and its origin note | Docs |
| U7 | UI | A static scan shows the Stable category as "needs rendered scan" | Honest modes |
| U8 | UI | The Gym index lists the pairs, and a broken page shows its banner | Gym |
| U9 | UI | Sign in → create project → token shown once, then masked → revoke | Project flow *(Should)* |
| U10 | UI | A seeded project shows a trend with N points and a compare panel with "+2 new / −1 fixed" | Dashboard *(Should)* |
| U11 | UI | Signing up lands on the "Verify your email" gate | Account flow |
| U12 | UI | Signing in with the seeded account opens the dashboard; signing out returns to sign-in | Session flow |

**Authoring rules (the S3 lessons):**
- One verb per step, and one decisive assertion.
- `Navigate to` only on step 1.
- Use "Load example" buttons instead of typing long HTML.
- Desktop viewport only.
- Name every test as a behavior.

**Data setup:**
- Every preview boots with `SEED_DEMO=true` and creates **verified** demo accounts (and, from PR #8, a demo project) in its own env from `DEMO_*` variables.
- TestSprite can't read an inbox. Tests that need a verified user sign in with a seeded account; sign-up tests stop at the verification gate.
- Tests that create users use unique emails.
- A preview's rows (`env=pr-<n>`) persist across pushes to the same PR and are purged when it closes, so design tests to tolerate leftover rows.

### Layer 3: dogfood gate

- `optiki-gate` scans the preview's routes (`/`, `/scan`, `/rules`, `/r/<demo>`, `/auth/signin`).
- The gate requires **≥ 95, zero critical findings, and no new serious findings**.
- It posts a sticky PR comment with the score, the delta and the top findings.

### Sabotage PRs (proof that the gates hold the merge; close them unmerged and link them in the README)

1. **S1 (engine):** disable OPT-101's ancestor check. A1/A3 go red and the merge is blocked.
2. **S2 (UI):** wrap the score gauge in `role="img"` and drop its text. optikí's own gate fails (and likely U1), and the merge is blocked.

### README "What the suite covers" (required by S4)

Table columns: test → UI/API → what it proves → the PR where it caught something.

---

## 11. S4 wiring checklist (do this first, today)

The README's "Deploying" section has the exact commands.

- [ ] Request hackathon credits (the form is in your resources doc).
- [ ] **DNS:** A records for `<domain>` and `*.<domain>` → the VPS IP (`<domain>` is the app's host and the value of the `OPTIKI_DOMAIN` variable, e.g. `optiki.example.com`). Open ports 22, 80 and 443 only.
- [ ] **VPS:**
  - Install Docker.
  - Copy `deploy/` to `~/optiki/deploy`, fill in `.env` (ACME email, Postgres password), then `docker compose up -d`. That starts Traefik and Postgres.
  - Create `~/optiki/preview.env` and `~/optiki/prod.env` from the examples: DSN, separate JWT secrets, Resend, demo accounts.
  - Add a deploy user's SSH public key.
- [ ] **GitHub:**
  - Secrets `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`; variable `OPTIKI_DOMAIN`.
  - Images go to GHCR with the workflow's own `GITHUB_TOKEN`, so no registry secret is needed.
- [ ] **Resend:** verify the sending domain (the test sender only delivers to your own address).
- [ ] **TestSprite portal project:**
  - Live production URL `https://<domain>`, demo credentials and the PRD (§12).
  - Install the GitHub App, then add a **PR trigger** on the workflow **"Preview"** completing.
  - Target URL pattern **`https://pr-{pr}.<domain>`**.
  - **Block PR until tests pass** on; draft PRs off.
- [ ] **Branch protection on `main`:** PRs required. Required checks: TestSprite, `Server (gofmt, vet, build, test)`, `Client (lint, build)`, `gitleaks`, `Build and deploy preview`, and later `optiki-gate`. A check only becomes selectable after it has run once.
- [ ] Prove the setup on PR #1: the preview URL serves the PR's commit on `/health`, the bot comments, and the check is green. Then push a deliberately failing commit and confirm the merge is blocked. Close a throwaway PR and confirm its container and `env=pr-<n>` rows are gone.

---

## 12. PRD (paste into the TestSprite portal)

> **optikí** scans web pages for problems that stop AI agents (and assistive technology) from using them, and gates pull requests on regressions.
>
> **Users:** developers who test their web apps with AI agents.
>
> **Features and acceptance criteria**
>
> 1. **Scan.** On `/scan`, the user can pick a Gym example, paste HTML or enter a URL, then press Scan.
>    - The report shows an overall score (0–100) and Operable, Perceivable, Stable and Discoverable scores as visible numbers.
>    - Static scans show Stable as "needs rendered scan".
> 2. **Findings.** Each failed rule lists its ID (e.g. OPT-101), name, severity, element snippet and a "How to fix" example.
>    - Scanning the fixed variant of an example makes that rule pass and raises the score.
> 3. **Determinism.** The same input always produces the same score and findings.
> 4. **Safety.**
>    - URLs that resolve to private or loopback addresses (or redirect to them) are rejected with "This address isn't allowed".
>    - Inputs over 2 MB are rejected.
>    - Too many scans return a "slow down" message.
> 5. **Share.** "Share" creates a link that reopens the same report.
> 6. **Rules catalog.** `/rules` lists every rule; each rule page shows why agents fail, the fix and the WCAG reference.
> 7. **Gym.** `/gym` lists broken/fixed example pairs. Broken pages display a banner naming their rule.
> 8. **Accounts.**
>    - Sign up with name, email and password. A new account sees a "Verify your email" screen until it opens the emailed link.
>    - Sign in and out. "Forgot password" emails a 6-digit code; the answer is the same whether or not the email has an account. A wrong code is rejected, and five wrong codes invalidate it.
>    - Settings let the user change their name, password and theme, and list and revoke their active sessions.
> 9. **Projects** *(if shipped)*.
>    - Create a project and an API token (shown once).
>    - The dashboard shows score trends and new vs. fixed findings between two scans.
>    - Users never see each other's projects.
>
> **Out of scope:** WebMCP and `llms.txt` checks; mobile viewports; scanning pages behind a login.

---

## 13. PR roadmap and schedule

| PR | Content | TestSprite tests it adds |
|---|---|---|
| #1 | Scaffold from gradescript: accounts (sign-up, verification, reset by code, sessions), theme, landing + dashboard shell, `/health` + OpenAPI, Dockerfile, Traefik + Postgres on the VPS, per-PR previews, CI + gitleaks, Claude skills, TestSprite trigger | A12, A13, A14, A15, U11, U12 |
| #2 | Engine core: static snapshot, roles, accname, OPT-101/102, scoring, `POST /api/v1/scan{html}` | A4, A5 (partial) |
| #3 | P0 rules 103/104/106/201/202/203/401 + Gym pages + golden tests | A1, A2, A3 |
| #4 | Report UI + playground + Gym index | U1, U2, U3, U7, U8 |
| #5 | URL scans: SSRF-safe fetcher, scan rate limit, redirect fixture | A5, A6, A7, A8, U4 |
| #6 | Share links + rules catalog | U5, U6 |
| #7 | CLI rendered scan (chromedp + AX tree) + `optiki diff` + Action + dogfood gate | (gate goes live) |
| #8 *(Should)* | Projects, tokens, ingest, trend, compare (accounts already exist) | A9, A10, A11, U9, U10 |
| #9 *(Should)* | P1 rules 105/205/402/403 + rendered 204/301/302 | Extended A3 |
| S1, S2 | Sabotage PRs (closed unmerged) | Red, blocked by design |
| #10 | Polish, README, badge *(Could)* | Full rerun |

| Day | Date | Target |
|---|---|---|
| 1 | **Mon Oct 19 (today)** | §11 wiring + PRD + PR #1 green; start PR #2 |
| 2 | Tue Oct 20 | PRs #2, #3, #4; check the rendered-AX-tree spike (chromedp call) by evening |
| 3 | Wed Oct 21 | PRs #5, #6, #7. **Cut-line check at 12:00 PT.** PR #8 if on track |
| 4 | Thu Oct 22 | PRs #9/#10 if time, sabotage PRs, full rerun on `main`, README, demo video, X thread + write-up. **Freeze at 12:00 PT; submit on Discord by ~18:00 PT** |
| + | Until Oct 29 | Up to 3 CLI-bonus PRs to `testsprite-cli` |

---

## 14. Submission checklist

- [ ] Public repo with a README covering: the app, the live URL, "What the suite covers", how optikí relates to Lighthouse, and limitations (static vs. rendered).
- [ ] No secrets committed (the gitleaks job is green).
- [ ] At least one merged PR whose TestSprite check passed (ideally every PR), plus the two linked sabotage PRs.
- [ ] Suite built in the TestSprite portal, under the same email you submit with.
- [ ] Discord post in `#hackathon-submissions`: PR link, live URL, TestSprite email + name.
- [ ] Optional but scored as engagement: demo video, X posts per milestone, a Discord poll, a write-up.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Too much scope for 3.5 solo days | The tiers in §2 and a hard cut-line check Wed 12:00 PT; tests and README are never cut |
| Static accessible names differ from browsers | Label every report's `mode`; rendered mode uses Chrome's tree; document the deviations |
| False positives (e.g. repeated "Delete" buttons) | Severity tiers for repeated rows; `data-optiki-ignore` with a required reason *(Could)* |
| Looking like a copy of Google's category | The §1 comparison table in the README; focus on the agent-failure rules and the PR deltas |
| A PR's AutoMigrate changes the schema production uses (one shared database) | Additive-only migrations, AutoMigrate behind an advisory lock, destructive changes as manual post-merge migrations, and a PR-template checkbox |
| A query forgets the `env` filter and leaks rows between previews and production | Every model method goes through `scopeEnv`; the backend skill lists a missing scope as an anti-pattern; the purge refuses `production` |
| One VPS is a single point of failure | `restart: unless-stopped` everywhere; production redeploys from `main` with one workflow run; Postgres lives on a named volume (take a `pg_dump` before the final rerun) |
| Let's Encrypt limits (50 certificates per registered domain per week) and first-request issuance delay | Roughly 15 PR hosts fit easily; the Preview workflow waits until the public URL serves the commit over valid TLS |
| `X-Real-IP` spoofing would defeat rate limits | App containers publish no ports; Traefik is the only ingress |
| chromedp/cdproto API drift | Pin versions; spike `GetFullAXTree` on day 2; fall back to the collector-only rendered mode |
| Email delivery (Resend test sender only reaches your own inbox) | Verify the domain on day 1; TestSprite never depends on email (seeded verified accounts) |
| Credit burn (Timeora went from ~150 to ~74) | Short, decisive plans; rerun only failed tests while iterating; full suite at milestones |

---

## 16. After the hackathon

- Test-plan pre-flight: match each test step to the page's accessibility tree before a run.
- Optional WebMCP/`llms.txt` checks (or defer to Lighthouse).
- A browser extension with a live "agent view" overlay.
- A published calibration study: findings vs. real agent run outcomes on the Gym pairs.
- SARIF output for GitHub code scanning.

---

## 17. Gradescript alignment

The repo reuses the structure and conventions of the gradescript project for both `client/` and `server/`. Only generic infrastructure was ported, and it was rebranded: auth, theme, shadcn primitives and conventions. The Claude skills in `.claude/skills/` record the rules. Where optikí's needs don't fit gradescript's shape, this is what was done (or will be, in the PR noted).

| optikí needs | Gradescript has | What optikí does |
|---|---|---|
| A pure scan engine (rules, accessible names, scoring) | No equivalent; logic sits in flat `pkg/` | New `server/internal/engine/`: pure, no imports from `models`/`handlers`/`pkg`, one rule per file. The backend skill records why it's a new top-level directory, since gradescript treats unexplained ones as an anti-pattern (PR #2) |
| Gym fixtures | `internal/assets/` (reserved, empty) | `server/internal/gym/` with `pages/*.html` + `gym.go` (`//go:embed`), shared by the engine, the tests and a static route (PR #3) |
| Static and rendered snapshots, and a CLI | — | `server/internal/snapshot/{static,rendered}` (chromedp). The CLI is `server/cmd/optiki/`, following gradescript's second binary `cmd/grade/` (PR #2, PR #7) |
| SSRF-safe URL fetching | `pkg/` one-concern helpers | `pkg/fetchPublicPage.go` (+ `_test.go`) (PR #5) |
| Tests | "Only grading gets tests" | "Only `engine`, `snapshot` and `pkg/fetchPublicPage` get Go tests"; TestSprite covers the rest. No frontend unit tests |
| An OpenAPI spec for TestSprite's API mode | None | Hand-written `server/internal/assets/openapi.yaml`, embedded and served at `/api/v1/openapi.yaml`. Handlers keep gradescript's closure recipe; no code-generated API framework (done) |
| Machine-readable error reasons (`SSRF_BLOCKED`) | The `error` field is the HTTP status name | `pkg.NewReasonError(code, "SSRF_BLOCKED", msg)`, which `DefaultErrorHandler` emits as `error`. The client's error type gets the same values (done; `EMAIL_NOT_VERIFIED` is the first) |
| Database layer | GORM AutoMigrate | Kept. sqlc and goose are dropped from this spec |
| One database shared by previews and production | One database per environment, chosen by DSN | **Every user-data table has an `env` column.** `BeforeCreate` stamps it from `OPTIKI_ENV`, and every model query goes through `scopeEnv`. Uniqueness is per environment (`env` + `email`). Migrations are additive only, and AutoMigrate runs behind a Postgres advisory lock. `cmd/purge` deletes a closed PR's rows and refuses `production`. The DSN switch keeps gradescript's shape, but both deployed DSNs point at the same database (done) |
| Redis/Valkey, streams, SSE (gradescript won't boot without Redis) | `models/cache.go`, `stream.go`, subscribers | Not ported; nothing in optikí needs async fan-out yet |
| Sessions | Device + location (IP geolocation) + a WEB/CONSOLE app split, raw tokens in the database | `Session` stores `userAgent` + `ip`; location, devices and the app split are dropped. Tokens are stored as **SHA-256 hashes**. One cookie pair (done) |
| Activity logs, site visits, anonymous users | Wired everywhere | Dropped, along with the frontend skill's site-visit rule (done) |
| RBAC / orgs / resource scopes | Seeded but unused | Only `role` (`USER`) and owner filters. The rule that every list query is scoped to the caller stays |
| CLI upload tokens | `APIKey` (`gsk_<id>_<secret>`) + `AuthAPI` middleware | Same pattern as project tokens `opk_<id>_<secret>` under `/client/v1` (PR #8) |
| Admin area `/a/*` | A separate admin route tree | Dropped; one user tree, `/u/*` |
| Public pages (scan, report, rules, gym) | Public routes repeated in every tree in `App.tsx` | Same approach: `/`, `/scan`, `/r/:id`, `/rules`, `/rules/:id`, `/gym` go into each of the three trees (signed out, unverified, user) |
| File uploads | Presigned S3 only | None needed: HTML arrives as JSON text (≤ 2 MB) |
| Client ↔ API origin | Separate hosts, `SERVER_URL` chosen by hostname, `SameSite=None` | **One origin.** Fiber serves the built client with an SPA fallback; Vite proxies `/api` in dev; `SERVER_URL = '/api/v1'` always; cookies `Lax` (done) |
| Deployment | Cloudflare Pages + Docker Swarm on Hostinger, `main` only | Plain Docker + Traefik on Contabo: one container per PR plus production, one shared database. Swarm adds nothing for per-PR containers (done) |
| Email templates | Read from a working-directory path | Embedded with `//go:embed`. In local development without a Resend key, the email is logged (with its link or code) instead of sent; deployed environments never log it (done) |
| Verified test accounts for TestSprite | — | `handlers/auth/seedDemoAccounts.go` (following gradescript's seeders) runs when `SEED_DEMO=true`. Credentials come from env and are never committed (done) |
| Code gradescript itself flags "do not copy" | Model `BodyParser` in sign-up/sign-in; `use-get-me` as a mutation; a misspelled filename | Ported correctly: Input structs, `useQuery`, `verifyOTP.go` (done) |

---

## References

- S4 brief: https://www.testsprite.com/hackathon-s4 · TestSprite GitHub integration: https://docs.testsprite.com/web-portal/integrations/github-integration · TestSprite docs: https://docs.testsprite.com
- Lighthouse Agentic Browsing: https://developer.chrome.com/docs/lighthouse/agentic-browsing · Chrome agent-ready toolkit: https://developer.chrome.com/blog/agent-ready-toolkit
- Traefik Docker provider: https://doc.traefik.io/traefik/providers/docker/ · Traefik ACME / Let's Encrypt: https://doc.traefik.io/traefik/https/acme/ · Let's Encrypt rate limits: https://letsencrypt.org/docs/rate-limits/
- GitHub Container Registry: https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- GORM: https://gorm.io/docs/ · Fiber v2: https://docs.gofiber.io/
- chromedp protocol bindings (`cdproto`): https://pkg.go.dev/github.com/chromedp/cdproto
- S3 lessons this spec builds on: Ouroboros `LESSONS.md` (https://github.com/Yazan-O/ouroboros/blob/main/LESSONS.md), Timeora `LOOP.md`, Nora `LOOP.md`, and the Mantiz `action.yml` fail-open example (see `S3-winners-analysis-and-S4-ideas.md`)
