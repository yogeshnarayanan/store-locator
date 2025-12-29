import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { Place } from '@/lib/db/models/place'
import { upsertPlaceSchema } from '@/lib/validation/place'
import { dualAuth } from '@/lib/auth/dual-auth'
import { validateBrandAccess } from '@/lib/auth/brand-access'
import mongoose from 'mongoose'

/**
 * POST /api/brands/[id]/places
 * Create a new place in the brand (any member can create)
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

    // Validate user has access to this brand
    const membership = await validateBrandAccess(userId, brandId)
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const json = await req.json()
    const parsed = upsertPlaceSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, address, city, state, lat, lng } = parsed.data

    const brandObjectId = new mongoose.Types.ObjectId(brandId)

    const doc = await Place.create({
      name,
      address,
      city,
      state,
      lat,
      lng,
      location: { type: 'Point', coordinates: [lng, lat] },
      brandId: brandObjectId,
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Error creating place:', error)
    return NextResponse.json(
      { error: 'Failed to create place' },
      { status: 500 }
    )
  }
}
