# Sillon — Development Roadmap

## Overview

```
Phase 1   · TanStack Start scaffold          ~2-3 days
Phase 2   · Discogs OAuth auth               ~1-2 days
Phase 3   · Core features (collection)       ~1 week
Phase 4   · Design system + Mobile UI        ~1 week
Phase 4.5 · Desktop adaptation               ~2-3 days
Phase 5   · Secondary features               ~1 week
Phase 6   · PWA + deployment                 ~2-3 days
Phase 7   · Marketplace feed (v1.5)          ~1 week
Phase 8   · Sellers (v2, low priority)       ~2 weeks
```

---

## Phase 1 — Remix → TanStack Start Migration

**Goal**: Project boots, routing in place, zero features, zero UI.
shadcn, fonts, and UI dependencies are installed in Phase 4.

### 1.1 Scaffolding

```bash
npx create-tsrouter-app@latest sillon \
  --framework=react \
  --target=start \
  --typescript \
  --tailwind \
  --package-manager=pnpm
```

### 1.2 Strictly necessary dependencies

```bash
# Data fetching
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools @tanstack/router-devtools

# Validation (needed from Phase 2 for server functions)
pnpm add zod
```

Framer Motion, Geist, lucide-react, shadcn, TanStack Virtual → added when needed (Phases 3 and 4).

### 1.3 Target file structure

```
src/
  routes/
    __root.tsx                    ← QueryClientProvider, global layout
    _authenticated.tsx            ← OAuth guard (beforeLoad)
    _authenticated/
      index.tsx                   ← Dashboard
      collection.tsx              ← Collection list
      collection.$id.tsx          ← Release detail
      wantlist.tsx
      search.tsx
      profile.tsx
    auth/
      login.tsx
      callback.tsx
  features/                       ← domain logic, organized by feature
    collection/
      collection.schema.ts
      collection.model.ts
      collection.queries.ts
      collection.utils.ts
      components/
    search/
    wantlist/
    auth/
  services/                       ← external connections, cross-feature
    session.server.ts             ← prepared in Phase 2
    discogs.server.ts
    deezer.server.ts
  shared/                         ← consumed everywhere, belongs to no feature
    components/                   ← flat for now, subfolders added if needed
    hooks/
    utils/
  styles/
    globals.css                   ← Tailwind base only, tokens in Phase 4
```

File-based routing is kept as recommended by TanStack — the code-gen provides
full type-safety on `Link`, `navigate`, and route params with no extra effort.
Feature logic (schema, model, queries, utils, components) lives in `features/`.
Route files stay in `routes/` and contain only routing concerns.

### 1.4 QueryClient setup in `__root.tsx`

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5min default
      gcTime: 1000 * 60 * 30, // 30min in cache
      retry: 2,
    },
  },
})
```

### ✅ Exit criteria

- `pnpm dev` → app boots without error
- Navigation between placeholder routes without error
- TanStack Devtools visible in dev
- No UI dependencies installed

---

## Phase 2 — Discogs OAuth 1.0a Auth

**Goal**: Discogs login working, session persisted, routes protected.

### 2.1 Environment variables

```bash
# .env
DISCOGS_CONSUMER_KEY=xxx
DISCOGS_CONSUMER_SECRET=xxx
SESSION_SECRET=xxx          # min 32 chars, random
```

### 2.2 Session server (`services/session.server.ts`)

```ts
import { useSession } from 'vinxi/http'

export const getSession = () =>
  useSession({
    name: '__sillon_session',
    password: process.env.SESSION_SECRET!,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

export type SessionData = {
  requestToken?: string
  requestTokenSecret?: string
  accessToken?: string
  accessTokenSecret?: string
  discogsUsername?: string
  currency?: string // from Discogs curr_abbr — EUR, GBP, USD...
  country?: string // parsed from Discogs location field
}
```

### 2.3 OAuth flow (3 server functions)

**`/auth/login`** — get request token → redirect to Discogs

```ts
// routes/auth/login.tsx
export const initiateOAuth = createServerFn().handler(async () => {
  const { token, tokenSecret } = await getDiscogsRequestToken()
  const session = await getSession()
  await session.update({ requestToken: token, requestTokenSecret: tokenSecret })
  throw redirect({
    href: `https://discogs.com/oauth/authorize?oauth_token=${token}`,
  })
})
```

**`/auth/callback`** — exchange verifier → access token

```ts
// routes/auth/callback.tsx
export const handleCallback = createServerFn()
  .validator(z.object({ oauth_token: z.string(), oauth_verifier: z.string() }))
  .handler(async ({ data }) => {
    const session = await getSession()
    const { accessToken, accessTokenSecret } = await exchangeToken(
      data.oauth_token,
      session.data.requestTokenSecret!,
      data.oauth_verifier,
    )
    const identity = await fetchDiscogsIdentity(accessToken, accessTokenSecret)
    await session.update({
      accessToken,
      accessTokenSecret,
      discogsUsername: identity.username,
      currency: identity.curr_abbr ?? 'EUR',
      country: parseCountry(identity.location) ?? 'FR',
    })
    throw redirect({ href: '/' })
  })
```

**`/auth/logout`** — clear session

```ts
await session.clear()
throw redirect({ href: '/auth/login' })
```

### 2.4 Route guard (`routes/_authenticated.tsx`)

`_authenticated.tsx` is a layout route — no UI, just a `beforeLoad` that protects
all routes nested under `_authenticated/`.

```ts
// routes/_authenticated.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '~/services/session.server'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session.data.accessToken) {
      throw redirect({ to: '/auth/login' })
    }
    return {
      user: {
        username: session.data.discogsUsername!,
        accessToken: session.data.accessToken,
        accessTokenSecret: session.data.accessTokenSecret!,
        currency: session.data.currency ?? 'EUR',
        country: session.data.country ?? 'FR',
      },
    }
  },
})
```

Any route file placed under `routes/_authenticated/` is automatically protected —
no additional setup needed. Auth routes (`login.tsx`, `callback.tsx`) sit outside
`_authenticated/` and are publicly accessible.

### ✅ Exit criteria

- Full login → callback → dashboard flow without error
- Token never visible client-side (check Network tab)
- Page refresh → session persisted
- Logout working
- Unauthenticated access to any protected route redirects to `/login`

---

## Phase 3 — Core Features

### 3.1 Query options

Query options are co-located with their feature, alongside the model and schema:

```
src/
  features/
    collection/
      collection.schema.ts   ← Zod schema (raw Discogs shape)
      collection.model.ts    ← applicative entity + toRecord() mapping
      collection.queries.ts  ← queryOptions, schema → model
      collection.utils.ts    ← pure transformations (unit testable)
      components/
    search/
      search.schema.ts
      search.model.ts
      search.queries.ts
    wantlist/
      wantlist.schema.ts
      wantlist.model.ts
      wantlist.queries.ts
  services/
    discogs.server.ts        ← fetch wrapper + OAuth signing
    deezer.server.ts         ← HD cover art fetch
    session.server.ts        ← session management
```

```ts
// features/collection/collection.queries.ts
export const collectionQueryOptions = (username: string) =>
  infiniteQueryOptions({
    queryKey: ['collection', username],
    queryFn: ({ pageParam = 1 }) => {
      const raw = await fetchCollection({ data: { username, page: pageParam } })
      return {
        ...raw,
        releases: raw.releases.map(toRecord), // schema → model at the boundary
      }
    },
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 1000 * 60 * 10,
  })

// features/collection/collection.queries.ts
export const releaseQueryOptions = (releaseId: string) =>
  queryOptions({
    queryKey: ['release', releaseId],
    queryFn: () => fetchRelease({ data: releaseId }).then(toRecord),
    staleTime: Infinity, // release is immutable
  })
```

Cover art (Deezer) lives in its own feature query since it's a separate concern:

```ts
// features/collection/collection.queries.ts
export const coverArtQueryOptions = (
  releaseId: string,
  title: string,
  artist: string,
) =>
  queryOptions({
    queryKey: ['cover', releaseId],
    queryFn: () => fetchDeezerCover({ data: { title, artist } }),
    staleTime: Infinity,
  })
```

### 3.2 Dashboard — `routes/_authenticated/index.tsx`

- `RecordBin` component (prototype exists, to integrate)
- Data: 20 most recent purchases via `collectionQueryOptions`
- SSR prefetch via `loader`

### 3.3 Collection — `routes/_authenticated/collection.tsx`

- Virtualization via `@tanstack/react-virtual`
- Infinite query with `useInfiniteQuery`
- Filters: genre, decade, format (URL state via TanStack Router `validateSearch`)

```ts
// URL state example
validateSearch: (s) => ({
  genre: (s.genre as string) ?? '',
  decade: (s.decade as string) ?? '',
  sort: (s.sort as 'added' | 'artist' | 'title') ?? 'added',
})
```

### 3.4 Release detail — `collection.$releaseId.tsx`

- SSR loader: `ensureQueryData(releaseQueryOptions)`
- Non-blocking prefetch: `prefetchQuery(coverArtQueryOptions)`
- `CoverArt` component: progressive loading color → thumb → HD
- `VinylDisc` component: animated SVG with dynamic color from Discogs

### 3.5 Search — `search.tsx`

2-step flow:

1. `/database/search?type=master` → masters list
2. `/masters/{id}/versions?format=Vinyl` → filtered pressings

URL state:

```ts
{ q: string, masterId?: string, releaseId?: string }
```

Prefetch on hover over master cards.

**Actions from search results** — the primary use case of search is finding a specific pressing and adding it to the collection or wantlist without leaving the view:

- Each version row has two action buttons: **+ Collection** and **+ Wantlist**
- Actions trigger the same optimistic mutations as the collection and wantlist features
- Count badges in the bottom nav update immediately via `setQueryData`
- If the release is already in the collection or wantlist, the corresponding button shows a checkmark and triggers removal instead (toggle behavior)
- Use `useSuspenseQuery` with `releaseId` to check membership status before rendering the buttons — data comes from the collection/wantlist cache, no extra fetch if already loaded

### 3.6 Wantlist — `wantlist.tsx`

Same as Collection but different data source. Share components.

### 3.7 File & folder conventions

| What                        | Where                         | Example                    |
| --------------------------- | ----------------------------- | -------------------------- |
| Route files                 | `routes/`                     | `collection.$id.tsx`       |
| Auth guard                  | `routes/_authenticated.tsx`   | layout route, no UI        |
| Protected routes            | `routes/_authenticated/`      | auto-protected by guard    |
| Raw API schema              | `features/{name}/`            | `collection.schema.ts`     |
| Applicative model + mapping | `features/{name}/`            | `collection.model.ts`      |
| Query options               | `features/{name}/`            | `collection.queries.ts`    |
| Pure utils                  | `features/{name}/`            | `collection.utils.ts`      |
| Feature components          | `features/{name}/components/` | `CollectionGrid.tsx`       |
| External services           | `services/`                   | `discogs.server.ts`        |
| Shared components           | `shared/components/`          | shadcn + custom primitives |
| Shared hooks                | `shared/hooks/`               | `useLocalStorage.ts`       |
| Shared utils                | `shared/utils/`               | generic pure functions     |

**Routing**: file-based routing kept as recommended by TanStack — full type-safety
on `Link`, `navigate`, and params via code-gen. Route files contain only routing
concerns (loader, search params, component import). All logic lives in `features/`.

**Suffix rule**: one file per responsibility → use suffix (e.g. `collection.model.ts`).
If a responsibility grows beyond one file → promote to a subfolder (e.g. `queries/`).

### 3.8 Testing setup — Vitest

#### Installation

```bash
pnpm add -D vitest @vitest/ui jsdom \
  @testing-library/react @testing-library/jest-dom \
  msw
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] }), viteReact()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Standalone config — never inherit `vite.config.ts`.** `tanstackStart()` sets env-level
resolve config (`dedupe`, `noExternal`) that splits React into two instances under vitest
→ `Invalid hook call` / `useState` of null in any test that renders. Nitro and PWA plugins
are irrelevant to unit tests too.

- **Environment**: `node` by default. DOM tests opt in per file with
  `// @vitest-environment jsdom` on line 1 — keeps pure util/model tests fast and keeps
  browser globals out of server code.
- **No globals**: import `describe`/`it`/`expect`/`vi` from `vitest` explicitly. Since RTL's
  auto-cleanup only registers with globals, the setup file calls it.

```ts
// src/test/setup.ts
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// Future (once msw is installed):
// import { server } from './mocks/server'
// beforeAll(() => server.listen())
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())
```

#### Test strategy by layer

| Layer                                   | What to test                                               | Tools                      |
| --------------------------------------- | ---------------------------------------------------------- | -------------------------- |
| `features/{name}/collection.utils.ts`   | Pure transformation functions — no mocks needed            | Vitest only                |
| `features/{name}/collection.schema.ts`  | Zod schema accepts real API payloads, rejects invalid ones | Vitest + JSON fixtures     |
| `features/{name}/collection.queries.ts` | queryFn maps API response to model correctly               | Vitest + QueryClient + msw |
| `shared/hooks/`                         | Hook behavior across renders                               | Vitest + renderHook        |

**Not tested**: route files (no logic), services (covered by query tests via msw), UI components (high maintenance cost, low value for a personal app).

#### Layer examples

**Utils — zero mock, highest value**

```ts
// features/collection/collection.utils.test.ts
describe('toRecord', () => {
  it('maps primary artist correctly', () => {
    expect(toRecord(rawFixture).artist).toBe('Portishead')
  })

  it('falls back to Unknown when artists is empty', () => {
    expect(toRecord({ ...rawFixture, artists: [] }).artist).toBe('Unknown')
  })

  it('returns null year when missing', () => {
    expect(toRecord({ ...rawFixture, year: undefined }).year).toBeNull()
  })
})
```

**Schema — validate against real API fixtures**

```ts
// features/collection/collection.schema.test.ts
describe('DiscogsReleaseSchema', () => {
  it('accepts a valid Discogs release payload', () => {
    expect(() => DiscogsReleaseSchema.parse(realApiFixture)).not.toThrow()
  })

  it('rejects payload missing required id', () => {
    expect(() => DiscogsReleaseSchema.parse({ title: 'test' })).toThrow()
  })
})
```

**Queries — msw intercepts the fetch**

```ts
// features/collection/collection.queries.test.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer(
  http.get(
    'https://api.discogs.com/users/:username/collection/folders/0/releases',
    () => HttpResponse.json(collectionFixture),
  ),
)

it('maps API response to Record[] via queryFn', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const data = await queryClient.fetchInfiniteQuery(
    collectionQueryOptions('testuser'),
  )
  expect(data.pages[0].releases[0]).toMatchObject({ artist: 'Portishead' })
})
```

**Hooks**

```ts
// shared/hooks/useLocalStorage.test.ts
it('persists value and survives re-render', () => {
  const { result } = renderHook(() => useLocalStorage('key', 'default'))
  act(() => result.current[1]('new value'))
  expect(result.current[0]).toBe('new value')
})

it('returns defaultValue when key is absent', () => {
  const { result } = renderHook(() => useLocalStorage('missing', 'fallback'))
  expect(result.current[0]).toBe('fallback')
})
```

#### Test fixtures

Store real API response snapshots in `src/test/fixtures/`:

```
src/test/
  setup.ts
  fixtures/
    discogs-release.json       ← real response from GET /releases/{id}
    discogs-collection.json    ← real response from GET /collection page 1
    deezer-search.json
  mocks/
    server.ts                  ← msw server setup
    handlers.ts                ← msw route handlers
```

**Capture method — Network tab (recommended)**

Do not log responses from code. Use the browser DevTools Network tab instead —
it gives the exact raw JSON the API returns, before any transformation.

For each endpoint:

1. Navigate to the relevant page in the app (dev mode, authenticated)
2. Open DevTools → Network tab → filter by Fetch/XHR
3. Find the Discogs or Deezer request
4. Click the request → Response tab → right-click → "Copy response"
5. Paste into the corresponding fixture file

Capture all fixtures in a single dev session:

| Fixture file              | Endpoint                                                     |
| ------------------------- | ------------------------------------------------------------ |
| `discogs-collection.json` | `GET /users/{username}/collection/folders/0/releases?page=1` |
| `discogs-release.json`    | `GET /releases/{id}`                                         |
| `discogs-masters.json`    | `GET /database/search?type=master&q=...`                     |
| `discogs-versions.json`   | `GET /masters/{id}/versions?format=Vinyl`                    |
| `deezer-search.json`      | `GET /search?q=...`                                          |

These fixtures reflect what the API actually returns for your account and data —
including optional fields and edge cases the official docs don't always mention.

#### Priority order

```
1. collection.utils.ts    ← as soon as toRecord() exists
2. collection.schema.ts   ← with real JSON fixtures
3. shared/hooks/          ← useLocalStorage, useMediaQuery, useTheme
4. collection.queries.ts  ← after msw is set up
5. other features         ← same pattern, feature by feature
```

### ✅ Exit criteria

- Collection loads + smooth virtualized scroll
- Collection → detail → back navigation is instant (cache)
- Search working in 2 steps
- HD cover visible on detail page
- All features follow the schema → model → query pattern
- Vitest configured, utils and schema tests passing for collection feature

---

## Phase 4 — Design System + Mobile UI

**Goal**: Mobile-first exclusively. Desktop ignored until Phase 4.5.
Everything designed for a 390px screen, held in hand, used while crate digging.

### 4.0 UI dependencies installation

```bash
# UI components
pnpm dlx shadcn@latest init
# style=default · baseColor=neutral · cssVariables=true
pnpm dlx shadcn@latest add button badge input dialog sheet \
  command tooltip skeleton separator avatar dropdown-menu tabs

# Animation
pnpm add framer-motion

# Icons
pnpm add lucide-react

# Virtualization (if not already done in Phase 3)
pnpm add @tanstack/react-virtual
```

### 4.1 Global CSS

Copy tokens from `docs/design-system.md` into `globals.css`.
Dual theme: `.dark` + `@media (prefers-color-scheme: dark)`.
Fonts are self-hosted — place `.woff2` files in `public/fonts/` and declare them via `@font-face` as documented in `docs/design-system.md`. No npm package needed.

### 4.1 Global CSS

Copy tokens from `docs/design-system.md` into `globals.css`.
Dual theme: `.dark` + `@media (prefers-color-scheme: dark)`.
Fonts are self-hosted — place `.woff2` files in `public/fonts/` and declare them via `@font-face` as documented in `docs/design-system.md`. No npm package needed.

### 4.2 Theme system

`ThemeProvider` in `src/shared/hooks/theme.ts`, mounted in `__root.tsx` wrapping `QueryClientProvider`.

Three modes: `'light' | 'dark' | 'system'`. Default: `'system'` (follows `prefers-color-scheme`).

```tsx
// src/shared/hooks/theme.ts
type Theme = 'light' | 'dark' | 'system'

// SSR-safe, fully typed — no raw localStorage access, no unsafe cast
function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>(null!)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage<Theme>('sillon-theme', 'system')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.classList.remove('light', 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
      root.classList.toggle('light', theme === 'light')
    }
  }, [theme])

  return (
    // React 19: no .Provider needed
    <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

Preference persists across page refreshes via `useLocalStorage` — SSR-safe (guards against `window` being undefined) and fully typed without unsafe casts.

**Theme toggle button** — placed in the profile route header (settings area), cycles through the 3 modes with a sun/moon/system icon from lucide-react:

```tsx
// Cycle: system → light → dark → system
const cycle: Theme[] = ['system', 'light', 'dark']
const next = cycle[(cycle.indexOf(theme) + 1) % cycle.length]
```

The CSS already handles everything via `.dark` class and `prefers-color-scheme` — the provider just manages which class is applied to `<html>`.

### 4.3 Mobile navigation

Fixed bottom nav, 4 entries:

```
┌─────────────────────────┐
│                         │
│      route content      │
│                         │
├─────────────────────────┤
│  🏠    📦    🔍    👤   │
│  Home  Coll  Search Profile
└─────────────────────────┘
```

- `/sellers` accessible from Wantlist, not in main nav
- Route transition: 100ms fade
- Bottom safe area handled (`padding-bottom: env(safe-area-inset-bottom)`)

### 4.4 Sillon components to build

**`CoverArt.tsx`** — 3 progressive states

```tsx
type Stage = 'color' | 'thumb' | 'hd'
// color  → background-color from release.styles[0] (SSR, instant)
// thumb  → uri150 included in Discogs payload (SSR, no fetch)
// hd     → Deezer fetch after mount (non-blocking, progressive)
```

**`VinylDisc.tsx`** — SVG with dynamic color

```tsx
// Parse "Black And White Splatter" → ['black', 'white']
// SVG: grooves + central label + color sectors + sheen
// Animation: loop rotate 360°, pause on hover/tap
```

**`RecordBin.tsx`** — production version of the dashboard prototype

- Real data from `useInfiniteQuery` (20 most recent purchases)
- Drag forward (Y axis) + tap to open detail
- Keyboard arrows as fallback

**`RecordCard.tsx`** — reusable card

- "bin" mode (in RecordBin)
- "grid" mode (in Collection)
- "list" mode (in Wantlist)

**`SellerMatchSheet.tsx`** — universal sheet

```tsx
// Two modes depending on context
<SellerMatchSheet releaseId="12345" />       // from Search/detail
<SellerMatchSheet wantlistIds={[...]} />     // from Wantlist/Sellers
```

- shadcn `Sheet` side="bottom" on mobile
- Pinned favorites at top, all sellers below
- Inline "+ Follow" action

### 4.5 Route layouts (mobile)

**Dashboard `/`**

```
┌─────────────────┐
│ sillon        ⚙ │
├─────────────────┤
│                 │
│   RecordBin     │  ← full screen, drag forward
│  (20 recent)    │
│                 │
│  Title · Artist │
│  Year  · Label  │
└─────────────────┘
```

**Collection `/collection`**

```
┌─────────────────┐
│ Collection  ≡ ⊞ │  ← toggle list/grid + filters
├─────────────────┤
│ ┌──┐ ┌──┐ ┌──┐ │
│ │  │ │  │ │  │ │  ← virtualized grid
│ └──┘ └──┘ └──┘ │
│ ┌──┐ ┌──┐ ┌──┐ │
│ │  │ │  │ │  │ │
│ └──┘ └──┘ └──┘ │
└─────────────────┘
→ tap album → route `/collection/$releaseId`
```

**Release detail `/collection/$releaseId`**

```
┌─────────────────┐
│ ←               │
├─────────────────┤
│  ┌───────────┐  │
│  │  CoverArt │  │  ← progressive color→thumb→hd
│  └───────────┘  │
│   VinylDisc ↻   │  ← partially visible, animated
│                 │
│  Title          │
│  Artist · Year  │
│  Label · Catno  │
│  Condition      │
│                 │
│  [+ Wantlist]   │
└─────────────────┘
```

**Wantlist `/wantlist`**

```
┌─────────────────────────┐
│ Wantlist  [By seller →] │
├─────────────────────────┤
│ ┌─────────────┐         │
│ │ Cover Title │         │  ← virtualized list
│ │       ●● 3  │         │  ← followed sellers badge
│ └─────────────┘         │
│ ┌─────────────┐         │
│ │ Cover Title │         │
│ │          —  │         │
│ └─────────────┘         │
└─────────────────────────┘
→ tap badge → SellerMatchSheet
→ tap [By seller] → /sellers
```

**Search `/search`**

```
┌─────────────────┐
│ 🔍 Search…      │
├─────────────────┤
│  Masters        │
│  ┌───┐ Title    │
│  │   │ Artist   │
│  └───┘ ●● 2     │  ← sellers badge
│  ┌───┐ Title    │
│  │   │ Artist   │
│  └───┘  —       │
└─────────────────┘
→ tap master → versions list (same route, URL state)
→ tap badge → SellerMatchSheet
```

**Sellers `/sellers`**

```
┌─────────────────────────┐
│ Followed sellers        │
├─────────────────────────┤
│ ── Following ─────────  │
│ recordshop          25  │
│ clone_rec           12  │
│ decks_of_wax         6  │
│                         │
│ ── Discovered ────────  │
│ hifidelity      + Follow│
└─────────────────────────┘
→ tap followed seller → SellerMatchSheet (wantlist items only)
```

### ✅ Phase 4 exit criteria

- App 100% usable on iPhone SE (375px) and iPhone 15 (390px)
- Dark/light mode follows system preference
- Bottom nav fluid, safe area respected
- All Sillon components typed and documented
- RecordBin working with real data
- SellerMatchSheet operational from Search and Wantlist
- No inline styles outside Framer Motion animated components

---

## Phase 4.5 — Desktop Adaptation

**Goal**: Use available space without reworking the core logic.
Layout work only — no components or data logic to change.

### 3-column layout

```
┌──────────┬─────────────────────┬──────────────────┐
│  Sidebar │   Center column     │   Right panel    │
│  200px   │      flex-1         │     380px        │
└──────────┴─────────────────────┴──────────────────┘
```

The sidebar replaces the bottom nav. The right panel replaces sheets and page-to-page navigation.

### Behavior per route

| Route         | Center column         | Right panel                                   |
| ------------- | --------------------- | --------------------------------------------- |
| `/` Dashboard | RecordBin full width  | Current album metadata                        |
| `/collection` | Virtualized grid      | Release detail on click (≡ `/collection/$id`) |
| `/wantlist`   | Virtualized list      | SellerMatchSheet on badge click               |
| `/search`     | Masters results       | Selected master's versions                    |
| `/sellers`    | Followed sellers list | Matched wantlist items on click               |

### SellerMatchSheet → right panel

On desktop, `<SellerMatchSheet />` doesn't open as a sheet — it becomes the right panel content. Same component, different render via context or `variant="panel" | "sheet"` prop detected at breakpoint.

```tsx
const isMobile = useMediaQuery('(max-width: 768px)')

return isMobile ? (
  <Sheet>
    <SellerMatchSheet />
  </Sheet>
) : (
  <RightPanel>
    <SellerMatchSheet />
  </RightPanel>
)
```

### Breakpoints

```css
/* Mobile  : < 768px  → bottom nav + full screen */
/* Tablet  : 768-1024px → sidebar + center column (no right panel) */
/* Desktop : > 1024px → full 3-column layout */
```

### ✅ Phase 4.5 exit criteria

- 3-column layout working from 1024px
- Sidebar with same 4 entries as bottom nav
- Page-to-page navigation replaced by right panel on desktop
- No mobile regressions

---

## Phase 5 — Secondary Features

### 5.1 Collection mutations — add & remove

Mutations against a paginated infinite query require targeted cache updates rather than full invalidation. Invalidating the entire infinite query cache would refetch all loaded pages from page 1 — slow and disruptive.

**Principle**

```
Add    → optimistic update on page 0 only + invalidate page 0 to reconcile
Remove → optimistic filter across all pages, no invalidation needed
Edit   → setQueryData targeted at the single item, no invalidation
Full invalidation → last resort only (e.g. full Discogs sync)
```

**Add to collection**

```ts
useMutation({
  mutationFn: (releaseId: string) => addToCollection(releaseId),
  onMutate: async (releaseId) => {
    await queryClient.cancelQueries({ queryKey: ['collection', username] })
    const previous = queryClient.getQueryData(['collection', username])

    // Inject new item at the top of page 0
    queryClient.setQueryData(['collection', username], (old: InfiniteData) => ({
      ...old,
      pages: [
        {
          ...old.pages[0],
          releases: [newOptimisticRecord(releaseId), ...old.pages[0].releases],
        },
        ...old.pages.slice(1),
      ],
    }))

    return { previous }
  },
  onError: (_, __, ctx) => {
    queryClient.setQueryData(['collection', username], ctx?.previous)
  },
  onSettled: () => {
    // Reconcile page 0 only — other pages are unaffected
    queryClient.invalidateQueries({
      queryKey: ['collection', username],
      refetchPage: (_, index) => index === 0,
    })
  },
})
```

**Remove from collection**

```ts
useMutation({
  mutationFn: (releaseId: string) => removeFromCollection(releaseId),
  onMutate: async (releaseId) => {
    await queryClient.cancelQueries({ queryKey: ['collection', username] })
    const previous = queryClient.getQueryData(['collection', username])

    // Filter removed item across all loaded pages
    queryClient.setQueryData(['collection', username], (old: InfiniteData) => ({
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        releases: page.releases.filter((r) => r.id !== releaseId),
      })),
    }))

    return { previous }
  },
  onError: (_, __, ctx) => {
    queryClient.setQueryData(['collection', username], ctx?.previous)
  },
  // No invalidation — cache already reflects reality
})
```

### 5.2 Profile page

- Collection stats (total value, genres, decades, dominant labels)
- Simple charts (Recharts or pure CSS)
- Disconnect button

### 5.3 Quick check "already in my collection?"

- In-app search bar → instant result from cache
- Useful while crate digging (cf. PWA mobile)

### 5.4 Find elsewhere — curated seller directory

**Concept**: accessible from the release detail page, a ranked list of trusted external retailers where the user can search for the release. No scraping, no API calls — just pre-built search URLs opened in a new tab. The list is ranked based on user preferences (country, currency) and release metadata (genre).

**Data model** — static file, no backend needed:

```ts
// src/data/sellers.ts
type Seller = {
  id: string
  name: string
  domain: string // used for favicon
  url: (title: string, artist: string) => string
  country: string // seller's country — 'FR' | 'GB' | 'DE' | ...
  currency: string // 'EUR' | 'GBP' | 'USD' | ...
  ships: string[] // ['worldwide'] or ['EU', 'GB', ...]
  specialties: string[] // Discogs style tags — ['electronic', 'jazz', ...]
}

const SELLERS: Seller[] = [
  {
    id: 'boomkat',
    name: 'Boomkat',
    domain: 'boomkat.com',
    url: (title, artist) =>
      `https://boomkat.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`,
    country: 'GB',
    currency: 'GBP',
    ships: ['worldwide'],
    specialties: ['electronic', 'experimental', 'jazz', 'ambient'],
  },
  {
    id: 'juno',
    name: 'Juno Records',
    domain: 'juno.co.uk',
    url: (title, artist) =>
      `https://www.juno.co.uk/search/?q=${encodeURIComponent(`${artist} ${title}`)}`,
    country: 'GB',
    currency: 'GBP',
    ships: ['worldwide'],
    specialties: ['electronic', 'dance', 'house', 'techno', 'drum-and-bass'],
  },
  {
    id: 'decks',
    name: 'Decks.de',
    domain: 'decks.de',
    url: (title, artist) =>
      `https://www.decks.de/search?q=${encodeURIComponent(`${artist} ${title}`)}`,
    country: 'DE',
    currency: 'EUR',
    ships: ['EU', 'worldwide'],
    specialties: ['electronic', 'dance', 'techno', 'house'],
  },
  {
    id: 'norman',
    name: 'Norman Records',
    domain: 'normanrecords.com',
    url: (title, artist) =>
      `https://www.normanrecords.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`,
    country: 'GB',
    currency: 'GBP',
    ships: ['worldwide'],
    specialties: ['indie', 'alternative', 'electronic', 'experimental'],
  },
  {
    id: 'clone',
    name: 'Clone Records',
    domain: 'clone.nl',
    url: (title, artist) =>
      `https://clone.nl/search?q=${encodeURIComponent(`${artist} ${title}`)}`,
    country: 'NL',
    currency: 'EUR',
    ships: ['worldwide'],
    specialties: ['electronic', 'techno', 'house', 'electro'],
  },
  // add more as needed
]
```

**Ranking algorithm** — pure function, fully testable:

```ts
// src/data/sellers.ts
function rankSellers(
  sellers: Seller[],
  release: Record,
  prefs: { country: string; currency: string },
): Seller[] {
  return [...sellers].sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    // Same country as user → +3
    if (a.country === prefs.country) scoreA += 3
    if (b.country === prefs.country) scoreB += 3

    // Same currency as user → +2
    if (a.currency === prefs.currency) scoreA += 2
    if (b.currency === prefs.currency) scoreB += 2

    // Genre match with release styles → +1 per match
    const styles = release.styles?.map((s) => s.toLowerCase()) ?? []
    scoreA += styles.filter((s) => a.specialties.includes(s)).length
    scoreB += styles.filter((s) => b.specialties.includes(s)).length

    return scoreB - scoreA
  })
}
```

**Favicon — no logos, no trademark issues:**

```tsx
// Served by Google — no hosting, always up to date, zero legal risk
<img
  src={`https://www.google.com/s2/favicons?domain=${seller.domain}&sz=32`}
  alt={seller.name}
  width={16}
  height={16}
/>
```

**User preferences** — sourced directly from the Discogs profile at login, no manual setup needed:

The `GET /users/{username}` endpoint exposes `curr_abbr` (ISO currency code) and `location` (free text). Both are captured at OAuth callback and stored in the session:

```ts
// services/discogs.server.ts — in handleCallback
const identity = await fetchDiscogsIdentity(accessToken, accessTokenSecret)

await session.update({
  accessToken,
  accessTokenSecret,
  discogsUsername: identity.username,
  currency: identity.curr_abbr ?? 'EUR', // clean ISO code — EUR, GBP, USD...
  country: parseCountry(identity.location) ?? 'FR', // best-effort parse of free text
})
```

`parseCountry` is a simple utility that extracts a country code from strings like `"Nantes, France"` → `"FR"`. The user can override both values in their profile settings if the detection is wrong.

In `rankSellers`, country and currency come from the route context — no `useLocalStorage` needed:

```ts
const { user } = useRouteContext({ from: '/_authenticated' })

const ranked = rankSellers(SELLERS, release, {
  country: user.country,
  currency: user.currency,
})
```

**UI** — accessible from the release detail page, below the main metadata:

```
Find elsewhere

  🟦 Boomkat          [Search →]   ← ranked #1 (GB + electronic match)
  🟦 Norman Records   [Search →]
  🟦 Juno Records     [Search →]
  🟦 Decks.de         [Search →]
  🟦 Clone Records    [Search →]
```

Each row opens the pre-built search URL in a new tab. No request is made by Sillon.

**Legal note**: favicons served via Google's favicon service — Sillon hosts no brand assets. Add a footer disclaimer: _"Sillon is not affiliated with or endorsed by any of these retailers."_

**Technical scope**: `src/data/sellers.ts` only — no new service, no API, no Supabase table. Pure static data + client-side ranking.

**Priority**: after 5.3, before 5.5. Low implementation cost, high perceived value for crate diggers.

### 5.5 Random pick — "Pick for me"

**Concept**: answers "what do I play now?". Fetches a truly random record from the full Discogs collection (not just loaded pages), then displays it in a `RecordSpotlight` component. The user can pick again without closing or navigating away.

**Trigger**: "Pick for me" (`Shuffle` icon + label) in two places, hidden when the Collection is empty:

- Home — `RandomPickCard` between `MetricsStrip` and Recently Added (primary entry)
- Collection page — `RandomPickButton` beside the title (secondary)

Not in the global header: it is a Collection action, not app chrome. Not in `SortChips`: it is not an ordering.

Shared state lives in `features/collection/hooks/use-random-pick.ts`.

**Fetch strategy**: 2 lightweight requests regardless of collection size:

1. `GET /collection?per_page=1` → get `pagination.items` (total count)
2. `GET /collection?page={random}&per_page=1` → fetch the random item

```ts
// features/collection/collection.queries.ts
export const randomRecordQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['collection', username, 'random'],
    queryFn: () => fetchRandomRecord(username),
    staleTime: 0, // always refetch — each pick must be unique
    gcTime: 0, // no cache
    enabled: false, // triggered manually on click only
  })
```

**`RecordSpotlight` component** — displays the picked record without navigating away. User can pick again or navigate to the full detail page.

```
Mobile  → full-screen Sheet from bottom (shadcn Sheet side="bottom")
Desktop → Dialog (shadcn Dialog)
```

Early return pattern — specific case first, nominal case last:

```tsx
// shared/components/RecordSpotlight.tsx
function RecordSpotlight({ record, onClose, onPickAgain }) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Mobile: full-screen sheet
  if (isMobile) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90dvh]">
          <SpotlightContent
            record={record}
            onClose={onClose}
            onPickAgain={onPickAgain}
          />
        </SheetContent>
      </Sheet>
    )
  }

  // Default: dialog
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <SpotlightContent
          record={record}
          onClose={onClose}
          onPickAgain={onPickAgain}
        />
      </DialogContent>
    </Dialog>
  )
}
```

**User flow**:

```
Tap "Pick for me"
  → icon spins (~300ms fetch)
  → RecordSpotlight opens
      [cover · title · artist · year · label]
      [Pick again 🔀]  [View in collection →]
  → "Pick again" → refetch → same spotlight updates in place
  → "View in collection" → navigate to /collection/$id → spotlight closes
```

**v1 (now)**: no animation — direct open on fetch result.
**v2 (Phase 5.4 polish)**: animated roulette overlay before reveal, using the `sillon-pioche.jsx` prototype as reference. Logic unchanged — animation wraps the same fetch + open sequence.

**Priority**: implement v1 now (simple, high value). Polish animation later as a dedicated half-day.

### ✅ Exit criteria

- Add/remove with optimistic feedback
- Profile stats displayed
- Find elsewhere accessible from release detail, ranked by user preferences
- Random pick working with complete animation

---

## Phase 6 — PWA + Deployment

### 6.1 PWA

```bash
pnpm add -D vite-plugin-pwa
```

```ts
// app.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Sillon',
    short_name: 'Sillon',
    description: 'Your record collection and wantlist, synced with Discogs.',
    // Vinyl black: the launch screen is always dark
    theme_color: VINYL_BLACK,
    background_color: VINYL_BLACK,
    display: 'standalone',
    lang: 'en',
    // Generated from the groove mark: pnpm generate:pwa-assets
    // (src/shared/utils/pwa-assets.ts)
    icons: manifestIcons(),
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/i\.discogs\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'discogs-images',
          expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /^https:\/\/e\.cdninstagram\.com\/.*/i, // Deezer CDN
        handler: 'CacheFirst',
        options: { cacheName: 'cover-hd', expiration: { maxEntries: 200 } },
      },
    ],
  },
})
```

### 6.2 Deployment (Vercel recommended)

```bash
pnpm add -D @tanstack/start-server-fn-adapter-vercel
```

- Edge functions for OAuth server functions
- `SESSION_SECRET`, `DISCOGS_CONSUMER_KEY`, `DISCOGS_CONSUMER_SECRET` in Vercel env
- Domain: `sillon.app` (or fallback `usesillon.app`)

### ✅ Exit criteria

- Installable on iOS and Android
- Discogs covers cached offline
- `pnpm build && pnpm preview` without errors

---

## Phase 7 — Marketplace Feed (v1.5)

**Prerequisite**: Supabase project created.

### 7.1 DB schema

```sql
create table users (
  id                uuid primary key default gen_random_uuid(),
  discogs_username  text unique not null,
  access_token      text not null,      -- encrypted (pgcrypto)
  access_token_secret text not null,
  created_at        timestamptz default now()
);

create table watched_releases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  release_id  text not null,
  title       text,
  artist      text,
  max_price   numeric,                  -- user budget ceiling
  synced_at   timestamptz default now(),
  unique(user_id, release_id)
);

create table feed_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  release_id  text not null,
  type        text not null,            -- 'listing_available' | 'price_drop'
  payload     jsonb,                    -- { listingId, price, seller, condition }
  seen        boolean default false,
  created_at  timestamptz default now()
);

-- Index for Realtime filter
create index feed_events_user_id_idx on feed_events(user_id);
```

### 7.2 Supabase Edge Function cron (every 5min)

```ts
// supabase/functions/poll-wantlist/index.ts
// For each user:
//   1. Fetch Discogs wantlist
//   2. For each item → GET /marketplace/stats/{release_id}?curr_abbr=xxx
//   3. Compare with watched_releases.max_price
//   4. If Listings count rises / Lowest price drops → INSERT feed_events
//   → Supabase Realtime push automatic
```

> ⚠️ The Discogs API has **no endpoint listing the Listings of a Release**
> (`/marketplace/search` doesn't exist). `/marketplace/stats` only gives the
> Listings count, the Lowest price and `blocked_from_sale` — no seller, no
> condition, no listing ID. `feed_events.payload` is limited accordingly
> (`{ numForSale, lowestPrice }`); details stay on the Discogs sell page.
> Mind the 60 req/min budget: one call per want per poll.

### 7.4 Wantlist card marketplace info

Precomputed by the cron above, stored per release — never fetched live from
cards (rate limit). Enables on each Wantlist card: Listings count + Lowest
price, plus sort "cheapest first" and filter "available only".
Until then, marketplace info lives only in the release sheets (see
`features/marketplace/`), fetched on open.

### 7.3 Client subscription

```ts
// hooks/useFeedEvents.ts
const supabase = createClient(url, anonKey)

supabase
  .channel('feed')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'feed_events',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      queryClient.setQueryData(['feed'], (old: FeedEvent[]) => [
        payload.new,
        ...old,
      ])
      // + toast notification
    },
  )
  .subscribe()
```

### ✅ Exit criteria

- Real-time notification when a wantlist vinyl becomes available
- Feed readable in the app (dedicated page)
- Mark as "seen" working

---

## Phase 8 — Sellers (v2, low priority)

**Prerequisite**: Phase 7 (Supabase) in place — shared server cache and cron.

### Context & API constraints

`GET /users/{username}/inventory` is public but doesn't filter by `release_id`. To cross-reference a seller's inventory with the wantlist, the full stock must be fetched server-side (~20 requests for 2000 items) then filtered. This cross-referencing **must be precomputed in background** (hourly cron) and never triggered on-the-fly from the client.

### 8.1 Route `/sellers`

```
/sellers

  ── Following ────────────────────────────────────
  recordshop_paris      25 / 200 wants   ↗ Discogs
  clone_records         12 / 200 wants   ↗ Discogs
  decks_of_wax           6 / 200 wants   ↗ Discogs

  ── Recently discovered ──────────────────────────
  (sellers seen in a sheet but not yet followed)
  hifidelity_nl                           + Follow
  vinyl_temple_de                         + Follow
```

- Favorites sorted by `matchCount` descending (nb of wantlist items in stock)
- "Discovered" = sellers encountered in a sheet but not followed
- Tap on a favorite → detail sheet with matched items only

### 8.2 Seller indicator in the Versions page (Search)

Light badge on each pressing in the master's versions list:

```
Versions of "Blue Lines"
  1991 · UK · Wild Bunch · WBRX 1    ●● 3 followed sellers
  1991 · EU · Virgin · 209 081        ●  1 followed seller
  1998 · US · Circa · CHR-6013           —
```

Data from precomputed cache — no on-the-fly fetch.

### 8.3 SellerMatchSheet — universal component

A single `<SellerMatchSheet />` component callable from anywhere (Search, Wantlist, `/sellers`). Two modes depending on context:

```tsx
// From Search (a specific release)
<SellerMatchSheet releaseId="12345" />

// From Wantlist or /sellers (full wantlist)
<SellerMatchSheet wantlistIds={[...]} />
```

Shows **all sellers** who have the item in stock, pinned favorites at top with their match badge. "+ Follow" action available on each unfollowed seller.

### 8.4 Populating the seller list

Three entry points to add a seller to favorites:

1. **Auto on login** — import from purchase history (`GET /users/{username}/purchases`), confirmation screen with per-seller opt-out
2. **From SellerMatchSheet** — "+ Follow" button on any encountered seller
3. **Manual entry** — username field in `/sellers`, live validation via `GET /users/{username}`

### 8.5 Background infrastructure (Supabase)

```sql
-- Additional tables
create table followed_sellers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  seller_username text not null,
  discovered_via  text,   -- 'purchase_history' | 'sheet' | 'manual'
  created_at   timestamptz default now(),
  unique(user_id, seller_username)
);

create table seller_wantlist_matches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  seller_username text not null,
  release_id      text not null,
  listing_id      text,
  price           numeric,
  condition       text,
  computed_at     timestamptz default now()
);
```

Supabase Edge Function cron (every hour):

- For each `followed_seller` of each user
- Fetch full seller inventory (all pages)
- Cross-reference with wantlist → upsert `seller_wantlist_matches`
- Respect Discogs rate limit (240 req/min authenticated) with delay between pages

### ✅ Exit criteria

- `/sellers` shows favorites with correct matchCount
- Seller badge visible on versions page in search
- SellerMatchSheet working from Search and Wantlist
- Add/remove sellers from all three entry points
- No inventory fetch triggered client-side

---

## Backlog v2 (post-launch)

- **Barcode scan** while crate digging (BarcodeDetector API or zxing-wasm)
- **Advanced stats**: collection value over time (with Discogs marketplace history)
- **Export**: CSV / PDF of the collection
- **Sharing**: public read-only profile
- **Multi-account**: multiple collections (collectors sharing a family Discogs account)

---

## npm dependencies — final list

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-router": "^1.x",
    "@tanstack/react-start": "^1.x",
    "@tanstack/react-virtual": "^3.x",
    "framer-motion": "^11.x",
    "geist": "^1.x",
    "lucide-react": "^0.x",
    "zod": "^3.x",
    "@supabase/supabase-js": "^2.x" // Phase 7 only
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.x",
    "@tanstack/router-devtools": "^1.x",
    "@tanstack/query-devtools": "^5.x"
  }
}
```
