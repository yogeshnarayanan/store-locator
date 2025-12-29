import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { Brand } from '@/lib/db/models/brand'
import { BrandMember } from '@/lib/db/models/brand-member'
import { Place } from '@/lib/db/models/place'
import { updateBrandSchema } from '@/lib/validation/brand'
import { dualAuth } from '@/lib/auth/dual-auth'
import { validateBrandAccess } from '@/lib/auth/brand-access'
import mongoose from 'mongoose'

/**
 * GET /api/brands/[id]
 * Get brand details (any member can access)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId } = authResult

  try {
    const { id: brandId } = await params
    await dbConnect()

    // Validate user has access to this brand
    const membership = await validateBrandAccess(userId, brandId)
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const brand = await Brand.findById(brandId)
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...brand.toObject(),
      role: membership.role,
    })
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/brands/[id]
 * Update brand details (admin or owner only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId } = authResult

  try {
    const { id: brandId } = await params
    await dbConnect()

    // Validate user has admin access
    const membership = await validateBrandAccess(userId, brandId, 'admin')
    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const json = await req.json()
    const parsed = updateBrandSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const brand = await Brand.findByIdAndUpdate(brandId, parsed.data, {
      new: true,
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...brand.toObject(),
      role: membership.role,
    })
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json(
      { error: 'Failed to update brand' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/brands/[id]
 * Delete brand (owner only) - also deletes all members and places
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId } = authResult

  try {
    const { id: brandId } = await params
    await dbConnect()

    // Validate user is owner
    const membership = await validateBrandAccess(userId, brandId, 'owner')
    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden - Owner access required' },
        { status: 403 }
      )
    }

    const brandObjectId = new mongoose.Types.ObjectId(brandId)

    // Delete all associated data
    await Promise.all([
      Brand.findByIdAndDelete(brandId),
      BrandMember.deleteMany({ brandId: brandObjectId }),
      Place.deleteMany({ brandId: brandObjectId }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand' },
      { status: 500 }
    )
  }
}
