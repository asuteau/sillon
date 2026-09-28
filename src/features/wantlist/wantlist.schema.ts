import { z } from 'zod'

export const WantlistItemSchema = z.object({
  id: z.number(),
  date_added: z.string(),
  basic_information: z.object({
    master_id: z.number().optional(),
    title: z.string(),
    year: z.number(),
    artists: z.array(z.object({ name: z.string() })),
    cover_image: z.string(),
    thumb: z.string(),
    styles: z.array(z.string()).optional().default([]),
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
