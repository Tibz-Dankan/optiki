# Data layer — API, query keys, TanStack Query, types, stores

## State ownership

| Kind of state | Where it lives |
|---|---|
| Server data | TanStack Query. Never mirrored into zustand. |
| Session / identity | zustand + `persist` (`stores/auth.ts`) — plus the theme mirror `stores/appearance.ts` |
| UI preferences (theme, font, direction, layout) | React context + cookies (`providers/*`) |
| Ephemeral UI (search dialog, sidebar) | Context scoped to `AuthenticatedLayout`, not global |

---

## API layer

One class per resource in `src/api/<resource>.ts`. Methods are **arrow-function class properties** so they can be passed bare as `mutationFn: authAPI.signIn` without losing `this`. Each takes one typed object argument, declares a typed `Promise` return, and ends with the same line.

```ts
// src/api/auth.ts
import { SERVER_URL } from '@constants/urls'
import type { TAuthResponse, TSignInInput } from '@typings/auth'
import { throwOnError } from './http-error'

class AuthAPI {
  signIn = async ({
    email,
    password,
  }: TSignInInput): Promise<TAuthResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/signin`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return (await throwOnError(response)).json()
  }
}

export const authAPI = new AuthAPI()
```

Rules:

- Raw `fetch`, no axios. Base URL is always `SERVER_URL` from `@constants/urls`.
- `credentials: 'include'` on **every** call — sessions are httpOnly cookies, never bearer tokens. JS never sees `accessToken`/`refreshToken`.
- Every response goes through `throwOnError`. Never `response.json()` unguarded.
- Query params are built inline in the template literal: `` `${SERVER_URL}/auth/user/session?limit=${limit}&cursor=${cursor}` ``.
- **Never put `useQuery`/`useMutation` inside an API class.** The class is a plain async wrapper.
- **No file uploads.** optikí never sends `FormData`: scan input (HTML, a URL, a Gym id) is JSON. If an upload is ever needed, it is a new design decision, not a copy of an old pattern.

### Error contract — `src/api/http-error.ts`

```ts
export class HttpError extends Error {
  readonly status: number
  readonly error: TServerErrorName

  constructor(status: number, message: string, error: TServerErrorName) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.error = error
  }
}

export const isHttpError = (error: unknown): error is HttpError =>
  error instanceof HttpError

const fallbackErrorName = (status: number): TServerErrorName => {
  if (status >= 500) return 'SERVER_ERROR'
  if (status >= 400) return 'CLIENT_ERROR'
  return 'UNKNOWN_ERROR'
}

export const throwOnError = async (response: Response): Promise<Response> => {
  if (response.ok) return response

  const body = await response.json().catch(() => null)
  const message =
    typeof body?.message === 'string' && body.message
      ? body.message
      : response.statusText || 'Something went wrong!'
  const error: TServerErrorName =
    typeof body?.error === 'string' && body.error
      ? body.error
      : fallbackErrorName(response.status)

  throw new HttpError(response.status, message, error)
}
```

Carrying `status` on the error is what lets the global `QueryCache` branch on 401. It also means **`error.message` is always safe to render** — it is already the server's message.

`error.error` is the server's status name (`NOT_FOUND`, `FORBIDDEN`, …), typed as `TServerErrorName` from `@typings/server-response` and kept in lockstep with `server/internal/pkg/statusCodeName.go`. TanStack types `error` as plain `Error` — network failures are not `HttpError`s — so narrow before reading it, in `onError` and on `useQuery`/`useMutation`'s `error` alike:

```ts
if (isHttpError(error) && error.error === 'NOT_FOUND') { … }
```

### Global request interceptor

`hooks/use-global-request-interceptor.ts` monkey-patches `globalThis.fetch` for the app's lifetime (mounted once in `App.tsx`). For any URL starting with `SERVER_URL` (`/api/v1`) it forces `credentials: 'include'`. Don't add per-call credential plumbing that belongs here.

---

## Query keys

Every `src/api/<resource>.ts` exports a key factory beside its singleton:

```ts
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export const scanKeys = {
  all: ['scan'] as const,
  list: (cursor: string) => [...scanKeys.all, 'list', cursor] as const,
  detail: (id: string) => [...scanKeys.all, 'detail', id] as const,
}
```

Rules:

- **Tuple keys only.** Never a template-string key like `` [`quiz-${id}`] `` — it collapses the namespace and the parameters into one opaque string, which makes prefix invalidation impossible.
- Namespace segment is kebab-case, matching the resource file name.
- Order: namespace → sub-scope → identifiers → `cursor` last.
- `limit` stays a constant inside the `queryFn` and out of the key.
- Keys always come from the factory. Never hand-write an array at a call site — that is how two spellings of the same key end up in the cache.

---

## Reads — `useQuery`

`useQuery` is the read path. It may be called inline in a page **or** wrapped in a `use-<thing>.ts` hook in `src/hooks/`. Wrap it when two or more places need the same read, or when the read carries policy (`enabled` guards, `staleTime` overrides, envelope unwrapping).

Hook shape: unwrap the server envelope in the `queryFn`, return the domain noun under its own name with a default.

```ts
// src/hooks/use-get-me.ts
export const useGetMe = () => {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: authKeys.me(),
    queryFn: authAPI.getMe,
  })

  return { user: data?.user ?? null, isPending, isError, error, refetch }
}
```

```ts
export const useScans = ({
  cursor,
  enabled,
}: {
  cursor: string
  enabled: boolean
}) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: scanKeys.list(cursor),
    queryFn: () => scanAPI.getAll(20, cursor),
    placeholderData: keepPreviousData,
    enabled,
  })

  return {
    scans: data?.data ?? [],
    pagination: data?.pagination,
    isPending,
    isError,
    error,
  }
}
```

- Guard required params with `enabled: !!id`, and gate tab/segment-scoped reads with `enabled: activeTab === 'x'`.
- Use **`isPending`**, not `isLoading`.
- Pass a bare method reference (`queryFn: authAPI.getMe`) when the call takes no arguments; a one-line arrow when it does.
- Don't copy query results into zustand. `useAuthStore` holds the session mirror only.

---

## Writes — `useMutation`

Patterns already established in the codebase:

```tsx
const { mutate, isPending, error } = useMutation({
  mutationFn: authAPI.signIn,
  onSuccess: (response: TAuthResponse) => {
    updateSession(response.session)
    navigate(redirectTo, { replace: true })
  },
})
```

- `mutationFn` is a bare method reference — that is why API methods are arrow properties.
- `onSuccess(data, variables)` carries the input forward: `` toast.success(`Verification code sent to ${variables.email}`) ``.
- `onSettled` is for cleanup that must happen either way — `sign-out-dialog.tsx` clears local auth and redirects on settle, so a failed sign-out cannot strand the user.
- A `useRef` guard handles StrictMode's double-invoked effects when a mutation fires on mount (`google-callback.tsx`).
  With the guard, **read the outcome only from `onSuccess`/`onError`** (into local state when it's rendered, as `email-token-verification.tsx` does). StrictMode's fake unmount detaches the observer from the in-flight mutation, so the hook's `isSuccess`/`isError`/`data`/`error` never update, but option-level callbacks still fire.
- **A local `onError` replaces the global mutation toast** (TanStack v5 semantics). Omit it and you get `toast.error(error.message)` for free; add one only when you want different behaviour.

### Invalidation

Inside `onSuccess`, invalidate by key **prefix** so every parameterised entry is covered:

```tsx
const queryClient = useQueryClient()

const { mutate } = useMutation({
  mutationFn: scanAPI.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: scanKeys.all })
  },
})
```

Prefer invalidation over `setQueryData`. Don't thread a `refetch` callback down through props as a substitute — invalidate the key.

---

## Global query configuration

`src/providers/react-query.tsx` sets the policy every query and mutation inherits:

The `retry` predicate refuses 401/403 — auth failures never fix themselves by retrying. A 401 on a `/u/*` page calls `endSession()` (`@utils/end-session`), which clears the stores, revokes the cookie session and does a hard `window.location.replace` to sign-in with `?redirectTo=` — `QueryCache` runs outside the router tree, so there is no `useNavigate`.

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
      refetchOnWindowFocus: import.meta.env.PROD,
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) return false
        if (failureCount > 3) return false
        return !(isHttpError(error) && [401, 403].includes(error.status))
      },
    },
    mutations: {
      networkMode: 'always',
      onError: (error) => toast.error(error.message),
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (!isHttpError(error)) return
      const isAuthenticatedPath = window.location.pathname.includes('/u/')

      if (error.status === 401 && isAuthenticatedPath) {
        toast.error('Session expired!')
        endSession()
        return
      }

      if (error.status >= 500) {
        toast.error('Internal Server Error!')
      }
    },
  }),
})
```

So: mutation errors toast automatically; a 401 from a **query** on an app page ends the session and redirects with `?redirectTo=`; 5xx toasts.

`QueryCache.onError` observes **queries only**. A read written as a mutation therefore silently misses the 401 sign-out — which is the concrete reason reads must use `useQuery`.

---

## Pagination

Cursor-based, driven by the URL so the browser's history is the cursor stack.

- The cursor lives in a search param (`useSearchParams`) and is part of the query key.
- "Next" writes `pagination.nextCursor` back with `{ replace: false }`.
- "Previous" is `navigate(-1)`.
- **Always set `placeholderData: keepPreviousData`** so paging doesn't flash skeletons.
- Page size is a constant in the `queryFn`, not in the key.

```tsx
const [searchParams, setSearchParams] = useSearchParams()
const cursor = searchParams.get('cursor') ?? ''
const hasCursor = !!cursor

const loadNext = () => {
  setSearchParams(
    (prev) => {
      prev.set('cursor', pagination.nextCursor)
      return prev
    },
    { replace: false }
  )
}

const loadPrev = () => {
  if (!hasCursor) return
  navigate(-1)
}
```

Server envelope (`types/auth.ts` → `TActiveSessionResponse`, and every future list):

```ts
export type TActiveSessionResponse = TServerResponseStatus & {
  data: TActiveSession[]
  pagination: TPagination // { limit, nextCursor, hasNextItems, count }
}
```

## Rendering loading and error states

Early returns, in order: pending → error → success.

```tsx
if (isPending && !hasCursor) {
  return (
    <div className='flex w-full flex-col gap-4'>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className='h-20 w-full' />
      ))}
    </div>
  )
}

if (isError) {
  return (
    <p role='alert' className='text-sm text-destructive'>
      {error.message}
    </p>
  )
}
```

The full skeleton belongs to the *first* page only (`isPending && !hasCursor`); subsequent pages show an inline spinner. Empty state renders below the list, not as an early return. `error.message` is already normalized by `HttpError`.

---

## Types

`src/types/<domain>.ts`, one file per domain, imported via `@typings/*`.

- **`T`-prefixed `type` aliases only.** No `interface`, no `I` prefix, no `enum` — string unions instead: `export type TUserRole = 'USER' | 'ADMIN'`. Component props types are a different thing: they live beside their component, unexported.
- Entities are bare nouns: `TUser`, `TSession`, `TActiveSession`, `TAppearance`.
- Request DTOs: `T<Verb><Noun>` or `T…Input` — `TSignInInput`, `TVerifyOTP`, `TChangePassword`.
- Response DTOs: `T<Name>Response`, **always intersected with the envelope**.
- Store types live with the domain and split state from actions: `TAuthState` / `TAuthActions`.
- Dates are ISO `string`, never `Date`.
- Relations are optional expansions on the entity: `user?: TUser`.
- Types are hand-written — never inferred from a Yup schema.

```ts
// src/types/server-response.ts
export type TServerResponseStatus = {
  status: string
  message: string
}

// src/types/auth.ts
export type TAuthResponse = TServerResponseStatus & { session: TSession }

export type TGetMeResponse = TServerResponseStatus & {
  user: TUser
  session: TSession
}
```

`src/types/index.d.ts` holds ambient globals only (`Prettify<T>`); it is not a barrel.

---

## Stores — zustand + persist

`src/stores/auth.ts` is the template:

```ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TAuth, TAuthActions, TAuthState } from '@typings/auth'

export type AuthStore = TAuthState & TAuthActions

const initialAuthValues: TAuth = {
  user: { id: '', name: '', email: '', role: 'USER', /* … */ },
  session: { userID: '', accessTokenExpiresAt: '', refreshTokenExpiresAt: '' },
}

export const defaultInitState: TAuthState = { auth: initialAuthValues }

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      auth: initialAuthValues,
      updateAuth: (auth) => set(() => ({ auth })),
      updateSession: (session) =>
        set((state) => ({ auth: { ...state.auth, session } })),
      clearAuth: () => set(() => ({ auth: initialAuthValues })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ auth: state.auth }),
      skipHydration: false,
    }
  )
)
```

- `export type XStore = TXState & TXActions`, an `initialXValues` const, an exported `defaultInitState`.
- **Empty-string sentinels, not `null`.** Emptiness is tested as `!!session?.userID`.
- Consume with **one atomic selector per value** — `useAuthStore((state) => state.updateSession)`. Never destructure the whole store; it re-renders on every change.
- Outside React, read with `useAuthStore.getState()` (see `providers/react-query.tsx` and the fetch interceptor).
- Actions may return a value when the caller needs it, and may guard against stale writes by comparing an id the caller holds with the one in the store.
