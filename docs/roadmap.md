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
    __root.tsx                    ← QueryClientProvider
    _authenticated.tsx            ← OAuth guard (beforeLoad) — empty for now
    _authenticated/
      index.tsx                   ← placeholder "Dashboard"
      collection.tsx              ← placeholder
      wantlist.tsx                ← placeholder
      search.tsx                  ← placeholder
      profile.tsx                 ← placeholder
    auth/
      login.tsx                   ← placeholder
      callback.tsx                ← placeholder
  lib/
    server/
      session.server.ts           ← prepared in Phase 2
  styles/
    globals.css                   ← Tailwind base only, tokens in Phase 4
```

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

### 2.2 Session server (`lib/server/session.server.ts`)

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
    })
    throw redirect({ href: '/' })
  })
```

**`/auth/logout`** — clear session

```ts
await session.clear()
throw redirect({ href: '/auth/login' })
```

### 2.4 Route guard (`_authenticated.tsx`)

```ts
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const session = await getSession()
    if (!session.data.accessToken) {
      throw redirect({ to: '/auth/login' })
    }
    return {
      user: {
        username: session.data.discogsUsername!,
        accessToken: session.data.accessToken,
        accessTokenSecret: session.data.accessTokenSecret!,
      },
    }
  },
})
```

### ✅ Exit criteria

- Full login → callback → dashboard flow without error
- Token never visible client-side (check Network tab)
- Page refresh → session persisted
- Logout working

---

## Phase 3 — Core Features

### 3.1 Query options (`lib/queries/`)

```ts
// collectionQueries.ts
export const collectionQueryOptions = (username: string) =>
  infiniteQueryOptions({
    queryKey: ['collection', username],
    queryFn: ({ pageParam = 1 }) =>
      fetchCollection({ data: { username, page: pageParam } }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 1000 * 60 * 10, // 10min
  })

// releaseQueries.ts
export const releaseQueryOptions = (releaseId: string) =>
  queryOptions({
    queryKey: ['release', releaseId],
    queryFn: () => fetchRelease({ data: releaseId }),
    staleTime: Infinity, // release is immutable
  })

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

### 3.6 Wantlist — `wantlist.tsx`

Same as Collection but different data source. Share components.

### ✅ Exit criteria

- Collection loads + smooth virtualized scroll
- Collection → detail → back navigation is instant (cache)
- Search working in 2 steps
- HD cover visible on detail page

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

`ThemeProvider` in `src/lib/theme.tsx`, mounted in `__root.tsx` wrapping `QueryClientProvider`.

Three modes: `'light' | 'dark' | 'system'`. Default: `'system'` (follows `prefers-color-scheme`).

```tsx
// src/lib/theme.tsx
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

### 5.1 Quick add to collection / wantlist

Optimistic mutations:

```ts
useMutation({
  mutationFn: addToCollection,
  onMutate: async () => {
    await queryClient.cancelQueries({ queryKey: ['collection', 'count'] })
    const prev = queryClient.getQueryData(['collection', 'count'])
    queryClient.setQueryData(['collection', 'count'], (n: number) => n + 1)
    return { prev }
  },
  onError: (_, __, ctx) =>
    queryClient.setQueryData(['collection', 'count'], ctx?.prev),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['collection'] }),
})
```

### 5.2 Profile page

- Collection stats (total value, genres, decades, dominant labels)
- Simple charts (Recharts or pure CSS)
- Disconnect button

### 5.3 Quick check "already in my collection?"

- In-app search bar → instant result from cache
- Useful while crate digging (cf. PWA mobile)

### 5.4 Random pick — "Surprise me"

**Concept**: a single shuffle button accessible from the dashboard and collection.
Triggers a 2-3 second ephemeral full-screen experience, then opens the detail sheet of the randomly picked album.

**Trigger**: discreet shuffle icon in the header (dashboard + collection). No dedicated view — this is a _moment_, not a page.

**Animation sequence**:

1. Black overlay rises from the bottom (spring, 300ms)
2. Collection covers scroll in a fast cascade (stagger, like a wheel)
3. Progressive slowdown over ~1 second
4. One cover asserts itself at the center, vinyl slides out of sleeve (animated SVG)
5. 400ms micro-pause on the result
6. Detail sheet opens on top → overlay withdraws

**Technical**:

- `Math.random()` on the TanStack Query collection cache → zero extra requests
- Framer Motion: `useAnimate` to orchestrate the sequence, `staggerChildren` for scrolling
- Same `VinylDisc.tsx` as the detail page, reused as-is
- Accessible from any screen via a global component in `__root.tsx`

**Priority**: after 5.1–5.3, before Phase 6. Simple to implement, high perceived value.
The animation is the heart of it — budget a dedicated half-day to polish it.

### ✅ Exit criteria

- Add/remove with optimistic feedback
- Profile stats displayed
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
    description: 'Your vinyl record collection',
    theme_color: '#0d0d0f',
    background_color: '#0d0d0f',
    display: 'standalone',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
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
//   2. For each item → GET /marketplace/search?release_id=xxx
//   3. Compare with watched_releases.max_price
//   4. If new listing → INSERT feed_events
//   → Supabase Realtime push automatic
```

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
