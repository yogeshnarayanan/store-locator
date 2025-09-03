import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/db/connect'
import { ApiKey, generateApiKey, hashApiKey } from '@/lib/db/models/api-key'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  const apiKey = await ApiKey.findOne({ userId })
  
  if (!apiKey) {
    return NextResponse.json({ hasKey: false })
  }

  return NextResponse.json({
    hasKey: true,
    name: apiKey.name,
    isActive: apiKey.isActive,
    lastUsed: apiKey.lastUsed,
    createdAt: apiKey.createdAt,
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  const newApiKey = generateApiKey()
  const hashedKey = hashApiKey(newApiKey)

  await ApiKey.findOneAndUpdate(
    { userId },
    {
      hashedKey,
      name: 'Default API Key',
      isActive: true,
      lastUsed: undefined,
    },
    { upsert: true, new: true }
  )

  return NextResponse.json({
    apiKey: newApiKey,
    message: 'API key generated successfully',
  })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  await ApiKey.deleteOne({ userId })

  return NextResponse.json({ message: 'API key deleted successfully' })
}