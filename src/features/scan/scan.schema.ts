import { z } from 'zod'

// One Release Discogs matched for a barcode, from its database search
export const BarcodeMatchSchema = z.object({
  id: z.number(),
  master_id: z.number().nullish(),
  title: z.string(),
  year: z.string().optional(),
  country: z.string().optional(),
  label: z.array(z.string()).optional(),
  catno: z.string().optional(),
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
  user_data: z
    .object({
      in_collection: z.boolean(),
      in_wantlist: z.boolean(),
    })
    .optional(),
})

export type BarcodeMatch = z.infer<typeof BarcodeMatchSchema>
