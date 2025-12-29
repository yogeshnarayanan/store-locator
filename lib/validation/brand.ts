import { z } from 'zod'

// Schema for creating a new brand
export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  description: z.string().max(500).optional(),
})
export type CreateBrandInput = z.infer<typeof createBrandSchema>

// Schema for updating brand details
export const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100).optional(),
  description: z.string().max(500).optional(),
})
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>

// Schema for adding a member to a brand
export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
})
export type AddMemberInput = z.infer<typeof addMemberSchema>

// Schema for updating member role
export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
})
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
