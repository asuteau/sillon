import { useQuery } from '@tanstack/react-query'
import { PlusCircle, ScanLine } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'

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
    type: z.enum(['all', 'artist']).default('artist'),
    masterId: z.string().optional(),
  }),
  component: Search,
})

function Search() {
  const { q, type, masterId } = Route.useSearch()
  const navigate = useNavigate({ from: '/search' })
  const [inputValue, setInputValue] = useState(q)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
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
        <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
          Add a record
        </h1>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          Search Discogs to add to your collection or wantlist
        </p>
      </header>

      <div className="mb-6">
        <input
          ref={inputRef}
          type="search"
          value={inputValue}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Artist, album, label..."
          className="island-shell w-full rounded-2xl px-4 py-3 text-(--sea-ink) placeholder:text-(--sea-ink-soft) outline-none"
        />
      </div>

      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-1.5 text-sm text-(--sea-ink-soft) transition-colors hover:text-(--sea-ink) cursor-pointer"
        >
          <ScanLine className="h-4 w-4" />
          or scan a barcode
        </button>
      </div>

      <SearchFilters type={type} q={q} onTypeChange={handleTypeChange} />

      <MastersList q={q} type={type} onMasterClick={handleMasterClick} />

      {isScannerOpen && (
        <BarcodeScanner
          onClose={() => setIsScannerOpen(false)}
          onSearchManually={() => {
            setIsScannerOpen(false)
            inputRef.current?.focus()
          }}
        />
      )}
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
    { value: 'artist' as const, label: 'Artist only' },
    { value: 'all' as const, label: 'All' },
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

  if (q.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <PlusCircle className="h-12 w-12 text-(--sea-ink)" />
        <div>
          <p className="font-semibold text-(--sea-ink)">Find a record</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Search the Discogs database by artist
            <br />
            or album title, then add it directly
            <br />
            to your collection or wantlist.
          </p>
        </div>
      </div>
    )
  }

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
