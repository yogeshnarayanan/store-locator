// /app/api/places/near/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { Place } from '@/lib/db/models/place'
import { dualAuth } from '@/lib/auth/dual-auth'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user or API key
    const authResult = await dualAuth(req)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId } = authResult

    // Connect to the database
    await dbConnect()

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))
    const radiusKm = Number(searchParams.get('radiusKm') || 5)
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100)

    // Validate coordinates
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required and must be valid numbers' },
        { status: 400 }
      )
    }

    // Query nearby places using geospatial aggregation
    const places = await Place.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: radiusKm * 1000,
          query: { userId }, // Only fetch places for this user
        },
      },
      { $limit: limit },
    ])

    return NextResponse.json(places)
  } catch (error) {
    console.error('Error fetching nearby places:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
