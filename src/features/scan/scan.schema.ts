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

// The Stack as kept on the device: read back through this, so a Stack saved
// by an older Sillon is dropped rather than trusted
const ReleaseMatchSchema = z.object({
  id: z.number(),
  masterId: z.number().nullable(),
  artist: z.string(),
  credits: z.array(z.string()),
  title: z.string(),
  year: z.number(),
  country: z.string().nullable(),
  label: z.string().nullable(),
  catno: z.string().nullable(),
  format: z.string().nullable(),
  inCollection: z.boolean(),
  inWantlist: z.boolean(),
})

export const SavedStackSchema = z.object({
  records: z.array(
    z.discriminatedUnion('status', [
      z.object({ barcode: z.string(), status: z.literal('looking-up') }),
      z.object({ barcode: z.string(), status: z.literal('lookup-failed') }),
      z.object({
        barcode: z.string(),
        status: z.literal('found'),
        matches: z.array(ReleaseMatchSchema).min(1),
        chosenId: z.number().nullable(),
        included: z.boolean(),
      }),
    ]),
  ),
  notFound: z.array(z.string()),
})
