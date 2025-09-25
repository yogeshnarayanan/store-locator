import { dbConnect } from '@/lib/db/connect'
import { NextRequest, NextResponse } from 'next/server'
import { Place } from '@/lib/db/models/place'


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

    await dbConnect()

  const places = await 
    Place.find({ userId })
    

  return NextResponse.json(places)
}