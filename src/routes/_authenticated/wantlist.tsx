import { createFileRoute } from '@tanstack/react-router'

import { WantlistPage } from '#/features/wantlist/components/WantlistPage'
import {
  isWantlistRead,
  newestFirstWantlistQueryOptions,
  wantlistQueryOptions,
} from '#/features/wantlist/wantlist.queries'
import { hasFilters, listFilterSchema } from '#/shared/utils/list-filter'
import { listSortSchema, resolveListSort } from '#/shared/utils/list-sort'

export const Route = createFileRoute('/_authenticated/wantlist')({
  // Filters sit next to the sort, apart from the Collection's own
  validateSearch: listSortSchema.extend(listFilterSchema.shape),
  loaderDeps: ({ search }) => ({
    listSort: resolveListSort(search),
    isFiltered: hasFilters(search),
  }),
  // Filtered: the first page of the full read, newest first, which a short
  // Wantlist already holds whole. Unfiltered: the sorted list, unless the
  // full read is whole and sorts on the device.
  loader: ({ context: { queryClient }, deps }) => {
    if (deps.isFiltered)
      return queryClient.prefetchInfiniteQuery(newestFirstWantlistQueryOptions)
    if (isWantlistRead(queryClient)) return
    return queryClient.prefetchInfiniteQuery(
      wantlistQueryOptions(deps.listSort),
    )
  },
  component: () => <Wantlist />,
})

const Wantlist = () => {
  const { user } = Route.useRouteContext()
  const search = Route.useSearch()
  return <WantlistPage search={search} username={user?.username} />
}
