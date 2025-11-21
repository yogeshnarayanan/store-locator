import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { BrandMember } from '@/lib/db/models/brand-member'
import { addMemberSchema } from '@/lib/validation/brand'
import { dualAuth } from '@/lib/auth/dual-auth'
import { validateBrandAccess } from '@/lib/auth/brand-access'
import mongoose from 'mongoose'

/**
 * GET /api/brands/[id]/members
 * List all members of a brand (any member can access)
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

    const brandObjectId = new mongoose.Types.ObjectId(brandId)
    const members = await BrandMember.find({ brandId: brandObjectId }).sort({ createdAt: 1 })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/brands/[id]/members
 * Add a new member to the brand (admin or owner only)
 */
export async function POST(
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
    const parsed = addMemberSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { userId: newUserId, role } = parsed.data

    const brandObjectId = new mongoose.Types.ObjectId(brandId)

    // Check if user is already a member
    const existingMember = await BrandMember.findOne({
      brandId: brandObjectId,
      userId: newUserId,
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this brand' },
        { status: 409 }
      )
    }

    // Create new member
    const newMember = await BrandMember.create({
      brandId: brandObjectId,
      userId: newUserId,
      role,
      invitedBy: userId,
      acceptedAt: new Date(),
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}
