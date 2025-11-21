import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { Brand } from '@/lib/db/models/brand'
import { BrandMember } from '@/lib/db/models/brand-member'
import { createBrandSchema } from '@/lib/validation/brand'
import { dualAuth } from '@/lib/auth/dual-auth'

/**
 * GET /api/brands
 * List all brands where the authenticated user is a member
 */
export async function GET(req: NextRequest) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId } = authResult

  try {
    await dbConnect()

    // Find all brand memberships for this user
    const memberships = await BrandMember.find({ userId })
    const brandIds = memberships.map((m) => m.brandId)

    // Fetch all brands where user is a member
    const brands = await Brand.find({ _id: { $in: brandIds } }).sort({
      createdAt: -1,
    })

    // Enrich brands with user's role
    const brandsWithRole = brands.map((brand) => {
      const membership = memberships.find(
        (m) => m.brandId.toString() === brand._id.toString()
      )
      return {
        ...brand.toObject(),
        role: membership?.role,
      }
    })

    return NextResponse.json(brandsWithRole)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/brands
 * Create a new brand and make the authenticated user the owner
 */
export async function POST(req: NextRequest) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId } = authResult

  try {
    await dbConnect()
    const json = await req.json()
    const parsed = createBrandSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description } = parsed.data

    // Create the brand
    const brand = await Brand.create({
      name,
      description,
      ownerId: userId,
    })

    // Create owner membership
    await BrandMember.create({
      brandId: brand._id, // Store as ObjectId
      userId,
      role: 'owner',
      acceptedAt: new Date(),
    })

    return NextResponse.json(
      { ...brand.toObject(), role: 'owner' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}
