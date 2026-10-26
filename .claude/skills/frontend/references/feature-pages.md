# Feature pages: scans, API tokens, rules, Gym

What each feature module contains and which server contract it reads. The server side is in the backend skill (`references/scans.md`, `api-tokens.md`, `attachments.md`); the types below mirror those responses. Every page follows `theme-and-ui.md`, every form `forms.md`, and every dialog the one-dialog-per-file rule.

Projects are designed (backend `references/projects.md`) but not built. There is no `project` module yet.

## Routes

| Path | Tree | Module · page | Notes |
|---|---|---|---|
| `/` | all three | `home/pages/home.tsx` → `Home` | landing; links to `/scan` and `/gym` (no scan buttons) |
| `/scan` | signed-out, unverified (user tree redirects to `/u/scan`) | `scan/pages/scan.tsx` → `Scan` | guest scan page: `ScanPanel isGuest` + guest recent scans |
| `/scans/:id` | all three | `scan/pages/scan-report.tsx` → `ScanReport` | one report in `HomeLayout`; the share link |
| `/rules`, `/rules/:id` | all three | `rules/pages/rules.tsx` → `Rules`, `rule.tsx` → `Rule` | catalog |
| `/gym` | all three | `gym/pages/gym.tsx` → `Gym` | fixture index; links open `API_ORIGIN` + `/gym/pages/<id>.html` |
| `/u/scan` | user | `scan/pages/user-scan.tsx` → `UserScan` | the signed-in default (`homePath`, sign-in redirect): `ScanPanel` + `RecentScans` |
| `/u/scans` | user | `scan/pages/scans.tsx` → `Scans` | history, a `TPage` under "General" |
| `/u/scans/:id` | user | `scan/pages/user-scan-report.tsx` → `UserScanReport` | the report inside the app shell (hidden `TPage`) |
| `/u/scans/multiple/:id` | user | `scan/pages/multiple-page-scan-report.tsx` → `MultiplePageScanReport` | a multiple-page scan's progress and results (hidden `TPage`) |
| `/u/settings/api-tokens` | user | `api-token/pages/api-tokens.tsx` → `APITokens` | a Settings child, plus an entry in `settings/ui/settings-nav.tsx` |

Every public page wraps itself in **`HomeLayout`** (`home/layout/home-layout.tsx`): the logo, the Scan / Rules / Gym nav, the theme switch, sign-in or "Open app" (to `/u/scan`), `<main id='content'>`, and the footer.

Public pages render for everyone, and the server decides what each visitor gets. The page reads `ruleSet`, `mode` and `isOwner` from the response; it never infers them from the route tree.

## API classes, keys and types

| File | Class · singleton | Keys | Types file |
|---|---|---|---|
| `api/scan.ts` | `ScanAPI` · `scanAPI`: `create`, `getAll(limit, cursor, filters)`, `getOne(id)`, `update({id, title?, visibility?})`, `delete({id})`; for multiple-page scans `createMultiplePage` (the same `POST /scan` with `multiplePageScan: true`), `getAllMultiplePage(limit, cursor)`, `getOneMultiplePage(id)`, `deleteMultiplePage({id})` | `scanKeys = { all, list(filters), detail(id), multipleList(), multipleDetail(id) }` | `types/scan.ts` |
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

## Scan page (`/scan` for guests, `/u/scan` signed in)

**URL only.** The client never sends `html` or `gym`; those inputs stay on the server for the token API. There are no tabs and no "Load example" buttons, and Home and the Gym page don't scan.

- Both pages render `scan/ui/scan-panel.tsx` → `ScanPanel` (`isGuest` on `/scan`), which owns the one `scanAPI.create` mutation:
  - wording on top ("Scan a page" + subtitle), then `url-scan-form.tsx`: the "Page address" label, then the input and the "Scan URL" button side by side, then a hint (guests: "… N of 3 free scans left"; signed in: rendered, 17 rules, screenshot)
  - on success it invalidates `scanKeys.all` and navigates to `/scans/:id` (guest) or `/u/scans/:id` (signed in)
- **Guests** (signed out, or signed in but unverified — the server scans both anonymously):
  - each create sends `anonymousID: getAnonymousID()`; the server requires it for anonymous callers
  - a completed scan is added to `stores/guest-scan.ts` (`useGuestScanStore`, persisted as `guest-scan-storage`) as a `TRecentScan` (`toRecentScan`)
  - at `guestScanLimit` (3) stored scans, or on a server `ANONYMOUS_SCAN_LIMIT`, `guest-scan-limit-notice.tsx` replaces the form: "Sign in to scan more" (`?redirectTo=/u/scan`) and "Create an account", or "Verify your email" when unverified
  - below the panel: a "Recent scans" section with `guest-history-banner.tsx` ("Your scans are saved in this browser only. Sign in to keep your scan history…") and `recent-scan-list.tsx` over the store
  - `reconcileAnonymousUser` claims them on the server (they become private) and empties the store
- **Signed in**: `recent-scans.tsx` → `RecentScans`, the 5 latest from `scanAPI.getAll`, rendered with `RecentScanList` and "See all scans".
  - Above the form, `scan-scope-switch.tsx` → `ScanScopeSwitch` is a native radio group ("What to scan": "Single page" | "Multiple pages (up to 25)"). It is not Radix `Tabs`, because tabs without panels would leave `aria-controls` pointing at missing IDs (OPT-205). "Multiple pages" relabels the button "Scan pages", calls `createMultiplePage` and opens `/u/scans/multiple/:id`. Guests instead see "Sign in to scan multiple pages".
  - Each row links its target and, through `RecentScanList`'s `renderActions`, gets the report's `ScanOwnerActions` menu named "Actions for scan of <target>" (no `redirectTo`). The guest list passes no `renderActions`.
- A local `onError` replaces the global toast with an inline `role='alert'`, keyed on `error.error` through `scanErrorMessages`:

| Reason | Message |
|---|---|
| `SSRF_BLOCKED` | "This address isn't allowed" |
| `TOO_LARGE` | "That page is over 2 MB" |
| `NOT_HTML` | "That address didn't return an HTML page" |
| `FETCH_TIMEOUT` / `RENDER_TIMEOUT` | "That page took too long to load" |
| `RENDERER_BUSY` | "Too many scans are rendering — try again in a few seconds" |
| `TOO_MANY_REQUESTS` | "Slow down — too many scans. Try again in a minute" |
| `ANONYMOUS_SCAN_LIMIT` | shows the limit notice instead of an alert |

## Report (`/scans/:id` public, `/u/scans/:id` signed in)

- Both pages render `scan/ui/scan-report-content.tsx` → `ScanReportContent` (`{ id, scanAnotherPath }`). The public page adds `GuestHistoryBanner` above it (it renders nothing for verified users).
- **Header**: the target (`describeScanTarget`), source and time, and badges for Rendered/Static, "All 17 rules"/"9 core rules", and Public/Private; then "Scan another page" and, only when `isOwner`, `scan/ui/scan-owner-actions.tsx`:
  - a `DropdownMenu modal={false}` behind an icon button named "Scan actions" (⋮), with "Make scan public"/"Make scan private", "Copy link" and "Delete scan"
  - each item opens its own dialog; the menu keeps only which one is open: `scan-visibility-dialog.tsx` (`ConfirmDialog`, owns the update mutation), `copy-scan-link-dialog.tsx` (always the public `${origin}/scans/:id`, with "Copy link"), `delete-scan-dialog.tsx` (redirects to `redirectTo` when given; the report passes `/u/scans`)
- **`rule-set-banner.tsx`**: on `CORE`, "Ran the 9 core rules. Sign in to run all 17 rules…" (`?redirectTo=/u/scan`). On a static `FULL` scan, it says how many rules need a rendered page.
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

## Multiple-page scan (`/u/scans/multiple/:id`)

- `useQuery` on `scanKeys.multipleDetail(id)` refetches every 2 s while the scan is `QUEUED` or `RUNNING` (`isMultiplePageScanActive`). A 400 or 404 renders `NotFoundError`.
- Header: the start URL, status / mode / rule-set / Private badges, "Scan another page", and "Delete multiple-page scan" (disabled while active), which opens `delete-multiple-page-scan-dialog.tsx`.
- `multiple-page-scan-progress.tsx`: a `role='status'` sentence ("Scanning… 7 of up to 25 pages done, 23 found so far."), a decorative bar, the failure alert, and how many found pages were left after the 25-page cap.
- `ScoreSummary` with `rules={[]}`, captioned as the average across the scanned pages. It is shown once the scan completes.
- `multiple-page-rule-summary.tsx`: "Issues across the pages", the failing rules by pages failed ("Fails on 12 of 25 pages · 48 findings"), each linking `/rules/:id`.
- `multiple-page-scan-pages.tsx`: "Scanned pages", one row per page (worst first once completed), each linking "Open report for <route>" to `/u/scans/:id`.
- `multiple-page-scan-skipped.tsx`: a `<details>` "N pages not scanned" with each URL and its reason (`skipReasonLabels`).
- A page's own report (`scan-report-content.tsx`) links back with "View all scanned pages" when it has a `multiplePageScanID`.

## Scan history (`/u/scans`)

- `multiple-page-scan-list.tsx` → `MultiplePageScanList` comes first: a "Multiple-page scans" table (start page, pages scanned, average score, status, created; per-row "Open multiple-page scan of <url>" and "Delete multiple-page scan of <url>"). It polls while any row is active and renders nothing when there are none. The page scans below sit under a "Single-page scans" heading; `GET /scan` leaves out pages that belong to a multiple-page scan.

- `useInfiniteQuery` over `scanKeys.list(filters)`, with "Load more scans" and status and source filters (shadcn `Select` with `aria-label`s).
- The Page cell is the target (`describeScanTarget`) linking to `/u/scans/:id`.
- Actions is the report's `ScanOwnerActions` menu, its trigger named per row ("Actions for scan of <target>") and no `redirectTo`, so deleting keeps the list open.
- No screenshots in lists; screenshots appear on the report only.
- Claimed guest scans appear in `/u/scan`'s Recent scans and here, with source "Anonymous", private.

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
- A headless walkthrough found every control by its visible name: URL scan, SSRF error, the guest limit and history banner, sign-in, rendered report with screenshot, share, token create → shown once → revoke, history.
