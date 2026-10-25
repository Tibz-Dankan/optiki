# Theme, UI, layouts, providers

## Tailwind v4, CSS-first

**There is no `tailwind.config.*` and no `postcss.config.js`.** Everything is declared in CSS via `@tailwindcss/vite`.

`src/styles/index.css` is the entry:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import './theme.css';

@custom-variant dark (&:is(.dark *));

@layer base { /* border-border, scrollbars, cursor-pointer buttons, 16px mobile inputs */ }

@utility container { margin-inline: auto; padding-inline: 2rem; }
@utility no-scrollbar { … }
@utility faded-bottom { … }

/* Collapsible sidebar sub-menus (used by nav-group.tsx) */
.CollapsibleContent[data-state='open'] { animation: slideDown 300ms ease-out; }
```

Custom utilities available: `container`, `no-scrollbar`, `faded-bottom`, plus the `.CollapsibleContent` animation class.

## Design tokens — the three-place rule

`src/styles/theme.css` defines the palette. **Adding or renaming a token means editing it in three places: `:root`, `.dark`, and `@theme inline`.** The `@theme inline` block is what bridges a CSS variable to a Tailwind utility name (`--color-primary` → `bg-primary`); skip it and the utility silently doesn't exist.

```css
:root {
  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.129 0.042 264.695);
  --primary: oklch(0.509 0.087 215.1); /* #0b7285 */
  --primary-foreground: oklch(0.984 0.003 247.858);
  /* … card, popover, secondary, muted, accent, destructive, border, input, ring,
       chart-1…5, and the sidebar-* aliases */
}

.dark {
  --background: oklch(0.1723 0.016 261.51); /* #0c1017 */
  --card: oklch(0.2077 0.0155 261.51);
  --popover: oklch(0.24 0.016 261.51);
  --secondary: oklch(0.295 0.0156 261.51);
  --muted: oklch(0.295 0.0156 261.51);
  --accent: oklch(0.295 0.0156 261.51);
  --primary: oklch(0.77 0.119 207.6); /* #3bc9db */
  --primary-foreground: oklch(0.2077 0.0155 261.51);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 18%);
  /* … */
}

@theme inline {
  --font-inter: 'Inter', 'sans-serif';
  --font-manrope: 'Manrope', 'sans-serif';
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius); /* lg, xl, 2xl–4xl also = --radius: nothing rounds past 8px */
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* … one --color-* per token */
}
```

Light-mode neutrals are shadcn's `slate` scale. **Dark mode is a separate near-neutral charcoal ramp** — hue `261.51`, chroma `~0.016` — anchored at `--background: oklch(0.1723 0.016 261.51)` (`#0c1017`) and stepped up per surface: card `0.2077` → popover `0.24` → secondary/muted/accent `0.295`. Do not copy `slate` values into `.dark`; pick the nearest step on that ramp instead.

The brand is optikí teal `#0b7285` → `oklch(0.509 0.087 215.1)` — 5.6:1 against white text — lifted to `#3bc9db` → `oklch(0.77 0.119 207.6)` in dark mode, where `--primary-foreground` is the dark card tone (8.3:1). **Any new colour pairing must meet WCAG AA (4.5:1 for text)** — optikí audits accessibility, so it cannot ship contrast failures itself. `--sidebar-*` are aliases of the base tokens and are declared **only** in `:root` — since `.dark` sits on the same `<html>` element they resolve to the dark values automatically, so never redeclare them.

**Use tokens, never raw colors.** `bg-primary`, `text-muted-foreground`, `border-border`, `text-destructive` — not `bg-teal-700` or hex values.

Dark mode is class-based on `<html>` (`@custom-variant dark (&:is(.dark *))`), driven only by `ThemeProvider`. Fonts load via Google Fonts `<link>` in `index.html` and are exposed as `--font-inter` / `--font-manrope`; the options list lives in `constants/fonts.ts`.

## Styling conventions

- **Conditional classes always go through `cn()`** from `@utils/classname`, one class group per line:
  ```tsx
  className={cn(
    '@container/content',
    'has-data-[layout=fixed]:h-svh',
    className
  )}
  ```
  Boolean guards for one-way classes (`fixed && 'sticky top-0'`), ternaries only for either/or. No
  per-branch comments — the class names say what they do.
- **Logical properties only.** `ms-` `me-` `ps-` `pe-` `text-start` `text-end` `inset-s-` `inset-e-` — **never** `ml-` `mr-` `text-left` `text-right`. `DirectionProvider` supports RTL and physical properties break it.
- **Container queries** inside the app shell, not viewport queries: `@container/content`, `@7xl/content:max-w-7xl`.
- **Data-attribute variants** for state: `data-[state=open]:`, `data-[active=true]:`, `group-data-[collapsible=icon]:`, `peer-data-[variant=inset]:`, `has-data-[layout=fixed]:`.
- JSX strings are single-quoted, no semicolons. Prettier sorts classes inside `cn()` and `clsx()` automatically.

## shadcn/ui

Config in `components.json`: style `new-york`, base color `slate`, CSS variables on, lucide icons, output aliased to `@shared/ui` with `cn` from `@utils/classname`.

```bash
pnpm dlx shadcn@latest add <component>
```

Generated primitives keep their upstream style — do not rewrite them to the app's `React.FC` convention:

- `function Button({ className, variant, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>)`
- a `data-slot='button'` attribute on the root element
- `asChild` via `@radix-ui/react-slot`
- no `forwardRef` (React 19)
- trailing `export { Button, buttonVariants }`

`eslint.config.js` already turns off `react-refresh/only-export-components` and `react-hooks/purity` for `src/modules/shared/ui/**/*.tsx` so that output stays lint-clean.

Variants use `cva`, and only where upstream does (`button.tsx`, `badge.tsx`, `sidebar.tsx`):

```tsx
const buttonVariants = cva('inline-flex items-center justify-center …', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
      destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
      outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      default: 'h-9 px-4 py-2 has-[>svg]:px-3',
      sm: 'h-8 rounded-md gap-1.5 px-3',
      lg: 'h-10 rounded-md px-6',
      icon: 'size-9',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})
```

Hand-written widgets in the same folder (`password-input`, `form-field`, `confirm-dialog`, `theme-switch`, `profile-dropdown`, `command-menu`, `search`, …) use the app's `export const X: React.FC<XProps>` style.

`table`, `tabs`, `textarea` and `checkbox` are installed; use `table` for every list. Notably absent: shadcn `form` (Formik instead), `calendar`, `toast` (sonner instead).

**After `pnpm dlx shadcn@latest add …`, check the generated imports.** The CLI can add the umbrella `radix-ui` package and an unrelated npm package named `cn`. Remove both, and import from `@radix-ui/react-<name>` and `@utils/classname` like the other primitives.

## Providers

`src/providers/index.tsx`, outermost first. Two orderings here are load-bearing: `ThemeProvider` sits above the `Toaster` because `<Toaster />` reads the resolved theme, and `<Toaster />` renders **before** `{children}`, not after — sibling effects run in tree order, so this is what guarantees it has subscribed to sonner's store by the time a page's mount effect fires a toast. `SearchProvider` and `LayoutProvider` are deliberately not here; they are scoped to the authenticated shell.

```tsx
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ReactQueryProvider>
      <ThemeProvider>
        <FontProvider>
          <DirectionProvider>
            <Toaster duration={5000} />
            {children}
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
```

Full order: `StrictMode` → `ReactQueryProvider` → `ThemeProvider` → `FontProvider` → `DirectionProvider` → `<Toaster />` → `App`/`BrowserRouter` → *(authenticated only)* `SearchProvider` → `LayoutProvider` → `SidebarProvider`.

### Writing a new provider

The cookie-backed UI-preference recipe, followed by `theme.tsx`, `font.tsx`, `layout.tsx`, `direction.tsx`:

1. `const XContext = createContext<TXContext | null>(null)` — nullable, so misuse is detectable.
2. Lazy initial state from the cookie: `useState(() => (getCookie(KEY) as T) || DEFAULT)`.
3. The setter writes the cookie **then** the state; expose a `resetX()` that calls `removeCookie`.
4. Apply the effect to `document.documentElement` in a `useEffect`.
5. **React 19 idiom — render the context directly**: `<XContext value={contextValue}>`, not `<XContext.Provider>`. (`sidebar.tsx` still uses `.Provider` because it is generated shadcn code.)
6. Export a `useX()` hook that throws when used outside the provider, prefixed with `// eslint-disable-next-line react-refresh/only-export-components`.

Cookies go through `@utils/cookies` (`getCookie` / `setCookie` / `removeCookie`, `DEFAULT_MAX_AGE` 7d). These are UI preferences only — the auth cookies are httpOnly and invisible to JS.

Provider-scoped state that only the authenticated shell needs (`SearchProvider`, `LayoutProvider`) stays inside `AuthenticatedLayout`. Don't promote it to the global tree.

## Layouts

| Shell | File | Used by |
|---|---|---|
| `AuthenticatedLayout` | `shared/layout/authenticated-layout.tsx` | `/u/*` |
| `AuthLayout` | `auth/layout/auth-layout.tsx` | each `/auth/*` page renders it itself |
| `HomeLayout` | `home/layout/home-layout.tsx` | every public page (`/`, `/scan`, `/scans/:id`, `/rules`, `/rules/:id`, `/gym`) — header with the Scan / Rules / Gym nav, `<main id='content'>`, footer |

`AuthenticatedLayout` composes `SearchProvider` → `LayoutProvider` → `SidebarProvider` → `SkipToMain` + `AppSidebar` + `SidebarInset`, reading the sidebar's open state from the `sidebar_state` cookie. `AppSidebar` maps `routes.groups` to `<NavGroup>`, so navigation follows from the route config.

### Canonical page shape

```tsx
export const Dashboard: React.FC = () => {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Dashboard
          </h1>
          <p className='text-muted-foreground'>One line on what the page is for.</p>
        </div>
      </Main>
    </>
  )
}
```

Pages compose `<Header>` and `<Main>` themselves — the shell doesn't provide them. `<Main>` sets `data-layout={fixed ? 'fixed' : 'auto'}`, which is what the shell's `has-data-[layout=fixed]` selectors key off, and applies the `@7xl/content` max width unless `fluid`.

Public shells share a pattern: `flex min-h-svh flex-col bg-background text-foreground`, a `sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur` header, `<main id='content' className='flex-1'>`, and a `border-t border-border` footer.

## Toasts, dialogs, overlays

**Toasts — sonner only.** `<Toaster duration={5000} />` is mounted once in `Providers`. Call sites just `import { toast } from 'sonner'` and use `toast.success(...)` / `toast.error(...)`. Remember that mutation errors already toast globally.

**Confirmations — `@shared/ui/confirm-dialog`**, built on Radix AlertDialog. Its props are a discriminated union forcing either a `form` id (submit) or a `handleConfirm` callback, never both:

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={onOpenChange}
  title='Sign out'
  desc='Are you sure you want to sign out?'
  confirmText='Sign out'
  destructive
  isLoading={isPending}
  handleConfirm={() => mutate()}
  className='sm:max-w-sm'
/>
```

**One dialog per file.** Every dialog — `ConfirmDialog` or a full `Dialog` — is its own `<name>-dialog.tsx` component exporting `XDialog`, never markup inlined in a page, section or layout. The dialog owns its `useMutation`, toasts and query invalidation; the parent holds only the open state or the target row and renders `<XDialog open|target={…} onOpenChange={…} />`. See `shared/ui/sign-out-dialog.tsx` (plain confirmation), `settings/ui/revoke-session-dialog.tsx` (confirmation over a selected row, with a details body as `children`), and `settings/ui/change-password-dialog.tsx` (form dialog).

**Open state — `useDialogState`** (`@hooks/use-dialog-state`, the one default export in the codebase). It carries *which* dialog is open, not just whether:

```ts
const [open, setOpen] = useDialogState<'edit' | 'delete'>()
setOpen('edit')   // open
setOpen(null)     // close
```

**Dropdowns** always use `<DropdownMenu modal={false}>` so the page doesn't scroll-lock.

**Command palette** — `shared/ui/command-menu.tsx` (cmdk) is driven by `SearchProvider`'s ⌘K/Ctrl-K listener and reads `userRoutes` directly.
