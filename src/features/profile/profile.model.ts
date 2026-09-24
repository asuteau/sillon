import type { DiscogsProfile } from './profile.schema'

export type Profile = {
  currency: string
  recordCount: number
  wantlistCount: number
}

export function toProfile(profile: DiscogsProfile): Profile {
  return {
    currency: profile.curr_abbr ?? 'EUR',
    recordCount: profile.num_collection,
    wantlistCount: profile.num_wantlist,
  }
}
