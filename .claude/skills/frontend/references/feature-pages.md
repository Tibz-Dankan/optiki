# Feature pages: scans, projects, API tokens, rules, Gym

What each feature module contains and which server contract it reads. The server side is in the backend skill (`references/scans.md`, `projects.md`, `api-tokens.md`); the shapes below mirror those responses. Every page follows `theme-and-ui.md`, every form `forms.md`, every dialog the one-dialog-per-file rule.

## Routes

| Path | Tree | Module · page | Notes |
|---|---|---|---|
| `/scan` | all three | `scan/pages/scan.tsx` → `Scan` | the playground |
| `/scans/:id` | all three | `scan/pages/scan-report.tsx` → `ScanReport` | one report; share link |
| `/rules`, `/rules/:id` | all three | `rules/pages/rules.tsx`, `rule.tsx` | catalog |
| `/gym` | all three | `gym/pages/gym.tsx` | fixture index; links open `/gym/pages/<id>.html` on the API origin |
| `/u/scans` | user | `scan/pages/scans.tsx` → `Scans` | history, a `TPage` under "General" |
| `/u/projects`, `/u/projects/:id` | user | `project/pages/projects.tsx`, `project.tsx` | `TPage`s under "General" (`:id` with `showInSidebar: false`) |
| `/u/settings/api-tokens` | user | `api-token/pages/api-tokens.tsx` → `APITokens` | a child of Settings |

Public pages render for everyone, and the server decides what each visitor gets. The page reads `ruleSet`, `mode` and `isOwner` from the response; it never infers them from the route tree.

## API classes, keys and types

| File | Class · singleton | Keys | Types file |
|---|---|---|---|
| `api/scan.ts` | `ScanAPI` · `scanAPI`: `create`, `getAll(limit, cursor, filters)`, `getOne(id)`, `update(id, input)`, `delete(id)` | `scanKeys = { all, list(filters), detail(id) }` | `types/scan.ts` |
| `api/project.ts` | `ProjectAPI` · `projectAPI`: `create`, `getAll`, `getOne`, `update`, `delete` | `projectKeys = { all, list(), detail(id) }` | `types/project.ts` |
| `api/api-token.ts` | `APITokenAPI` · `apiTokenAPI`: `create`, `getAll`, `getPermissions`, `update`, `revoke`, `delete` | `apiTokenKeys = { all, list(), permissions() }` | `types/api-token.ts` |
| `api/rules.ts` | `RulesAPI` · `rulesAPI`: `getAll(set?)`, `getOne(id)` | `rulesKeys = { all, list(set), detail(id) }` | `types/rules.ts` |
| `api/gym.ts` | `GymAPI` · `gymAPI`: `getAll` | `gymKeys = { all, list() }` | `types/gym.ts` |

All of these use `SERVER_URL` (`/api/v1`). The client never calls `/client/v1`.

Core types (string unions, ISO date strings, nullable where the server sends `null`):

```ts
export type TScanRuleSet = 'CORE' | 'FULL'
export type TScanMode = 'STATIC' | 'RENDERED'
export type TScanStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'
export type TScanInputType = 'HTML' | 'URL' | 'GYM'
export type TScanTriggeredBy = 'ANONYMOUS' | 'USER' | 'API_TOKEN'
export type TScanVisibility = 'PRIVATE' | 'PUBLIC'
export type TSeverity = 'CRITICAL' | 'SERIOUS' | 'MODERATE' | 'MINOR'
export type TRuleCategory = 'OPERABLE' | 'PERCEIVABLE' | 'STABLE' | 'DISCOVERABLE'
export type TRuleResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'NEEDS_RENDERED'

export type TScanScores = {
  overall: number | null
  operable: number | null
  perceivable: number | null
  stable: number | null
  discoverable: number | null
}

export type TScanSummary = {
  id: string
  title: string | null
  visibility: TScanVisibility
  status: TScanStatus
  triggeredBy: TScanTriggeredBy
  inputType: TScanInputType
  mode: TScanMode
  ruleSet: TScanRuleSet
  isOwner: boolean
  target: { url: string | null; finalURL: string | null; gymPageID: string | null; route: string; httpStatus: number | null; pageTitle: string | null; pageLang: string | null }
  scores: TScanScores
  counts: { findings: number; critical: number; serious: number; moderate: number; minor: number; rulesPassed: number; rulesFailed: number; rulesNotApplicable: number; rulesNeedRendered: number; findingsTruncated: boolean }
  project: { id: string; name: string } | null
  error: { code: string; message: string } | null
  createdAt: string
}

export type TScanReport = TScanSummary & { rules: TScanRuleResult[]; findings: TScanFinding[] }

export type TAPITokenPermission =
  | 'scan:create:own' | 'scan:view:own' | 'scan:edit:own' | 'scan:delete:own'
  | 'project:create:own' | 'project:view:own' | 'project:edit:own' | 'project:delete:own'
export type TAPITokenStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED'
export type TCreatedAPIToken = TAPIToken & { token: string }
```

## Scan playground (`/scan`)

- Three inputs, as tabs: **Paste HTML** (a `<textarea>` with a label), **URL** (an `<input type="url">`), **Gym example** (a list of "Load example" buttons, one per pair, named by scene and rule: "Load example Ring (OPT-101, broken)").
  - TestSprite never types long HTML; it presses a Load example button.
- One **Scan** button submits `scanAPI.create`. On success, navigate to `/scans/:id`. Signed-in users' scans also invalidate `scanKeys.all`.
- A verified user also sees an optional title and a project picker (their projects).
- Error states, keyed on `error.error`:

| Reason | Message |
|---|---|
| `SSRF_BLOCKED` | "This address isn't allowed" |
| `TOO_LARGE` | "That page is over 2 MB" |
| `NOT_HTML` | "That address didn't return an HTML page" |
| `FETCH_TIMEOUT` / `RENDER_TIMEOUT` | "That page took too long to load" |
| `RENDERER_BUSY` / 429 | "Too many scans — try again in N seconds" (from `Retry-After`) |

- Show these inline under the form (`role='alert'`), and replace the global toast with a local `onError`.

## Report (`/scans/:id`)

- The header shows:
  - the overall score and the four category scores **as visible numbers**
  - a gauge, which is a decorative SVG with `aria-hidden` (the numbers are the accessible content)
  - a category with `null` shows "—"; a `NEEDS_RENDERED` category says "needs rendered scan"
- Badges show `mode` (Static / Rendered) and `ruleSet`.
  - On `CORE`, a banner: "Ran the 9 core rules. Sign in to run all 17 and render URLs." The sign-in link carries `?redirectTo=` back to `/scan`.
- The rules list is grouped by category. Each rule shows ID, name, severity and result, with a link to `/rules/:id`.
- Each failing rule's findings show:
  - the severity
  - `message`
  - `accessibleName`, `selectorPath`, and the `snippet` as escaped text in `<pre><code>`
  - the rule's "How to fix" before/after, from the rules catalog
- Owner controls appear only when `isOwner`:
  - **Share** toggles `visibility`; its name says the state ("Make scan public" / "Make scan private").
  - **Copy link**.
  - **Delete scan**, through `delete-scan-dialog.tsx`.
- A `FAILED` scan shows its `error.message` and a "Scan again" button that prefills the playground.
- A 404 shows `NotFoundError`. That covers missing scans and other users' private ones alike; don't explain which.

## Scan history (`/u/scans`)

- A `useInfiniteQuery` table: target, title, scores, mode, rule set, project, created, status. Plus "Load more scans".
- Filters: project, status, input type, triggered by. Changing one resets the list.
- Row actions are named per row ("Open scan of /pricing", "Delete scan of /pricing").

## Projects (`/u/projects`, `/u/projects/:id`)

- The list is a table: name, repository, scans count, latest score, last scanned. "New project" opens `create-project-dialog.tsx` (name, description, base URL, repository).
- The detail page shows the project fields, with Edit (`edit-project-dialog.tsx`) and Delete (`delete-project-dialog.tsx`). The delete copy says "Its scans stay in your history". Below that, the project's scans (`scanAPI.getAll` with `projectID`), and "Scan this project", which opens `/scan` prefilled with `baseURL` and the project.
- Projects created by a token show "Created by token <name>" when `apiTokenID` is set.

## API tokens (`/u/settings/api-tokens`)

Ported from the GradeScript console's API-key page.

- **Table** columns:
  - Name
  - Token: `opt_<prefix>_••••` in monospace
  - Permissions: badges
  - Status: Active / Expiring soon (within 7 days) / Expired / Revoked
  - Expires · Last used · Created
  - Actions: a dropdown with "Edit token <name>", "Revoke token <name>" (disabled when revoked), "Delete token <name>"
- **`create-api-token-dialog.tsx`**:
  - Formik + Yup: name required, ≤ 64.
  - At least one permission. Checkboxes come from `apiTokenAPI.getPermissions`, each with its description; `scan:create:own` and `scan:view:own` are ticked by default.
  - Expiry presets 30 days (default), 90 days, 1 year, custom (≥ tomorrow), or "No expiry" with a warning.
- **`api-token-created-dialog.tsx`**, shown once with the `token` from the create response:
  - It **can't be closed by an outside click or Escape** (`onInteractOutside` / `onEscapeKeyDown` → `preventDefault`).
  - A Copy button, a warning ("You won't see this token again"), and a curl sample built from `API_URL`:
    ```bash
    curl -X POST "$OPTIKI_API_URL/scan" \
      -H "Authorization: Bearer $OPTIKI_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"url":"https://example.com"}'
    ```
  - An "I've saved my token" button. The token lives only in the dialog's local state, and is dropped when it closes. Never in a store, a query cache entry, or `localStorage`.
- `edit-api-token-dialog.tsx` (name, permissions), `revoke-api-token-dialog.tsx` and `delete-api-token-dialog.tsx` (both `ConfirmDialog`). Every mutation invalidates `apiTokenKeys.all`.

## Rules (`/rules`, `/rules/:id`) and Gym (`/gym`)

- `/rules` lists every rule grouped by category, with ID, name, severity, priority and a "Core" / "Full" tag.
- `/rules/:id` shows:
  - why agents fail
  - the fix with its before/after snippets (as text)
  - the WCAG reference
  - the origin note
- `/gym` lists the pairs from `gymAPI.getAll`. Each has "Open broken page" / "Open fixed page" links (to the API origin's `/gym/pages/…`) and "Scan broken page" / "Scan fixed page" buttons that prefill the playground.
