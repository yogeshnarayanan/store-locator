import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { Place } from '@/lib/db/models/place'
import { dualAuth } from '@/lib/auth/dual-auth'
import { validateBrandAccess } from '@/lib/auth/brand-access'
import mongoose from 'mongoose'

/**
 * GET /api/brands/[id]/places/near?lat={lat}&lng={lng}&radiusKm={km}&limit={n}
 * Find nearby places within a brand using geospatial query
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

    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))
    const radiusKm = Number(searchParams.get('radiusKm') || 5)
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: 'lat and lng are required' },
        { status: 400 }
      )
    }

    const brandObjectId = new mongoose.Types.ObjectId(brandId)

    const results = await Place.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: radiusKm * 1000,
          query: { brandId: brandObjectId },
        },
      },
      { $limit: limit },
    ])

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching nearby places:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby places' },
      { status: 500 }
    )
  }
}
