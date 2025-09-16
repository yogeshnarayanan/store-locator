import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { Place } from '@/lib/db/models/place'
import { upsertPlaceSchema } from '@/lib/validation/place'
import { dualAuth } from '@/lib/auth/dual-auth'

export async function POST(req: NextRequest) {
  const authResult = await dualAuth(req)
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId } = authResult

  await dbConnect()
  const json = await req.json()
  const parsed = upsertPlaceSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // ✅ Destructure fields
  const { name, address, city, state, lat, lng } = parsed.data

  // 🔎 Duplicate check by coordinates + user
  const exists = await Place.findOne({
    "location.coordinates": [lng, lat],
    userId,
  })

  if (exists) {
    return NextResponse.json(
      { error: 'This place has already been Added' },
      { status: 409 } // Conflict
    )
  }

  // ✅ Create new place
  const doc = await Place.create({
    name,
    address,
    city,
    state,
    lat,
    lng,
    location: { type: 'Point', coordinates: [lng, lat] },
    userId,
  })

  return NextResponse.json(doc, { status: 201 })
}
