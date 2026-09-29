import { z } from 'zod'

export const MasterResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.string().optional(),
  thumb: z.string(),
  cover_image: z.string(),
  format: z.array(z.string()).optional(),
  user_data: z
    .object({
      in_collection: z.boolean(),
      in_wantlist: z.boolean(),
    })
    .optional(),
})

export const PaginationSchema = z.object({
  page: z.number(),
  pages: z.number(),
  items: z.number(),
})

export const PaginatedSchema = z.object({
  pagination: PaginationSchema,
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
  formats: z
    .array(
      z.object({
        name: z.string(),
        qty: z.string().optional(),
        descriptions: z.array(z.string()).optional(),
        text: z.string().optional(),
      }),
    )
    .optional(),
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
  master_id: z.number().nullish(),
  title: z.string(),
  year: z.number(),
  country: z.string().nullish(),
  artists: z.array(z.object({ name: z.string() })),
  images: z.array(z.object({ uri: z.string() })).nullish(),
  formats: z
    .array(
      z.object({
        name: z.string(),
        qty: z.string(),
        text: z.string().nullish(),
      }),
    )
    .nullish(),
})

export type ReleaseDetail = z.infer<typeof ReleaseDetailSchema>
export type MasterResult = z.infer<typeof MasterResultSchema>
export type SearchPage = z.infer<typeof SearchPageSchema>
export type Version = z.infer<typeof VersionSchema>
export type VersionsPage = z.infer<typeof VersionsPageSchema>

export const BarcodeResultSchema = z.object({
  id: z.number(),
  master_id: z.number().nullish(),
  title: z.string(),
  year: z.string().optional(),
  thumb: z.string().optional(),
  cover_image: z.string().optional(),
  labels: z.array(z.object({ name: z.string() })).optional(),
  formats: z
    .array(
      z.object({
        name: z.string(),
        descriptions: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  genre: z.array(z.string()).optional(),
  style: z.array(z.string()).optional(),
  catno: z.string().optional(),
  user_data: z
    .object({
      in_collection: z.boolean(),
      in_wantlist: z.boolean(),
    })
    .optional(),
})

export type BarcodeResult = z.infer<typeof BarcodeResultSchema>

export const ArtistResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  thumb: z.string(),
  cover_image: z.string().optional(),
  genres: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
})

export const ArtistSearchPageSchema = z.object({
  results: z.array(ArtistResultSchema),
  pagination: PaginationSchema,
})

export const ArtistReleaseSchema = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number().optional(),
  thumb: z.string().optional(),
  type: z.string(),
  role: z.string().optional(),
  format: z.string().optional(),
})

export const ArtistReleasesPageSchema = z.object({
  releases: z.array(ArtistReleaseSchema),
  pagination: PaginationSchema,
})

export const ArtistDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  profile: z.string().optional(),
})

export type ArtistDetail = z.infer<typeof ArtistDetailSchema>
export type ArtistResult = z.infer<typeof ArtistResultSchema>
export type ArtistSearchPage = z.infer<typeof ArtistSearchPageSchema>
export type ArtistRelease = z.infer<typeof ArtistReleaseSchema>
export type ArtistDiscography = {
  releases: ArtistRelease[]
  // True when the artist has more releases than Sillon fetches
  truncated: boolean
}

export type MasterFormats = { id: number; formats: string[] }
