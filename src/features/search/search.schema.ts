import { z } from 'zod'

export const MasterResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.string().optional(),
  thumb: z.string(),
  cover_image: z.string(),
})

export const PaginationSchema = z.object({
  page: z.number(),
  pages: z.number(),
  items: z.number(),
})

export const SearchPageSchema = z.object({
  results: z.array(MasterResultSchema),
  pagination: PaginationSchema,
})

export const VersionSchema = z.object({
  id: z.number(),
  thumb: z.string(),
  released: z.string(),
  country: z.string(),
  major_formats: z.array(z.string()),
  format: z.string(),
  stats: z.object({
    user: z.object({
      in_collection: z.number(),
      in_wantlist: z.number(),
    }),
  }),
})

export const VersionsPageSchema = z.object({
  versions: z.array(VersionSchema),
  pagination: PaginationSchema,
})

export const ReleaseDetailSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number(),
  country: z.string().optional(),
  artists: z.array(z.object({ name: z.string() })),
  images: z.array(z.object({ uri: z.string() })).optional(),
  formats: z
    .array(
      z.object({
        name: z.string(),
        qty: z.string(),
        text: z.string().optional(),
      }),
    )
    .optional(),
})

export type ReleaseDetail = z.infer<typeof ReleaseDetailSchema>
export type MasterResult = z.infer<typeof MasterResultSchema>
export type SearchPage = z.infer<typeof SearchPageSchema>
export type Version = z.infer<typeof VersionSchema>
export type VersionsPage = z.infer<typeof VersionsPageSchema>
