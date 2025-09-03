import mongoose, { Schema, Document } from 'mongoose'
import crypto from 'crypto'

export interface ApiKeyDoc extends Document {
  userId: string
  hashedKey: string
  name: string
  isActive: boolean
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

const ApiKeySchema = new Schema<ApiKeyDoc>(
  {
    userId: { type: String, required: true, unique: true },
    hashedKey: { type: String, required: true, unique: true },
    name: { type: String, required: true, default: 'Default API Key' },
    isActive: { type: Boolean, required: true, default: true },
    lastUsed: { type: Date },
  },
  { timestamps: true }
)

ApiKeySchema.index({ hashedKey: 1 })
ApiKeySchema.index({ userId: 1 }, { unique: true })

export function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString('hex')}`
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

export const ApiKey = mongoose.models.ApiKey || mongoose.model<ApiKeyDoc>('ApiKey', ApiKeySchema)