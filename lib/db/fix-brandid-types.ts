/**
 * Data Migration Script: Convert string brandIds to ObjectIds
 *
 * This script fixes existing BrandMember and Place documents that have
 * brandId stored as strings instead of ObjectIds.
 *
 * Background:
 * - The old migration script stored brandIds as strings using .toString()
 * - The Mongoose schema expects brandId to be ObjectId
 * - This mismatch causes 403 errors in brand access validation
 *
 * Usage:
 *   npx tsx lib/db/fix-brandid-types.ts
 */

import mongoose from 'mongoose'
import { dbConnect } from './connect'
import { BrandMember } from './models/brand-member'
import { Place } from './models/place'

interface FixResult {
  brandMembersFixed: number
  placesFixed: number
  errors: string[]
}

async function fixBrandIdTypes(): Promise<FixResult> {
  const result: FixResult = {
    brandMembersFixed: 0,
    placesFixed: 0,
    errors: [],
  }

  try {
    console.log('🔄 Starting brandId type conversion...\n')
    await dbConnect()

    // Fix BrandMember documents
    console.log('📊 Checking BrandMember documents...')
    const members = await BrandMember.find({}).lean()
    console.log(`   Found ${members.length} BrandMember documents`)

    for (const member of members) {
      try {
        // Check if brandId is a string (needs conversion)
        if (typeof member.brandId === 'string') {
          console.log(`   🔧 Converting BrandMember ${member._id}: "${member.brandId}" → ObjectId`)

          // Convert string to ObjectId
          const brandObjectId = new mongoose.Types.ObjectId(member.brandId)

          // Update the document
          await BrandMember.updateOne(
            { _id: member._id },
            { $set: { brandId: brandObjectId } }
          )

          result.brandMembersFixed++
        }
      } catch (error) {
        const errorMsg = `Error converting BrandMember ${member._id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`   ❌ ${errorMsg}`)
        result.errors.push(errorMsg)
      }
    }

    console.log(`   ✅ Fixed ${result.brandMembersFixed} BrandMember documents\n`)

    // Fix Place documents
    console.log('📊 Checking Place documents...')
    const places = await Place.find({}).lean()
    console.log(`   Found ${places.length} Place documents`)

    for (const place of places) {
      try {
        // Check if brandId is a string (needs conversion)
        if (typeof place.brandId === 'string') {
          console.log(`   🔧 Converting Place ${place._id}: "${place.brandId}" → ObjectId`)

          // Convert string to ObjectId
          const brandObjectId = new mongoose.Types.ObjectId(place.brandId)

          // Update the document
          await Place.updateOne(
            { _id: place._id },
            { $set: { brandId: brandObjectId } }
          )

          result.placesFixed++
        }
      } catch (error) {
        const errorMsg = `Error converting Place ${place._id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`   ❌ ${errorMsg}`)
        result.errors.push(errorMsg)
      }
    }

    console.log(`   ✅ Fixed ${result.placesFixed} Place documents\n`)

    console.log('✅ Type conversion completed!')
    console.log(`\n📊 Summary:`)
    console.log(`   BrandMembers fixed: ${result.brandMembersFixed}`)
    console.log(`   Places fixed: ${result.placesFixed}`)

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`)
      result.errors.forEach(error => console.log(`   - ${error}`))
    }

    return result
  } catch (error) {
    console.error('\n❌ Type conversion failed:', error)
    throw error
  }
}

// Run migration if executed directly
if (require.main === module) {
  fixBrandIdTypes()
    .then(() => {
      console.log('\n🎉 Type conversion script finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Type conversion script failed:', error)
      process.exit(1)
    })
}

export { fixBrandIdTypes }
