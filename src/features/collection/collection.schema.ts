import { z } from 'zod'

export const CollectionReleaseSchema = z.object({
  id: z.number(),
  instance_id: z.number(),
  folder_id: z.number(),
  date_added: z.string(),
  basic_information: z.object({
    master_id: z.number().optional(),
    title: z.string(),
    year: z.number(),
    artists: z.array(
      z.object({ name: z.string(), anv: z.string().optional() }),
    ),
    cover_image: z.string(),
    thumb: z.string(),
    styles: z.array(z.string()).optional().default([]),
    formats: z
      .array(
        z.object({
          name: z.string(),
          qty: z.string().optional(),
          descriptions: z.array(z.string()).optional(),
          text: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
    labels: z
      .array(z.object({ name: z.string(), catno: z.string().optional() }))
      .optional()
      .default([]),
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

// Discogs returns preformatted amounts, e.g. "€1,240.52"
export const CollectionValueSchema = z.object({
  minimum: z.string(),
  median: z.string(),
  maximum: z.string(),
})

export type CollectionValue = z.infer<typeof CollectionValueSchema>
