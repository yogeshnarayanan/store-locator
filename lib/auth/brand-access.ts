import { dbConnect } from '@/lib/db/connect'
import {
  BrandMember,
  BrandMemberDoc,
  BrandMemberRole,
} from '@/lib/db/models/brand-member'
import mongoose from 'mongoose'

/**
 * Role hierarchy for permission checking
 * owner > admin > member
 */
const ROLE_HIERARCHY: Record<BrandMemberRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
}

/**
 * Validates if a user has access to a brand and optionally checks role permissions
 * @param userId - Clerk user ID
 * @param brandId - Brand ID
 * @param requiredRole - Minimum required role (optional)
 * @returns BrandMemberDoc if access granted, null otherwise
 */
export async function validateBrandAccess(
  userId: string,
  brandId: string,
  requiredRole?: BrandMemberRole
): Promise<BrandMemberDoc | null> {
  try {
    await dbConnect()

    // Convert string brandId to ObjectId for MongoDB query
    const brandObjectId = new mongoose.Types.ObjectId(brandId)
    const membership = await BrandMember.findOne({ userId, brandId: brandObjectId })

    if (!membership) {
      return null
    }

    // If a specific role is required, check if user has sufficient permissions
    if (requiredRole) {
      const userRoleLevel = ROLE_HIERARCHY[membership.role as BrandMemberRole]
      const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]

      if (userRoleLevel < requiredRoleLevel) {
        return null
      }
    }

    return membership as BrandMemberDoc
  } catch (error) {
    console.error('Brand access validation error:', error)
    return null
  }
}

/**
 * Check if user is owner of a brand
 * @param userId - Clerk user ID
 * @param brandId - Brand ID
 * @returns true if user is owner, false otherwise
 */
export async function isBrandOwner(
  userId: string,
  brandId: string
): Promise<boolean> {
  const membership = await validateBrandAccess(userId, brandId, 'owner')
  return membership !== null
}

/**
 * Check if user is admin or owner of a brand
 * @param userId - Clerk user ID
 * @param brandId - Brand ID
 * @returns true if user is admin or owner, false otherwise
 */
export async function isBrandAdmin(
  userId: string,
  brandId: string
): Promise<boolean> {
  const membership = await validateBrandAccess(userId, brandId, 'admin')
  return membership !== null
}

/**
 * Check if user has any membership in a brand
 * @param userId - Clerk user ID
 * @param brandId - Brand ID
 * @returns true if user is any member, false otherwise
 */
export async function isBrandMember(
  userId: string,
  brandId: string
): Promise<boolean> {
  const membership = await validateBrandAccess(userId, brandId)
  return membership !== null
}
