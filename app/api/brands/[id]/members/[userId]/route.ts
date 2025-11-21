import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { BrandMember } from '@/lib/db/models/brand-member'
import { updateMemberRoleSchema } from '@/lib/validation/brand'
import { dualAuth } from '@/lib/auth/dual-auth'
import { validateBrandAccess } from '@/lib/auth/brand-access'
import mongoose from 'mongoose'

/**
 * PUT /api/brands/[id]/members/[userId]
 * Update member role (admin or owner only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId: currentUserId } = authResult

  try {
    const { id: brandId, userId: targetUserId } = await params
    await dbConnect()

    // Validate current user has admin access
    const membership = await validateBrandAccess(
      currentUserId,
      brandId,
      'admin'
    )
    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const json = await req.json()
    const parsed = updateMemberRoleSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { role } = parsed.data

    const brandObjectId = new mongoose.Types.ObjectId(brandId)

    // Prevent removing the last owner
    if (role !== 'owner') {
      const ownerCount = await BrandMember.countDocuments({
        brandId: brandObjectId,
        role: 'owner',
      })
      const targetMember = await BrandMember.findOne({
        brandId: brandObjectId,
        userId: targetUserId,
      })

      if (targetMember?.role === 'owner' && ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the brand' },
          { status: 400 }
        )
      }
    }

    const updatedMember = await BrandMember.findOneAndUpdate(
      { brandId: brandObjectId, userId: targetUserId },
      { role },
      { new: true }
    )

    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/brands/[id]/members/[userId]
 * Remove member from brand (admin or owner only, or self-removal)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId: currentUserId } = authResult

  try {
    const { id: brandId, userId: targetUserId } = await params
    await dbConnect()

    // Check if removing self or if admin
    const isSelfRemoval = currentUserId === targetUserId
    if (!isSelfRemoval) {
      const membership = await validateBrandAccess(
        currentUserId,
        brandId,
        'admin'
      )
      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }
    }

    const brandObjectId = new mongoose.Types.ObjectId(brandId)

    // Prevent removing the last owner
    const targetMember = await BrandMember.findOne({
      brandId: brandObjectId,
      userId: targetUserId,
    })

    if (targetMember?.role === 'owner') {
      const ownerCount = await BrandMember.countDocuments({
        brandId: brandObjectId,
        role: 'owner',
      })

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the brand' },
          { status: 400 }
        )
      }
    }

    const result = await BrandMember.findOneAndDelete({
      brandId: brandObjectId,
      userId: targetUserId,
    })

    if (!result) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
