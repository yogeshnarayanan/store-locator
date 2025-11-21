import { Schema, model, models } from 'mongoose'

export type BrandMemberRole = 'owner' | 'admin' | 'member'

export type BrandMemberDoc = {
  _id: string
  brandId: string
  userId: string // Clerk userId
  role: BrandMemberRole
  invitedBy?: string // userId who invited (optional)
  acceptedAt?: Date // when invitation was accepted (optional for future invite flow)
  createdAt: Date
  updatedAt: Date
}

const BrandMemberSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      required: true,
      default: 'member',
    },
    invitedBy: { type: String },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
)

// Compound unique index: user can only be member once per brand
BrandMemberSchema.index({ brandId: 1, userId: 1 }, { unique: true })

// Index for finding all members of a brand
BrandMemberSchema.index({ brandId: 1 })

// Index for finding all brands a user belongs to
BrandMemberSchema.index({ userId: 1 })

export const BrandMember =
  models.BrandMember || model<BrandMemberDoc>('BrandMember', BrandMemberSchema)
