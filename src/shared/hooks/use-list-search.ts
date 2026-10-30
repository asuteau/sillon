import { useNavigate } from '@tanstack/react-router'
import { useMemo, useTransition } from 'react'

import { pickFilters, withoutFilter } from '#/shared/utils/list-filter'
import type { FilterKind, ListFilters } from '#/shared/utils/list-filter'
import {
  nextListSort,
  resolveListSort,
  toListSortSearch,
} from '#/shared/utils/list-sort'
import type { ListSortSearch, SortKey } from '#/shared/utils/list-sort'

/** A list's search params: its sort and its filters */
export type ListSearch = ListSortSearch & ListFilters

export type ListPath = '/collection' | '/wantlist'

// A list's sort and filters, read from its URL and changed through it.
// Filters and sort are kept across each other's changes.
export const useListSearch = (from: ListPath, search: ListSearch) => {
  const navigate = useNavigate({ from })
  // Stable while the URL is: the filtered list is derived from both
  const listSort = useMemo(() => resolveListSort(search), [search])
  const filters = useMemo(() => pickFilters(search), [search])
  const [isSortPending, startSortTransition] = useTransition()

  const updateSearch = async (update: (prev: ListSearch) => ListSearch) => {
    try {
      await navigate({ search: update })
    } catch {
      // A navigation superseded or refused leaves the URL, and the list, as
      // they were: nothing to show
    }
  }

  const handleSortSelect = (key: SortKey) => {
    startSortTransition(async () => {
      await updateSearch((prev) => ({
        ...prev,
        ...toListSortSearch(nextListSort(listSort, key)),
      }))
    })
  }
  const handleRemoveFilter = (kind: FilterKind) =>
    updateSearch((prev) => withoutFilter(prev, kind))
  // A pick from the picker: every kind, the unset ones undefined
  const handleFiltersChange = (next: ListFilters) =>
    updateSearch((prev) => ({ ...prev, ...next }))
  const handleClearFilters = () =>
    updateSearch((prev) => toListSortSearch(resolveListSort(prev)))

  return {
    listSort,
    filters,
    isSortPending,
    handleSortSelect,
    handleRemoveFilter,
    handleFiltersChange,
    handleClearFilters,
  }
}
