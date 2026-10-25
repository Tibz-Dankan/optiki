# Feature pages: scans, API tokens, rules, Gym

What each feature module contains and which server contract it reads. The server side is in the backend skill (`references/scans.md`, `api-tokens.md`, `attachments.md`); the types below mirror those responses. Every page follows `theme-and-ui.md`, every form `forms.md`, and every dialog the one-dialog-per-file rule.

Projects are designed (backend `references/projects.md`) but not built. There is no `project` module yet.

## Routes

| Path | Tree | Module · page | Notes |
|---|---|---|---|
| `/` | all three | `home/pages/home.tsx` → `Home` | "Try a demo scan" scans the kitchen-sink Gym page and opens its report |
| `/scan` | all three | `scan/pages/scan.tsx` → `Scan` | the playground |
| `/scans/:id` | all three | `scan/pages/scan-report.tsx` → `ScanReport` | one report; the share link |
| `/rules`, `/rules/:id` | all three | `rules/pages/rules.tsx` → `Rules`, `rule.tsx` → `Rule` | catalog |
| `/gym` | all three | `gym/pages/gym.tsx` → `Gym` | fixture index; links open `API_ORIGIN` + `/gym/pages/<id>.html` |
| `/u/dashboard` | user | `dashboard/pages/dashboard.tsx` | recent scans (the 5 latest) |
| `/u/scans` | user | `scan/pages/scans.tsx` → `Scans` | history, a `TPage` under "General" |
| `/u/settings/api-tokens` | user | `api-token/pages/api-tokens.tsx` → `APITokens` | a Settings child, plus an entry in `settings/ui/settings-nav.tsx` |

Every public page wraps itself in **`HomeLayout`** (`home/layout/home-layout.tsx`): the logo, the Scan / Rules / Gym nav, the theme switch, sign-in or "Open dashboard", `<main id='content'>`, and the footer.

Public pages render for everyone, and the server decides what each visitor gets. The page reads `ruleSet`, `mode` and `isOwner` from the response; it never infers them from the route tree.

## API classes, keys and types

| File | Class · singleton | Keys | Types file |
|---|---|---|---|
| `api/scan.ts` | `ScanAPI` · `scanAPI`: `create`, `getAll(limit, cursor, filters)`, `getOne(id)`, `update({id, title?, visibility?})`, `delete({id})` | `scanKeys = { all, list(filters), detail(id) }` | `types/scan.ts` |
| `api/api-token.ts` | `APITokenAPI` · `apiTokenAPI`: `create`, `getAll(limit, cursor)`, `getPermissions`, `update`, `revoke`, `delete` | `apiTokenKeys = { all, list(), permissions() }` | `types/api-token.ts` |
| `api/rules.ts` | `RulesAPI` · `rulesAPI`: `getAll()` (FULL), `getOne(id)` | `rulesKeys = { all, list(), detail(id) }` | `types/rules.ts` |
| `api/gym.ts` | `GymAPI` · `gymAPI`: `getAll` | `gymKeys = { all, list() }` | `types/gym.ts` |

- All of these use `SERVER_URL` (`/api/v1`). The client never calls `/client/v1`; `API_URL` appears only in the token dialog's curl sample.
- `API_ORIGIN` (in `constants/urls.ts`) is the API's own origin, for linking Gym pages.
- Labels, tones, reason-code messages and page sizes live in `constants/scan.ts` and `constants/api-token.ts`.
- One-function utils: `describe-scan-target.ts` (title → URL → Gym page → HTML), `get-api-token-status.ts` (adds `EXPIRING` within 7 days), `get-api-token-expires-at.ts` (preset → ISO date).

The scan types are string unions (`TScanRuleSet`, `TScanMode`, `TScanStatus`, `TScanInputType`, `TScanTriggeredBy`, `TScanVisibility`, `TSeverity`, `TRuleCategory`, `TRuleResult`), plus:

- `TScanSummary`: with `scores`, `counts`, `engine`, `timing`, `error`, and `screenshot: TScanScreenshot | null`
- `TScanReport = TScanSummary & { rules; findings }`
- `TScanScreenshot = { id, url, expiresAt, contentType, size, width, height }`

## Scan playground (`/scan`)

- Three tabs (`@shared/ui/tabs`):
  - **Gym example** (default): `scan/ui/gym-examples.tsx`. Buttons named by rule and variant ("Load example OPT-101 broken", "Load example Kitchen sink (every rule broken)"). **A Load example button scans immediately**: one click, short TestSprite plans.
  - **URL**: `url-scan-form.tsx`, Formik + Yup. The text says whether the scan will render (verified) or run statically.
  - **Paste HTML**: `html-scan-form.tsx`, with a 2 MB check in Yup.
- The page owns the one `scanAPI.create` mutation. On success it invalidates `scanKeys.all` and navigates to `/scans/:id`.
- A local `onError` replaces the global toast with an inline `role='alert'`, keyed on `error.error` through `scanErrorMessages`:

| Reason | Message |
|---|---|
| `SSRF_BLOCKED` | "This address isn't allowed" |
| `TOO_LARGE` | "That page is over 2 MB" |
| `NOT_HTML` | "That address didn't return an HTML page" |
| `FETCH_TIMEOUT` / `RENDER_TIMEOUT` | "That page took too long to load" |
| `RENDERER_BUSY` | "Too many scans are rendering — try again in a few seconds" |
| `TOO_MANY_REQUESTS` | "Slow down — too many scans. Try again in a minute" |

## Report (`/scans/:id`)

- **Header**: the target (`describeScanTarget`), source and time, and badges for Rendered/Static, "All 17 rules"/"9 core rules", and Public/Private. Owner actions (`scan/ui/scan-owner-actions.tsx`) appear only when `isOwner`:
  - "Make scan public" / "Make scan private"
  - "Copy link"
  - "Delete scan", through `delete-scan-dialog.tsx`
- **`rule-set-banner.tsx`**: on `CORE`, "Ran the 9 core rules. Sign in to run all 17 rules…" (`?redirectTo=/scan`). On a static `FULL` scan, it says how many rules need a rendered page.
- **`score-summary.tsx`**:
  - The overall score and the four category scores **as visible text**, with each category's question.
  - The gauge is a decorative SVG with `aria-hidden`.
  - `null` shows "—", or "Needs rendered scan" when every rule in that category is `NEEDS_RENDERED`.
- **`scan-screenshot.tsx`**:
  - When `screenshot` is set: a "Page screenshot" heading and an `<img alt="Screenshot of … as the scanner rendered it">` from the presigned URL, in a scroll box.
  - An "Open full-size screenshot" link.
  - The report query uses `staleTime` and `refetchInterval` of 25 minutes, so the 30-minute link is replaced before it expires.
- **`rule-results.tsx`**: rules grouped by category. Each rule shows its ID (linking to `/rules/:id`), name, severity and result (Pass / Fail · n findings / Not applicable / Needs rendered scan). Failing rules list their findings in `finding-card.tsx`:
  - the severity and `message`
  - the accessible name and selector path
  - the `snippet` **as text in `<pre><code>`**
  - a `<details>` "How to fix OPT-xxx" with the catalog's fix and before/after
- A `FAILED` scan shows `error.message` instead of the scores.
- A 400 or 404 renders `NotFoundError`. That covers missing scans and other users' private ones alike.
- Report grids use `grid-cols-[minmax(0,1fr)]`. A plain `1fr` track grows to fit a long snippet and the page scrolls sideways.

## Scan history (`/u/scans`) and dashboard

- `useInfiniteQuery` over `scanKeys.list(filters)`, with "Load more scans" and status and source filters (shadcn `Select` with `aria-label`s).
- Row actions are named per row: "Open scan of <target>", "Delete scan of <target>".
- No screenshots in lists; screenshots appear on the report only.
- The dashboard shows the 5 most recent scans ("Open scan of …"), "See all scans", and "Scan a page".

## API tokens (`/u/settings/api-tokens`)

Ported from the GradeScript console's API-key page.

- **Table** columns: Name · Token (`opt_<prefix>_••••`) · Permissions (badges) · Status (`api-token-status-badge.tsx`: Active / Expiring soon / Expired / Revoked) · Expires · Last used · Actions.
  - Actions is `api-token-actions.tsx`, a `DropdownMenu modal={false}`.
  - Its trigger's sr-only name is "Actions for token <name>"; its items are "Edit token <name>", "Revoke token <name>" (disabled when revoked) and "Delete token <name>".
- **`create-api-token-dialog.tsx`**: Formik + Yup — a name (≤ 64) and at least one permission.
  - Checkboxes (`permission-checkboxes.tsx`, from `getPermissions`) with descriptions; create and view are ticked by default.
  - Expiry presets 30 days (default), 90 days, 1 year, or no expiry (with a warning).
- **`api-token-created-dialog.tsx`**, shown once:
  - It **can't be closed by an outside click or Escape**, and has no close button.
  - The token is shown in a `<code>`, with "Copy token" and a curl sample built from `API_URL`.
  - "I've saved my token" closes it. The token lives only in the page's state until then: never in a store, the query cache or `localStorage`.
- `edit-api-token-dialog.tsx` (name and permissions); `revoke-api-token-dialog.tsx` and `delete-api-token-dialog.tsx` (`ConfirmDialog`). Every mutation invalidates `apiTokenKeys.all`.

## Rules (`/rules`, `/rules/:id`) and Gym (`/gym`)

- `/rules` lists the 17 rules by category, with ID and name (a link), severity, a Core/Full badge, and "Rendered only".
- `/rules/:id` shows the summary, badges, "Why agents fail", "How to fix" with before/after (as text), WCAG and origin.
- `/gym` shows a card per pair: "Open OPT-xxx broken page" / "Open OPT-xxx fixed page" (new tab, on the API origin) and "Scan OPT-xxx broken page", which runs the scan and opens the report.

## Checked against optikí itself

- Rendered through optikí's own engine (`FULL`, all 17 rules), `/`, `/scan`, `/rules`, `/rules/OPT-201`, `/gym` and `/auth/signin` all score 100.
- A headless walkthrough found every control by its visible name: demo scan, Gym example, SSRF error, sign-in, rendered report with screenshot, share, token create → shown once → revoke, history, dashboard.
