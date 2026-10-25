---
name: frontend
description: Conventions for the optikí frontend in client/ — folder structure, @ import aliases, kebab-case file naming, React.FC component style, the class-singleton API layer with HttpError against the cross-site API (absolute URLs, credentials include), TanStack Query keys and hooks, T-prefixed types, zustand stores, Formik+Yup forms, the three route trees (signed-out, unverified, user), Netlify hosting, the scan / report / project / API-token pages, Tailwind v4 tokens, shadcn/ui, and the agent-legibility rules optikí's own UI must pass. Use when creating, editing, or reviewing any file under client/.
---

# optikí — frontend conventions

Applies to everything under `client/`. Nothing here concerns `server/`.

These conventions come from the GradeScript client this app was bootstrapped from. Where optikí deliberately differs, the difference is stated here — this file is the source of truth.

## Stack

| | |
|---|---|
| React | 19.2, React Compiler on (`babel-plugin-react-compiler`) |
| Build | Vite 8 (rolldown), pnpm |
| TS | ~6.0, `strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals` |
| Router | `react-router-dom` 7, **declarative** (`<BrowserRouter>`/`<Routes>`), no data router |
| Server state | `@tanstack/react-query` 5 |
| Client state | `zustand` 5 + `persist` |
| Forms | **Formik + Yup** — not react-hook-form, not zod |
| Styling | **Tailwind v4 CSS-first — there is no `tailwind.config.*` and no `postcss.config.js`** |
| UI | shadcn/ui (new-york, slate), Radix, `lucide-react`, `sonner` |
| API origin | **A different site from the page.** `constants/urls.ts` picks absolute URLs by Vite mode: `https://optikiapi.tuliime.com/api/v1` (`SERVER_URL`) and `…/client/v1` (`API_URL`) by default, `http://localhost:8000/…` in mode `localhost` |
| Hosting | Static build on Netlify (`https://optikii.netlify.app`), deployed from `main` by `.github/workflows/netlify-deploy.yaml`. `public/_redirects` (`/*  /index.html  200`) is the SPA fallback |

Consequences worth stating outright:

- **Never import `React` in app code** — `jsx: react-jsx` plus global types. Write `React.FC` / `React.ReactNode` directly. (Generated shadcn primitives under `@shared/ui` do `import * as React from 'react'`; leave them alone.)
- **Never use `forwardRef`** — React 19 passes `ref` as a normal prop.
- **Always `import type { … }`** for types — `verbatimModuleSyntax` requires it.
- **No `enum`, no `namespace`, no parameter properties** — `erasableSyntaxOnly` rejects them. Use string unions (`type TTheme = 'light' | 'dark' | 'system'`).
- **There is no frontend test tooling** (no vitest/jest). The UI is verified by the TestSprite suite (see the `testsprite` skill) and, once it exists, by the optikí GitHub Action scanning the app. Do not add test files unless asked.
- **API hosts come only from `constants/urls.ts`.** Never branch on `window.location.hostname`, hard-code a host anywhere else, or add a `VITE_*` URL. PR previews (`deploy-preview-<n>--optikii.netlify.app`) are production builds and use the production API on purpose; a new environment means a new branch in that one file.
- **Cookies cross sites.** Every call sends `credentials: 'include'`. The server sets the session cookies `SameSite=None; Secure` when deployed, so they reach `optikiapi.tuliime.com` from `optikii.netlify.app`. Browsers that block third-party cookies (Safari) will drop them; the fix is to serve the client from a `*.tuliime.com` domain, not a client-side workaround.

Commands:

- `pnpm dev:local` → `vite --mode localhost`: the API on `http://localhost:8000` (run `make run` in `server/`).
- `pnpm dev` → the **production** API. Use it only to reproduce a production issue.
- `pnpm build` (`tsc -b && vite build`, always the production URLs) · `pnpm lint` · `pnpm format`.

## Folder map

```
client/src/
├── api/          one class per resource + its query-key factory  (auth, appearance, scan, api-token, rules, gym, site-visit, http-error)
├── constants/    urls.ts (SERVER_URL, API_URL, API_ORIGIN), scan.ts, api-token.ts, fonts.ts, session.ts
├── hooks/        cross-cutting hooks — use-session-refresh.ts, use-get-me.ts, use-mobile.ts, …
├── providers/    app-wide context — theme, font, direction, layout, search, react-query, index.tsx
├── routes/       user-routes.tsx, auth-routes.tsx, render-*.tsx
├── stores/       zustand stores — auth.ts, appearance.ts, anonymous.ts
├── styles/       index.css (Tailwind entry) + theme.css (design tokens)
├── types/        T-prefixed aliases, one file per domain  (alias @typings)
├── utils/        one function per file — classname.ts, cookies.ts, end-session.ts, refresh-session.ts,
│                 get-redirect-path.ts, format-date-time.ts, get-initials.ts, get-browser-label.ts
└── modules/      feature modules: auth, dashboard, home, settings, shared
    └── <module>/
        ├── pages/   route-level screens
        ├── layout/  shells for that area
        └── ui/      components for that area
```

Feature modules (same shape):

- `scan`: playground, report, history
- `rules`: catalog
- `gym`: fixture index
- `api-token`: token management under settings
- `project` comes with projects

`home/layout/home-layout.tsx` is the shell for every public page. `references/feature-pages.md` has the pages, routes, API classes, keys and types.

The non-obvious calls — get these wrong and the code stops matching the codebase:

- **`utils/`, not `lib/`.** `cn` lives at `@utils/classname`, never `@/lib/utils`.
- **`stores/` is plural**, `types/` is aliased `@typings`, context lives in `providers/`.
- **There is no top-level `src/components/`.** Every component lives under `src/modules/`.
- **Module subfolders are `pages/ layout/ ui/`** — `ui/`, never `components/`.
- **Shared components go in `src/modules/shared/ui/`** (alias `@shared/ui`), shadcn primitives and hand-written widgets side by side.
- There is no `src/config/`; config-shaped data lives in `constants/` or `routes/*-routes.tsx`.

## Import aliases

Use aliases, never `../../..`. Relative `./x` is fine within the same folder.

| Alias | Path |
|---|---|
| `@api/*` | `src/api/*` |
| `@constants/*` | `src/constants/*` |
| `@hooks/*` | `src/hooks/*` |
| `@modules/*` | `src/modules/*` |
| `@providers/*` | `src/providers/*` |
| `@routes/*` | `src/routes/*` |
| `@shared/*` | `src/modules/shared/*` |
| `@stores/*` | `src/stores/*` |
| `@styles/*` | `src/styles/*` |
| `@typings/*` | `src/types/*` |
| `@utils/*` | `src/utils/*` |
| `@/*` | `src/*` |

`@typings`, not `@types`: TypeScript reserves the `@types/` prefix for ambient packages and rejects it as an import (TS6137).

Adding or changing an alias means editing **three** files that must stay in sync: `vite.config.ts` (`resolve.alias`), `tsconfig.app.json` (`compilerOptions.paths`), and `tsconfig.json` (a duplicate copy — the shadcn CLI reads only the root tsconfig and cannot follow project references).

## Import order

Prettier sorts imports via `@trivago/prettier-plugin-sort-imports`. Write them in this order so `pnpm format` is a no-op:

```
node: → vite → @vitejs → react → react-dom/client → react/* → react-router-dom
→ formik → yup → @radix-ui/* → @tanstack/react-query → <other third party>
→ @/assets → @constants → @typings → @api → @stores → @utils
→ @providers → @hooks → @routes
→ @shared/ui → @shared/layout → @shared → @modules → @/ → ./relative
```

No blank lines between groups (`importOrderSeparation: false`). Prettier config: no semicolons, single quotes including JSX, 2-space, 80 columns, `trailingComma: es5`.

## Naming

**Every file and folder is kebab-case, no exceptions** — including `@shared/ui`, deliberately, so shadcn CLI output matches hand-written files. `.tsx` only when the file contains JSX, otherwise `.ts`.

| Kind | File | Symbol | Example |
|---|---|---|---|
| Page | `<name>.tsx` — **no suffix** | `PascalCase` | `modules/auth/pages/sign-in.tsx` → `SignIn` |
| Error page | `<name>-error.tsx` | `XError` | `shared/pages/not-found-error.tsx` → `NotFoundError` |
| Layout | `<name>-layout.tsx` | `XLayout` | `modules/auth/layout/auth-layout.tsx` → `AuthLayout` |
| Dialog | `<name>-dialog.tsx` — one dialog per file | `XDialog` | `modules/settings/ui/change-password-dialog.tsx` → `ChangePasswordDialog` |
| UI widget | `<name>.tsx` | `PascalCase` | `shared/ui/password-input.tsx` → `PasswordInput` |
| Hook | `use-<name>.ts(x)` | `useX` | `hooks/use-session-refresh.ts` → `useSessionRefresh` |
| API | `<resource>.ts` | `class XAPI` + `export const xAPI` | `api/auth.ts` → `authAPI` |
| Query keys | same file as the API | `xKeys` | `api/auth.ts` → `authKeys` |
| Types | `<domain>.ts` | `T`-prefixed aliases | `types/auth.ts` → `TUser`, `TSignInInput` |
| Store | `<domain>.ts` — no `-store` | `useXStore` | `stores/auth.ts` → `useAuthStore` |
| Provider | `<name>.tsx` — no `-provider` | `XProvider` + `useX` | `providers/theme.tsx` → `ThemeProvider`, `useTheme` |
| Route config | `<audience>-routes.tsx` | `camelCase: TRoute` | `routes/user-routes.tsx` → `userRoutes` |
| Route renderer | `render-<audience>-routes.tsx` | `RenderXRoutes` | `routes/render-user-routes.tsx` |
| Util | verb-first kebab, one fn per file | `camelCase` | `utils/get-browser-label.ts` → `getBrowserLabel` |

Three rules that trip people up:

- **Pages carry no `-page` suffix** — the `pages/` folder already says it.
- **Every dialog lives in its own `<name>-dialog.tsx` file.** Never inline a `Dialog` or `ConfirmDialog` in a page, section or layout. The dialog owns its mutation, toasts and invalidation; the parent keeps only the open state (or the target row) and passes it in with `onOpenChange`. References: `shared/ui/sign-out-dialog.tsx`, `settings/ui/revoke-session-dialog.tsx`.
- **No barrel files.** Import the concrete path: `import { Button } from '@shared/ui/button'`. The only `index.*` files are `providers/index.tsx` (the `<Providers>` composition), `types/index.d.ts` (ambient `Prettify<T>`), and `styles/index.css` (Tailwind entry) — none is a re-export barrel.

## Component style

Named `export const` with an explicit `React.FC`, props type declared locally above it and **not exported**:

```tsx
type ScoreGaugeProps = {
  label: string
  score: number
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ label, score }) => {
  return <div>…</div>
}
```

Props types use `type`, not `interface`. A few ported files still declare `interface XProps` (`providers/direction.tsx`, `providers/font.tsx`, `shared/layout/nav-group.tsx`, some `@shared/ui` widgets) — don't add new ones, don't churn existing ones.

No default exports (`useDialogState` is the single grandfathered exception). Two documented deviations from the `React.FC` rule:

- **shadcn primitives in `@shared/ui`** keep upstream style — `function Button({ … }: React.ComponentProps<'button'>)`, a `data-slot='button'` attribute, and a trailing `export { Button, buttonVariants }`. Don't rewrite generated files; `eslint.config.js` already exempts that folder.
- **Plain helpers** use `export function` (`cn`, `getInitials`, `getCookie`, `useIsMobile`).

**Comments: default to none.** The code carries its own explanation — naming, types, and small functions. Write one only when behaviour is genuinely surprising and the reason is not recoverable from the code. One short line above the line it explains — never a JSDoc block, never a file header. Directive comments (`eslint-disable*`, `@ts-expect-error`) and `TODO:` markers are exempt. Generated shadcn primitives keep their upstream comments.

## Agent-legibility rules for optikí's own UI

optikí audits pages for AI-agent and screen-reader legibility. Its own UI is driven by TestSprite's AI tester and will be scanned by optikí's own GitHub Action. It must pass its own rules:

- **Real controls.** Clickable things are `<button>` / `<a href>` (or shadcn `Button`, which renders one). Never an `onClick` on a `div`/`span`.
- **Never put controls inside `role="img"`** or any presentational wrapper. Charts and gauges are decorative SVG (`aria-hidden`) **plus** a visible or `sr-only` text equivalent with the same numbers.
- **`aria-label` must contain the visible text** (WCAG 2.5.3). Prefer no `aria-label` when the visible text already names the control. Icon-only buttons get a name (`sr-only` span or `aria-label`).
- **Distinct names for look-alike controls.** Per-row actions carry the row's identity in their name ("Revoke session Chrome on Linux", "Revoke token CI deploy", "Delete scan of /pricing" — not five "Revoke"s) when a page repeats them.
- **Never render scanned markup.** Finding snippets are user-controlled HTML: show them as text in `<pre><code>`, never through `dangerouslySetInnerHTML`.
- **Every field has a `<label>`** — `FormField` provides it; placeholder text is never the label.
- **Settled UI, fast.** Entrance animations never gate interactivity and finish within ~1 s; nothing important appears only on hover.
- **No native `confirm()` / `alert()` / `prompt()`** — use `ConfirmDialog`.
- **Contrast meets WCAG AA** — use the theme tokens; they are tuned for it.

## Recipes

**Add a page** → create `modules/<module>/pages/<name>.tsx` (no `-page`), then add one `TPage` entry to `routes/user-routes.tsx`. That single entry produces the route, the sidebar item, **and** the ⌘K command-menu entry. A public page (`/scan`, `/scans/:id`, `/rules`, `/rules/:id`, `/gym`) instead gets a `<Route>` in **every** tree in `App.tsx`. Either way, add the path → page name entry to `server/internal/data/siteVisitPageNames.go`, or its visits are recorded as "Page Not Found". → `references/routing.md`

**Add an API resource** → `src/api/<resource>.ts`: a class with arrow-property methods, a singleton export, and a `<resource>Keys` factory. → `references/data-layer.md`

**Read data** → `useQuery` with a key from the factory. **Write data** → `useMutation` + `invalidateQueries` by key prefix in `onSuccess`. → `references/data-layer.md`

**Add a form** → Formik `useFormik` + a module-level Yup schema + `@shared/ui/form-field`. → `references/forms.md`

**Add a color token** → edit `src/styles/theme.css` in **three** places: `:root`, `.dark`, and `@theme inline`. → `references/theme-and-ui.md`

**Add a shadcn component** → `pnpm dlx shadcn@latest add <component>`. `components.json` routes it to `@shared/ui` with `cn` from `@utils/classname`. Leave the generated style as-is.

**Add a type** → `src/types/<domain>.ts`, `T`-prefixed, response types intersected with `TServerResponseStatus`. Reason codes the server emits in `error` (`EMAIL_NOT_VERIFIED` today; `SSRF_BLOCKED`, `TOO_LARGE`, `NOT_HTML`, `FETCH_TIMEOUT`, `RENDER_TIMEOUT`, `RENDERER_BUSY` with scans) are added to `TServerErrorName` in `types/server-response.ts`. → `references/data-layer.md`

## What was deliberately dropped from GradeScript

The admin tree (`/a/*`), Google sign-in, the sign-in OTP, avatars and every file upload, organizations, billing, banners, the separate developer console. Don't reintroduce them by pattern-matching on GradeScript code.

**Ported from the GradeScript console:** the API-key screens become optikí's API-token settings page (`references/feature-pages.md`):

- the table with prefix, permissions, status, expiry and last use
- the create dialog with permission checkboxes and expiry presets
- the shown-once dialog that can't be dismissed by an outside click
- the revoke and delete confirmations

## Site visits

Ported from GradeScript, capture only (there is no page that reads visits):

- `<PageCapturer />` is the first child of `<BrowserRouter>` in `App.tsx` and renders `null`. `useCapturePageVisit` posts `{ path, capturedAt, anonymousID, device }` to `POST /sitevisit` on every pathname change.
  - `path` is `pathname` only, never the query string.
  - `device` is `getBrowserLabel(navigator.userAgent)`.
  - The same pathname twice in a row is skipped: remounts (StrictMode, `App` swapping route trees) would otherwise double-count it.
  - The mutation overrides the global error toast with a no-op, so a failed capture never reaches the visitor.
- **The server resolves the page name** from the path (`server/internal/data/siteVisitPageNames.go`). The client keeps no copy of that table.
- `stores/anonymous.ts` persists one `anonymousID` per browser. Read it through `getAnonymousID()` (`@utils/get-anonymous-id`), which creates and persists the ID on first use: zustand's `persist` writes nothing until a `set`, so an ID made in the initial state would change on every load.
- After any new session (sign-in, sign-up, reset-password, session refresh), call `reconcileAnonymousUser(userID)` from `@utils/reconcile-anonymous-user`. It is fire-and-forget and links that browser's anonymous visits to the user.
- Every sign-out path (`sign-out-dialog.tsx`, `use-sign-out-locally.ts`, `end-session.ts`) calls `clearAnonymousID()` beside `clearAuth()`, so later anonymous browsing isn't linked to the previous user.
- The device and anonymous ID travel in the request body, not as global `X-Device`/`X-Anonymous-ID` headers as in GradeScript. Custom headers would need a CORS change, and a PR preview built before that change reached production would break every API call.

## References

| File | Read it when |
|---|---|
| `references/data-layer.md` | Touching `api/`, `types/`, `stores/`, or anything with `useQuery`/`useMutation` |
| `references/routing.md` | Adding a page, changing navigation, or working on auth redirects |
| `references/theme-and-ui.md` | Writing components, styling, tokens, layouts, dialogs, or providers |
| `references/forms.md` | Building or editing any form |
| `references/feature-pages.md` | Building the scan playground, report, scan history, projects, API tokens, rules or Gym pages |
