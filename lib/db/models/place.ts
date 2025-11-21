import { Schema, model, models } from 'mongoose'

export type PlaceDoc = {
  _id: string
  name: string
  address?: string
  city?: string
  state?: string
  lat: number
  lng: number
  location: { type: 'Point'; coordinates: [number, number] }
  brandId?: string // Optional: for brand-based places
  userId?: string // Optional: for legacy user-based places
  createdAt: Date
  updatedAt: Date
}

const PlaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    brandId: { type: Schema.Types.ObjectId, index: true }, // Optional: for brand-based places
    userId: { type: String, index: true }, // Optional: for legacy user-based places
  },
  { timestamps: true }
)

PlaceSchema.index({ location: '2dsphere' })

export const Place = models.Place || model<PlaceDoc>('Place', PlaceSchema)
