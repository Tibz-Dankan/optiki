# Routing

`react-router-dom` 7 in **declarative** mode — `<BrowserRouter>` + `<Routes>` + `<Route>`. No `createBrowserRouter`, no loaders/actions, no `React.lazy`, no `<Suspense>`. Every page is a static import.

Route paths are string literals. There is **no route-constants module** — `@constants/urls` is the API base only.

## Access control is tree swapping, not guards

There are no `<ProtectedRoute>` wrappers and no `<Outlet>` layout routes. `App.tsx` reads the auth store and renders one of three complete `<Routes>` trees, so a signed-out visitor has no `/u/*` route definitions at all.

| Tree | When | Contains |
|---|---|---|
| Signed out | no `session.userID` | public pages + `<AuthRoutes />` (sign-in, sign-up, forgot-password, verify-otp, reset-password, verify-email) |
| Unverified | signed in, `user.emailVerified === false` | public pages + `/auth/verify-email`; everything else redirects there |
| User | signed in and verified | public pages + `/auth/*` → `/u/dashboard` + `<RenderUserRoutes />` |

Sign-in only returns a session; `emailVerified` arrives with `getMe`, so the unverified and user trees wait for `isUserResolved` (`!!user.id && !isLoadingGetMe`) and show `LoadingPage` until then — otherwise a verified user would flash through the verify-email gate.

Router-independent hooks are called directly in `App` (`useGlobalRequestInterceptor`, `useSessionRefresh`, `useGetMe`, `useGetAppearance`). A hook that needs router context goes in a null-rendering component inside `<BrowserRouter>`; none exists yet.

Prefixes: `/u/*` for the signed-in app, `/auth/*` for the auth area. Everything else is public.

### Public pages

A public page needs a `<Route>` in **each of the three trees** in `App.tsx`, because each tree is a complete `<Routes>`. Those are `/`, `/scan`, `/scans/:id`, `/rules`, `/rules/:id` and `/gym`. Forgetting one tree makes the page 404 (or redirect) for that audience only — a classic bug TestSprite will catch when it signs in.

The same page then behaves according to who is looking. `/scan` runs the 9 core rules for a signed-out or unverified visitor and all 17 for a verified user, because the server decides from the session cookie. `/scans/:id` shows a private scan only to its owner. The page never branches on the tree; it renders what the API returns (see `references/feature-pages.md`).

### Deep links on Netlify

The client is a static SPA on Netlify. `public/_redirects` holds one rule, `/*  /index.html  200`. It is what makes a direct load or refresh of `/u/settings`, `/scans/:id` or the emailed `/auth/verify-email?token=…` link reach React Router instead of Netlify's 404. Keep it; there is no server-side fallback.

## One config drives routes, sidebar, and ⌘K

`src/types/routes.ts`. One `TPage` tree is the source of truth for **both** the react-router `<Route>` elements (via `renderRoutes`) and the sidebar navigation (via `NavGroup`). `icon` is the lucide *component*, not a rendered element.

```ts
export type TPage = {
  title: string
  path: string
  icon?: React.ElementType
  highlightIcon?: boolean
  element?: ReactNode
  badge?: string
  showInSidebar: boolean
  children?: TPage[]
}

export type TNavGroup = { title?: string; pages: TPage[] }

export type TRoute = { title?: string; homePath: string; groups: TNavGroup[] }
```

`src/routes/user-routes.tsx` holds the `userRoutes` config: Dashboard under "General"; Settings (General, Account) and the `*` 404 under "Other". "General" also has Scans (`/u/scans`), and Settings has API tokens (`/u/settings/api-tokens`, which also needs an entry in `settings/ui/settings-nav.tsx`). Projects (`/u/projects`) join "General" when they're built.

- `showInSidebar: false` keeps a page routable but hidden (the `*` catch-all uses this).
- A `children` entry **with no `element`** is nav-only: it draws a collapsible sidebar group, and `renderRoutes` hoists its children into flat routes.
- The ⌘K command menu (`shared/ui/command-menu.tsx`) reads `userRoutes` directly — deliberately, so it never imports the layout and creates a cycle back through `SearchProvider`.

## Rendering helpers — reuse these

`src/routes/render-routes.tsx` provides `renderRoutes`, `flattenGroups` and `routeToPages`; don't write new traversal code. The shell wraps a **nested** `<Routes>` rather than being a layout route with `<Outlet />`:

```tsx
export const RenderUserRoutes: React.FC = () => {
  return (
    <AuthenticatedLayout routes={userRoutes}>
      <Routes>{renderRoutes(routeToPages(userRoutes))}</Routes>
    </AuthenticatedLayout>
  )
}
```

## The unauthenticated area

`src/routes/auth-routes.tsx` stays as plain `<Route>`s — these pages never appear in a sidebar. Each page renders its own `<AuthLayout>` so it can size its own card. Its catch-all `RedirectToSignIn` remembers where the visitor was heading (`?redirectTo=`), skipping it for `/auth/*` paths, which would only loop.

The `?redirectTo=` convention is used in three places and must stay consistent: that catch-all, `endSession()` (the 401 path), and the sign-out dialog. Sign-in honours `?redirectTo=` only when it is inside the same area as the server's `redirectToPath` (`/u/dashboard`) — `getRedirectPath` in `@utils/get-redirect-path` applies that rule. Navigate with `{ replace: true }`.

Password reset runs `forgot-password → verify-otp → reset-password`, carrying `email` and `otp` forward as query params; landing on `/auth/reset-password` without them redirects back to `/auth/forgot-password`. A successful reset signs the user in (and revokes their other sessions server-side).

Email verification: the emailed link opens `/auth/verify-email?token=…`. That route exists in the signed-out **and** unverified trees — people often open the link in another browser. When a signed-in user verifies, the refreshed `me` moves them into the user tree, which redirects `/auth/*` to the dashboard.

## Adding a page — checklist

1. Create `modules/<module>/pages/<name>.tsx` — kebab-case, **no `-page` suffix**, `export const <Name>: React.FC`.
2. Give it the standard shape: a `<Header>` with `Search` / `ThemeSwitch` / `ProfileDropdown`, then `<Main>`. See `references/theme-and-ui.md`.
3. Signed-in page: add one `TPage` entry to `routes/user-routes.tsx`, with a lucide `icon` and `showInSidebar`. Paths carry the `/u/` prefix. Public page: add a `<Route>` to every tree in `App.tsx`.
4. Add a TestSprite scenario for it (named as a behavior) — see the `testsprite` skill.
