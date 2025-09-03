import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { dbConnect } from '@/lib/db/connect'
import { ApiKey, hashApiKey } from '@/lib/db/models/api-key'

export interface AuthResult {
  userId: string
  isApiKey: boolean
}

export async function dualAuth(req: NextRequest): Promise<AuthResult | null> {
  const authHeader = req.headers.get('authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7)
    if (apiKey.startsWith('sk_')) {
      return await authenticateApiKey(apiKey)
    }
  }

  const { userId } = await auth()
  if (userId) {
    return { userId, isApiKey: false }
  }

  return null
}

async function authenticateApiKey(apiKey: string): Promise<AuthResult | null> {
  try {
    await dbConnect()
    const hashedKey = hashApiKey(apiKey)
    
    const keyDoc = await ApiKey.findOne({ 
      hashedKey, 
      isActive: true 
    })

    if (!keyDoc) return null

    await ApiKey.updateOne(
      { _id: keyDoc._id },
      { lastUsed: new Date() }
    )

    return { userId: keyDoc.userId, isApiKey: true }
  } catch (error) {
    console.error('API key authentication error:', error)
    return null
  }
}