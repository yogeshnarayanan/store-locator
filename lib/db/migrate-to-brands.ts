/**
 * Data Migration Script: User → Brand → Places
 *
 * This script migrates existing places from user-owned to brand-owned architecture.
 *
 * For each existing user with places:
 * 1. Creates a default "My Brand" brand
 * 2. Creates a BrandMember with owner role
 * 3. Updates all their places to reference the new brandId
 *
 * Usage:
 *   npx tsx lib/db/migrate-to-brands.ts
 */

import { dbConnect } from './connect'
import { Brand } from './models/brand'
import { BrandMember } from './models/brand-member'
import { Place } from './models/place'

interface MigrationResult {
  usersProcessed: number
  brandsCreated: number
  placesUpdated: number
  errors: string[]
}

async function migrateToBrands(): Promise<MigrationResult> {
  const result: MigrationResult = {
    usersProcessed: 0,
    brandsCreated: 0,
    placesUpdated: 0,
    errors: [],
  }

  try {
    console.log('🔄 Starting migration to brand-based architecture...\n')
    await dbConnect()

    // Get all unique userIds from places (old schema)
    // @ts-ignore - userId field will be removed after migration
    const userIds = await Place.distinct('userId')
    console.log(`📊 Found ${userIds.length} unique users with places\n`)

    for (const userId of userIds) {
      try {
        console.log(`👤 Processing user: ${userId}`)

        // Check if user already has a brand (in case of partial migration)
        const existingBrand = await Brand.findOne({ ownerId: userId })
        if (existingBrand) {
          console.log(`  ⏭️  User already has brand: ${existingBrand.name}`)
          result.usersProcessed++
          continue
        }

        // Create brand for this user
        const brand = await Brand.create({
          name: 'My Brand',
          description: 'Default brand created during migration',
          ownerId: userId,
        })
        console.log(`  ✅ Created brand: ${brand._id}`)
        result.brandsCreated++

        // Create owner membership
        await BrandMember.create({
          brandId: brand._id, // Store as ObjectId, not string
          userId,
          role: 'owner',
          acceptedAt: new Date(),
        })
        console.log(`  ✅ Created owner membership`)

        // Update all places for this user
        // @ts-ignore - userId field will be removed after migration
        const updateResult = await Place.updateMany(
          { userId },
          {
            $set: { brandId: brand._id }, // Store as ObjectId, not string
            // Optionally unset userId after migration is verified
            // $unset: { userId: '' }
          }
        )
        console.log(`  ✅ Updated ${updateResult.modifiedCount} places`)
        result.placesUpdated += updateResult.modifiedCount

        result.usersProcessed++
        console.log(`  ✨ Completed for user ${userId}\n`)
      } catch (error) {
        const errorMsg = `Error processing user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`  ❌ ${errorMsg}`)
        result.errors.push(errorMsg)
      }
    }

    console.log('\n✅ Migration completed!')
    console.log(`\n📊 Summary:`)
    console.log(`   Users processed: ${result.usersProcessed}`)
    console.log(`   Brands created: ${result.brandsCreated}`)
    console.log(`   Places updated: ${result.placesUpdated}`)

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`)
      result.errors.forEach(error => console.log(`   - ${error}`))
    }

    return result
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateToBrands()
    .then(() => {
      console.log('\n🎉 Migration script finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateToBrands }
