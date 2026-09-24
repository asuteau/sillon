import { z } from 'zod'

export const DiscogsProfileSchema = z.object({
  curr_abbr: z.string().optional(),
  num_collection: z.number(),
  num_wantlist: z.number(),
})

export type DiscogsProfile = z.infer<typeof DiscogsProfileSchema>
