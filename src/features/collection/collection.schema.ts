import { z } from 'zod'

export const CollectionReleaseSchema = z.object({
  id: z.number(),
  instance_id: z.number(),
  date_added: z.string(),
  basic_information: z.object({
    title: z.string(),
    year: z.number(),
    artists: z.array(z.object({ name: z.string() })),
    cover_image: z.string(),
    thumb: z.string(),
  }),
})

export const CollectionPageSchema = z.object({
  releases: z.array(CollectionReleaseSchema),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    items: z.number(),
  }),
})

export type CollectionRelease = z.infer<typeof CollectionReleaseSchema>
export type CollectionPage = z.infer<typeof CollectionPageSchema>
