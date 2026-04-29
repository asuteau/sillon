# Sillon — React Best Practices

Guidelines applied consistently across the codebase.
Claude Code should follow these rules in every component it generates.

---

## 1. Early returns — nominal case last

The default `return` is always the nominal case. Specific or exceptional cases
(loading, error, empty, mobile variant) use early returns at the top.

**✅ Correct**

```tsx
function RecordSpotlight({ record, onClose, onPickAgain, isPickingAgain }) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Specific case first
  if (isMobile) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent side="bottom">
          <SpotlightContent
            {...{ record, onClose, onPickAgain, isPickingAgain }}
          />
        </SheetContent>
      </Sheet>
    )
  }

  // Nominal case last
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <SpotlightContent
          {...{ record, onClose, onPickAgain, isPickingAgain }}
        />
      </DialogContent>
    </Dialog>
  )
}
```

**❌ Avoid**

```tsx
// Ternary makes the nominal case hard to identify
return isMobile ? <Sheet>...</Sheet> : <Dialog>...</Dialog>
```

This applies to: breakpoint variants, loading states, empty states, error boundaries,
authenticated vs unauthenticated views.

---

## 2. Component responsibilities

Each component has a single responsibility. Split when a component handles
both data fetching and rendering.

```
Container component  → fetches data, manages state, no markup
Presentational       → receives props, renders markup, no data fetching
```

```tsx
// ✅ Container
function CollectionGrid({ username }: { username: string }) {
  const { data } = useSuspenseInfiniteQuery(collectionQueryOptions(username))
  const records = useMemo(
    () => data.pages.flatMap((p) => p.releases),
    [data.pages],
  )
  return <CollectionGridView records={records} />
}

// ✅ Presentational
function CollectionGridView({ records }: { records: Record[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} />
      ))}
    </div>
  )
}
```

---

## 3. Named exports only

No default exports on components. Named exports are easier to refactor,
grep, and import consistently.

```tsx
// ✅
export function RecordCard({ record }: { record: Record }) { ... }

// ❌
export default function RecordCard({ record }: { record: Record }) { ... }
```

Exception: route components declared inline in `.routes.tsx` files.

---

## 4. Props interfaces — explicit and co-located

Define the props interface directly above the component. No inline types in the
function signature for anything beyond trivial cases.

```tsx
// ✅
interface RecordCardProps {
  record: Record
  onPress?: () => void
  variant?: 'grid' | 'list' | 'bin'
}

export function RecordCard({ record, onPress, variant = 'grid' }: RecordCardProps) { ... }

// ❌ — hard to read, hard to reuse
export function RecordCard({ record, onPress, variant = 'grid' }: {
  record: Record
  onPress?: () => void
  variant?: 'grid' | 'list' | 'bin'
}) { ... }
```

---

## 5. No raw localStorage access

Always use `useLocalStorage` from `shared/hooks/`. Raw `localStorage` calls are
SSR-unsafe (TanStack Start runs on the server where `window` is undefined) and
bypass type safety.

```tsx
// ✅
const [theme, setTheme] = useLocalStorage<Theme>('sillon-theme', 'system')

// ❌
const [theme, setTheme] = useState<Theme>(
  (localStorage.getItem('sillon-theme') as Theme) ?? 'system',
)
```

---

## 6. No unsafe type casts

Avoid `as` casts. Use Zod schemas at API boundaries to get properly typed data,
and `satisfies` or proper inference everywhere else.

```tsx
// ✅ — type comes from Zod inference, no cast needed
const record = RecordSchema.parse(raw) // type: Record

// ❌
const record = raw as Record
```

Exception: `as const` for literal type narrowing is acceptable.

---

## 7. useMemo for derived data from queries

Always memoize data derived from infinite query pages. Without `useMemo`,
the flatMap runs on every render.

```tsx
// ✅
const records = useMemo(
  () => data.pages.flatMap((page) => page.releases),
  [data.pages],
)

// ❌ — recomputes on every render
const records = data.pages.flatMap((page) => page.releases)
```

---

## 8. Async event handlers — explicit error handling

Async onClick handlers should always handle errors explicitly.
Never let an unhandled promise rejection crash the UI silently.

```tsx
// ✅
const handlePick = async () => {
  try {
    const { data } = await refetch()
    if (data) setPicked(data)
  } catch (error) {
    // handle or log
  }
}

// ❌
const handlePick = async () => {
  const { data } = await refetch()
  if (data) setPicked(data)
}
```

---

## 9. Suffix rule for feature files

One file per responsibility → use dot suffix.
Multiple files for one responsibility → promote to subfolder.

```
// ✅ Single file per role
features/collection/
  collection.schema.ts
  collection.model.ts
  collection.queries.ts
  collection.utils.ts

// ✅ Promoted to subfolder when needed
features/collection/
  queries/
    collection.queries.ts
    cover.queries.ts
```

---

## 10. Arrow functions only

Always use arrow functions — for components, utilities, handlers, and helpers.
Never use the `function` keyword.

```ts
// ✅
export const formatDateAdded = (date: string): string => ...

export const CoverArt = ({ title }: CoverArtProps) => { ... }

// ❌
export function formatDateAdded(date: string): string { ... }

function CoverArt({ title }: CoverArtProps) { ... }
```

---

## 11. Context — React 19 syntax

No `.Provider` wrapper. Pass value directly to the context component.

```tsx
// ✅ React 19
<ThemeContext value={{ theme, setTheme }}>
  {children}
</ThemeContext>

// ❌ React 18 pattern
<ThemeContext.Provider value={{ theme, setTheme }}>
  {children}
</ThemeContext.Provider>
```

---

## 12. Custom Hooks — deport Effects and stateful logic

Every `useEffect` that synchronises with an external system belongs in a custom
hook, not directly in a component. Hooks make intent explicit, enable re-use,
and keep rendering code free of side effects.

Name hooks after **what they do**, not a lifecycle (`useOnlineStatus`,
`useScrollPosition` — never `useMount`, `useEffectOnce`).

```tsx
// ❌ Effect leaking into a component
const CollectionGrid = () => {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  // ...
}

// ✅ Logic extracted into a focused hook
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return isOnline
}

const CollectionGrid = () => {
  const isOnline = useOnlineStatus()
  // ...
}
```

Each call to a custom hook gets **independent** state — hooks share logic, not
state. When a hook accepts a callback (event handler), wrap it in
`useEffectEvent` (see §16) so changes to it don't re-trigger the Effect.

Place hooks in `shared/hooks/` (cross-feature) or `features/<domain>/hooks/`
(domain-specific), one hook per file with a `.hook.ts` suffix.

---

## 13. Refs — side-channel values, not render values

Refs are for values that **do not affect the render output**: timer IDs, DOM
nodes, interval handles, previous-value snapshots. If the value appears in JSX,
use state.

```tsx
// ✅ Ref for interval ID (never rendered)
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

const handleStart = () => {
  intervalRef.current = setInterval(() => setNow(Date.now()), 10)
}
const handleStop = () => {
  clearInterval(intervalRef.current!)
}

// ❌ Ref masquerading as state — UI never updates
const countRef = useRef(0)
return <p>Clicked {countRef.current} times</p>  // stale forever
```

**Never read or write `ref.current` during rendering.** Only access refs inside
event handlers or Effects.

For a **dynamic list of DOM nodes**, use a ref callback that stores a `Map`
rather than multiple top-level `useRef` calls:

```tsx
const itemsRef = useRef<Map<string, HTMLLIElement>>(new Map())

// ref callback on each list item
<li
  ref={(node) => {
    if (node) itemsRef.current.set(id, node)
    else       itemsRef.current.delete(id)
  }}
/>
```

Use `useImperativeHandle` to expose a **narrow subset** of a DOM API to the
parent instead of forwarding the raw element:

```tsx
const SearchInput = ({ ref }: { ref: React.Ref<{ focus(): void }> }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }))
  return <input ref={inputRef} />
}
```

---

## 14. When NOT to use an Effect

Effects are only for synchronising with **external systems** (browser APIs,
WebSockets, third-party widgets). Every other use is a code smell.

### Derived data — calculate at render time

```tsx
// ❌ Wasteful: two renders instead of one
const [fullName, setFullName] = useState('')
useEffect(() => setFullName(`${first} ${last}`), [first, last])

// ✅ Plain calculation during render
const fullName = `${first} ${last}`
// or, if expensive:
const sortedItems = useMemo(() => sort(items), [items])
```

### Reset state when a prop changes — use `key`

```tsx
// ❌ Effect that clears comment when userId changes
useEffect(() => setComment(''), [userId])

// ✅ Key tells React to remount the child as a fresh instance
<Profile key={userId} userId={userId} />
```

### Notify parent on state change — update together in the handler

```tsx
// ❌ Effect fires after render, causes extra cycle
useEffect(() => onChange(isOn), [isOn, onChange])

// ✅ Update both states in the same event handler
const handleClick = () => {
  const next = !isOn
  setIsOn(next)
  onChange(next)
}
```

### Chains of Effects — compute in a single event handler

```tsx
// ❌ Each setter triggers the next Effect — unpredictable order
useEffect(() => { if (card?.gold) setGoldCount(c => c + 1) }, [card])
useEffect(() => { if (goldCount > 3) setRound(r => r + 1)  }, [goldCount])

// ✅ Single handler, single render
const handlePlaceCard = (nextCard: Card) => {
  setCard(nextCard)
  const nextGold = nextCard.gold ? goldCount + 1 : goldCount
  setGoldCount(nextGold > 3 ? 0 : nextGold)
  if (nextGold > 3) setRound(r => r + 1)
}
```

### Data fetching — always use the `ignore` flag

```tsx
useEffect(() => {
  let ignore = false
  fetchRelease(id).then((data) => {
    if (!ignore) setRelease(data)
  })
  return () => { ignore = true }
}, [id])
```

Prefer TanStack Query (`useQuery`, `useSuspenseQuery`) over manual fetch
Effects — the library handles caching, deduplication, and race conditions.

### External store subscriptions — use `useSyncExternalStore`

```tsx
// ❌ Manual Effect subscription
useEffect(() => {
  const handler = () => setIsOnline(navigator.onLine)
  window.addEventListener('online',  handler)
  window.addEventListener('offline', handler)
  return () => { /* cleanup */ }
}, [])

// ✅ Purpose-built API
const isOnline = useSyncExternalStore(
  (cb) => {
    window.addEventListener('online',  cb)
    window.addEventListener('offline', cb)
    return () => {
      window.removeEventListener('online',  cb)
      window.removeEventListener('offline', cb)
    }
  },
  () => navigator.onLine,
  () => true,
)
```

---

## 15. Effect dependencies — follow the linter, always

The `react-hooks/exhaustive-deps` rule catches stale-closure bugs before they
reach production. **Never suppress it.**

```tsx
// ❌ Hidden stale-closure bug
useEffect(() => {
  const id = setInterval(() => setCount(count + increment), 1000)
  return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

When a dependency feels wrong, **fix the code** rather than the lint comment:

| Situation | Fix |
|---|---|
| Object/function created on every render | Move it inside the Effect or outside the component |
| Object prop with multiple fields | Destructure primitives: `const { roomId, url } = options` |
| Reading state to update it | Use updater form: `setCount(prev => prev + 1)` |
| Two unrelated synchronisations in one Effect | Split into two separate `useEffect` calls |
| Non-reactive value causing spurious re-syncs | Use `useEffectEvent` (see §16) |

Each `useEffect` should represent **exactly one** synchronisation concern:

```tsx
// ❌ Mixed concerns — analytics and connection share one Effect
useEffect(() => {
  logVisit(roomId)
  const conn = connect(roomId)
  return () => conn.disconnect()
}, [roomId])

// ✅ One concern per Effect
useEffect(() => { logVisit(roomId) }, [roomId])

useEffect(() => {
  const conn = connect(roomId)
  return () => conn.disconnect()
}, [roomId])
```

Static values that never change (module-level constants, functions with no
closure over props/state) belong **outside** the component so they are
genuinely non-reactive and need not be listed as dependencies.

---

## 16. `useEffectEvent` — non-reactive code inside reactive Effects

When an Effect needs to **read** a value without **reacting** to its changes,
`useEffectEvent` is the correct tool — not a linter suppression comment.

```tsx
import { useEffect, useEffectEvent } from 'react'

// ❌ theme change causes unwanted reconnection
useEffect(() => {
  const conn = connect(roomId)
  conn.on('connected', () => showNotification('Connected!', theme))
  conn.connect()
  return () => conn.disconnect()
}, [roomId, theme])

// ✅ onConnected always sees the latest theme without being a dependency
const onConnected = useEffectEvent(() => {
  showNotification('Connected!', theme)
})

useEffect(() => {
  const conn = connect(roomId)
  conn.on('connected', onConnected)
  conn.connect()
  return () => conn.disconnect()
}, [roomId])  // theme is gone from deps
```

Rules:
- **Never add** the `useEffectEvent` variable to the dependency array.
- **Only call** Effect Events from inside Effects — never pass them to other
  components or hooks as props/arguments.
- Use this for values that are "context" to an event (e.g. current theme,
  mute state, analytics flags) that the Effect should read but not re-sync on.
