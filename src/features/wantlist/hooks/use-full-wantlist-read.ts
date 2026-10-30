import { useFullListRead } from '#/shared/hooks/use-full-list-read'

import { wantlistReader } from '../wantlist.model'
import { newestFirstWantlistQueryOptions } from '../wantlist.queries'

// The whole Wantlist, newest first, in memory only: ADR 0004 persists the
// Collection alone, and nothing but Filters needs every Want
export const useFullWantlistRead = (enabled: boolean) =>
  useFullListRead(newestFirstWantlistQueryOptions, wantlistReader, enabled)
