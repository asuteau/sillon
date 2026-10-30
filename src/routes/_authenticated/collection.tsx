import { createFileRoute } from '@tanstack/react-router'

import {
  collectionQueryOptions,
  isPersistedListSort,
} from '#/features/collection/collection.queries'
import { CollectionPage } from '#/features/collection/components/CollectionPage'
import { hasFilters, listFilterSchema } from '#/shared/utils/list-filter'
import { listSortSchema, resolveListSort } from '#/shared/utils/list-sort'

export const Route = createFileRoute('/_authenticated/collection')({
  // Filters sit next to the sort, e.g. ?style=Shoegaze&decade=1990&sort=year
  validateSearch: listSortSchema.extend(listFilterSchema.shape),
  // The newest-first list, and the full read filters run over, load on the
  // client, which may restore them from the device instead of asking Discogs
  ssr: ({ search }) =>
    search.status !== 'success' ||
    (!hasFilters(search.value) &&
      !isPersistedListSort(resolveListSort(search.value))),
  loaderDeps: ({ search }) => ({
    listSort: resolveListSort(search),
    isFiltered: hasFilters(search),
  }),
  loader: ({ context: { queryClient }, deps }) =>
    deps.isFiltered
      ? undefined
      : queryClient.prefetchInfiniteQuery(
          collectionQueryOptions(deps.listSort),
        ),
  component: () => <Collection />,
})

const Collection = () => {
  const { user } = Route.useRouteContext()
  const search = Route.useSearch()
  return <CollectionPage search={search} username={user?.username} />
}
