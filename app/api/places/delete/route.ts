import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { Place } from '@/lib/db/models/place'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')   // from query param
    const ObjectId = searchParams.get('ObjectId') // from query param

    if (!userId || !ObjectId) {
      return NextResponse.json({ error: 'User ID and ID is required' }, { status: 400 })
    }

    if (!ObjectId) {
      return NextResponse.json({ error: 'Object ID is required' }, { status: 400 })
    }

    await dbConnect()

    const result = await Place.deleteOne({ _id: ObjectId, userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Place not found or you are not authorized' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Place deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting place:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
