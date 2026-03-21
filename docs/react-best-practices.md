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

## 10. Context — React 19 syntax

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
