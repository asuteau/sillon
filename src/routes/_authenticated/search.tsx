import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { useDebounce } from '#/shared/hooks/useDebounce'

import { MasterCard } from '#/features/search/components/MasterCard'
import { VersionRow } from '#/features/search/components/VersionRow'
import { toMaster, toMasterVersion } from '#/features/search/search.model'
import {
  mastersQueryOptions,
  versionsQueryOptions,
} from '#/features/search/search.queries'

export const Route = createFileRoute('/_authenticated/search')({
  validateSearch: z.object({
    q: z.string().default(''),
    type: z.enum(['all', 'artist']).default('all'),
    masterId: z.string().optional(),
  }),
  component: Search,
})

function Search() {
  const { q, type, masterId } = Route.useSearch()
  const navigate = useNavigate({ from: '/search' })
  const [inputValue, setInputValue] = useState(q)
  const debouncedValue = useDebounce(inputValue)

  useEffect(() => {
    if (debouncedValue === q) return
    navigate({
      search: (s) => ({ ...s, q: debouncedValue, masterId: undefined }),
    }).catch(() => {})
  }, [debouncedValue])

  const handleQueryChange = (value: string) => {
    setInputValue(value)
  }

  const handleMasterClick = (id: number) => {
    navigate({
      search: (s) => ({ ...s, masterId: String(id) }),
    }).catch(() => {})
  }

  const handleBack = () => {
    navigate({ search: (s) => ({ q: s.q, type: s.type }) }).catch(() => {})
  }

  const handleTypeChange = (newType: 'all' | 'artist') => {
    navigate({
      search: (s) => ({ q: s.q, type: newType, masterId: undefined }),
    }).catch(() => {})
  }

  if (masterId !== undefined) {
    return (
      <main className="page-wrap px-4 pb-24 sm:pb-8 pt-14">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="island-kicker rise-in inline-flex items-center gap-1.5 cursor-pointer"
          >
            ← Search
          </button>
        </div>

        <VersionsList masterId={masterId} q={q} />
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-24 sm:pb-8 pt-14">
      <header className="mb-8">
        <p className="island-kicker mb-2">Discogs</p>
        <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
          Search
        </h1>
      </header>

      <div className="mb-6">
        <input
          type="search"
          value={inputValue}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Artist, album…"
          className="island-shell w-full rounded-2xl px-4 py-3 text-(--sea-ink) placeholder:text-(--sea-ink-soft) outline-none"
        />
      </div>

      <SearchFilters type={type} q={q} onTypeChange={handleTypeChange} />

      <MastersList q={q} type={type} onMasterClick={handleMasterClick} />
    </main>
  )
}

interface SearchFiltersProps {
  type: 'all' | 'artist'
  q: string
  onTypeChange: (type: 'all' | 'artist') => void
}

function SearchFilters({ type, q, onTypeChange }: SearchFiltersProps) {
  if (q.length === 0) {
    return null
  }

  const filters = [
    { value: 'all' as const, label: 'All' },
    { value: 'artist' as const, label: 'Artist only' },
  ]

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onTypeChange(filter.value)}
          className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            type === filter.value
              ? 'bg-(--sea-ink) text-(--chip-bg)'
              : 'border border-(--line) text-(--sea-ink)'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

interface MastersListProps {
  q: string
  type: 'all' | 'artist'
  onMasterClick: (id: number) => void
}

function MastersList({ q, type, onMasterClick }: MastersListProps) {
  const { data, isFetching } = useQuery(mastersQueryOptions(q, type))

  const masters = useMemo(
    () => (data?.results ?? []).map(toMaster),
    [data?.results],
  )

  if (q.length <= 2) {
    return (
      <p className="text-(--sea-ink-soft)">
        Type at least 3 characters to search.
      </p>
    )
  }

  if (isFetching && masters.length === 0) {
    return <p className="text-(--sea-ink-soft)">Searching…</p>
  }

  if (masters.length === 0) {
    return <p className="text-(--sea-ink-soft)">No results for "{q}".</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {masters.map((master, index) => (
        <MasterCard
          key={master.id}
          master={master}
          index={index}
          onClick={() => onMasterClick(master.id)}
        />
      ))}
    </ul>
  )
}

interface VersionsListProps {
  masterId: string
  q: string
}

function VersionsList({ masterId, q }: VersionsListProps) {
  const { data, isFetching } = useQuery(versionsQueryOptions(masterId))

  const versions = useMemo(
    () => (data?.versions ?? []).map(toMasterVersion),
    [data?.versions],
  )

  if (isFetching && versions.length === 0) {
    return <p className="text-(--sea-ink-soft)">Loading versions…</p>
  }

  if (versions.length === 0) {
    return <p className="text-(--sea-ink-soft)">No vinyl versions found.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {versions.map((version) => (
        <VersionRow
          key={version.id}
          version={version}
          masterId={masterId}
          q={q}
        />
      ))}
    </ul>
  )
}
