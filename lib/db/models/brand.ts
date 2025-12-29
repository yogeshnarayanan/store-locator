import { Schema, model, models } from 'mongoose'

export type BrandDoc = {
  _id: string
  name: string
  description?: string
  ownerId: string // Clerk userId of the owner
  createdAt: Date
  updatedAt: Date
}

const BrandSchema = new Schema<BrandDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ownerId: { type: String, required: true, index: true },
  },
  { timestamps: true }
)

// Index for fast lookups of brands by owner
BrandSchema.index({ ownerId: 1 })

export const Brand = models.Brand || model<BrandDoc>('Brand', BrandSchema)
