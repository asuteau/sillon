import { z } from 'zod'

import {
  ReleaseFormatsSchema,
  ReleaseLabelsSchema,
} from '#/features/collection/collection.schema'

export const WantlistItemSchema = z.object({
  id: z.number(),
  date_added: z.string(),
  basic_information: z.object({
    master_id: z.number().optional(),
    title: z.string(),
    year: z.number(),
    artists: z.array(
      // id tells artists apart: homonyms differ, Name variations share it
      z.object({
        id: z.number(),
        name: z.string(),
        anv: z.string().optional(),
      }),
    ),
    cover_image: z.string(),
    thumb: z.string(),
    styles: z.array(z.string()).optional().default([]),
    formats: ReleaseFormatsSchema,
    labels: ReleaseLabelsSchema,
  }),
})

export const WantlistPageSchema = z.object({
  wants: z.array(WantlistItemSchema),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    items: z.number(),
  }),
})

export type WantlistItem = z.infer<typeof WantlistItemSchema>
export type WantlistPage = z.infer<typeof WantlistPageSchema>
