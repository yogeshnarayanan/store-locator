import { z } from 'zod'

export const upsertPlaceSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
})
export type UpsertPlaceInput = z.infer<typeof upsertPlaceSchema>
