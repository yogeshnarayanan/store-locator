# Store Locator Architecture Documentation

## Overview
A multi-tenant Next.js application for store location management with interactive maps, built with TypeScript, MongoDB for geospatial data storage, Google Maps integration, and Clerk authentication with Google OAuth. The application uses a Brand-based architecture where users can create and collaborate on multiple brands, with each brand managing its own set of places. Supports multi-user collaboration with role-based access control (owner/admin/member).

## Development Commands

### Primary Commands
```bash
# Development server
npm run dev          # Start development server on http://localhost:3000

# Build & Deploy
npm run build        # Create production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Dependencies Overview
- **Framework**: Next.js 15+ (App Router)
- **Authentication**: Clerk (@clerk/nextjs)
- **Database**: MongoDB via Mongoose 8.6.3
- **Maps**: @react-google-maps/api 2.19.3
- **Validation**: Zod 3.23.8
- **Styling**: Tailwind CSS 3.4.10
- **UI Utilities**: Lucide React icons, clsx for conditional classes

## High-Level Architecture

### 1. Next.js App Router Structure
```
app/
├── layout.tsx              # Root layout with ClerkProvider, BrandProvider, and Header
├── (map)/                  # Route group for main functionality
│   └── page.tsx           # Main map interface page (auth-gated, brand-scoped)
├── sign-in/[[...sign-in]]/ # Clerk sign-in pages
├── sign-up/[[...sign-up]]/ # Clerk sign-up pages
└── api/                   # API routes (all protected)
    ├── brands/
    │   ├── route.ts           # GET (list brands), POST (create brand)
    │   └── [id]/
    │       ├── route.ts       # GET, PUT, DELETE brand
    │       ├── members/
    │       │   ├── route.ts   # GET, POST members
    │       │   └── [userId]/
    │       │       └── route.ts # PUT, DELETE member
    │       └── places/
    │           ├── route.ts   # POST (create place in brand)
    │           └── near/
    │               └── route.ts # GET (nearby places in brand)
    └── api-keys/
        └── route.ts       # GET, POST, DELETE user API keys
```

**Key Patterns:**
- Uses App Router with route groups `(map)` for organization
- Clerk authentication middleware protects all routes except home page
- Server-side API routes handle database operations with brand-level isolation
- Client components handle interactive map functionality with brand context
- TypeScript strict mode enabled throughout
- RESTful API design with brand-scoped resources

### 2. MongoDB Integration with Geospatial Features

#### Database Connection (`/lib/db/connect.ts`)
```typescript
// Global connection caching pattern for serverless environments
globalWithMongoose.mongooseConn = { conn: null, promise: null }
```

**Features:**
- Connection reuse for serverless optimization
- Environment variable validation (`MONGODB_URI`)
- Mongoose connection pooling

#### Brand Model (`/lib/db/models/brand.ts`)
```typescript
const BrandSchema = new Schema<BrandDoc>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ownerId: { type: String, required: true, index: true }, // Clerk user ID of owner
}, { timestamps: true })
```

**Features:**
- Brand is the top-level organizational unit
- Each brand has an owner (ownerId) but can have multiple collaborators
- Indexed on ownerId for fast lookups

#### BrandMember Model (`/lib/db/models/brand-member.ts`)
```typescript
const BrandMemberSchema = new Schema<BrandMemberDoc>({
  brandId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], required: true },
  invitedBy: { type: String },
  acceptedAt: { type: Date },
}, { timestamps: true })

// Compound unique index: user can only be member once per brand
BrandMemberSchema.index({ brandId: 1, userId: 1 }, { unique: true })
```

**Features:**
- Many-to-many relationship between users and brands
- Role-based access control (owner > admin > member)
- Supports invitation tracking (invitedBy, acceptedAt)
- Prevents duplicate memberships with compound unique index

#### Place Model (`/lib/db/models/place.ts`)
```typescript
const PlaceSchema = new Schema<PlaceDoc>({
  name: { type: String, required: true, trim: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  brandId: { type: String, required: true, index: true }, // Brand-level isolation
}, { timestamps: true })

// Critical indexes for performance
PlaceSchema.index({ location: '2dsphere' })  // Geospatial queries
// brandId index for filtering places by brand
```

**Schema Design:**
- **Brand-level isolation**: `brandId` field links places to brands (not users directly)
- **Dual coordinate storage**: `lat/lng` fields for easy access + GeoJSON `location` field
- **GeoJSON Point format**: `coordinates: [longitude, latitude]` (note order!)
- **2dsphere index**: Enables efficient proximity queries on spherical geometry
- **Brand index**: Ensures fast filtering by brand for multi-brand management
- **Automatic timestamps**: `createdAt` and `updatedAt` fields

### 3. Google Maps API Integration Patterns

#### Map Component Structure (`/app/(map)/page.tsx`)
```typescript
const { isLoaded, loadError } = useLoadScript({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  libraries: ['places'], // Load Places API for autocomplete
})
```

**Integration Features:**
- **Places Autocomplete**: Search and select locations
- **Interactive map**: Drag to update center and fetch nearby places
- **Marker visualization**: Shows center point and all nearby places
- **Real-time updates**: Map movements trigger new proximity searches

**State Management Pattern:**
```typescript
const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 }) // Default: Bangalore
const [places, setPlaces] = useState<PlaceItem[]>([])
const [selected, setSelected] = useState<SelectedPlace | null>(null)
```

### 4. API Endpoint Structure and Validation

#### Brand Management Endpoints

**List/Create Brands** (`/api/brands/route.ts`)
- `GET /api/brands` - List all brands where user is a member (with role)
- `POST /api/brands` - Create new brand (user becomes owner)

**Brand Operations** (`/api/brands/[id]/route.ts`)
- `GET /api/brands/[id]` - Get brand details (member access)
- `PUT /api/brands/[id]` - Update brand (admin/owner only)
- `DELETE /api/brands/[id]` - Delete brand and all places (owner only)

**Member Management** (`/api/brands/[id]/members/`)
- `GET /api/brands/[id]/members` - List brand members (member access)
- `POST /api/brands/[id]/members` - Add member (admin/owner only)
- `PUT /api/brands/[id]/members/[userId]` - Update role (admin/owner only)
- `DELETE /api/brands/[id]/members/[userId]` - Remove member (admin/owner or self)

#### Create Place Endpoint (`/api/brands/[id]/places/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  // Validate user is member of brand
  const membership = await validateBrandAccess(userId, brandId)
  if (!membership) return 403

  const parsed = upsertPlaceSchema.safeParse(json)
  const doc = await Place.create({
    name, address, city, state, lat, lng,
    location: { type: 'Point', coordinates: [lng, lat] },
    brandId, // Brand-scoped
  })
}
```

#### Proximity Search Endpoint (`/api/brands/[id]/places/near/route.ts`)
```typescript
// Validate brand access first
const membership = await validateBrandAccess(userId, brandId)
if (!membership) return 403

const results = await Place.aggregate([
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'distanceMeters',
      spherical: true,
      maxDistance: radiusKm * 1000,
      query: { brandId }, // Filter by brand
    },
  },
  { $limit: limit },
])
```

**Query Parameters:**
- `lat`, `lng`: Required coordinates
- `radiusKm`: Search radius (default: 5km)
- `limit`: Max results (default: 20, max: 100)

#### Validation Schemas

**Place Schema** (`/lib/validation/place.ts`)
```typescript
export const upsertPlaceSchema = z.object({
  name: z.string().min(1),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
})
```

**Brand Schema** (`/lib/validation/brand.ts`)
```typescript
export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['owner', 'admin', 'member']),
})
```

### 5. UI Component Organization

#### Component Structure
```
components/
├── ui/
│   ├── button.tsx                     # Styled button with variants
│   ├── card.tsx                       # Container with shadow
│   ├── input.tsx                      # Form input with focus states
│   ├── toaster.tsx                    # Toast notification system
│   ├── header.tsx                     # App header with brand selector
│   ├── brand-selector.tsx             # Dropdown to switch brands
│   ├── brand-management-modal.tsx     # Create/edit/delete brands
│   ├── member-management.tsx          # Manage brand collaborators
│   └── api-key-modal.tsx              # API key management
└── providers/
    └── brand-provider.tsx             # Global brand context & state
```

**Design Patterns:**
- **Compound components**: Card + CardContent pattern
- **Variant-based styling**: Using clsx for conditional classes
- **Context-based state**: BrandProvider for global brand selection
- **Modal patterns**: Overlay modals for brand and member management
- **Forward refs**: Input component uses forwardRef for form libraries
- **Context-based notifications**: Toast system uses React Context

#### Custom Toast Implementation
```typescript
// Context-based toast system with auto-dismiss
const push = (t: Omit<Toast, 'id'>) => {
  const id = Date.now()
  setToasts(prev => [...prev, { id, ...t }])
  setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 2500)
}
```

## Key Patterns and Conventions

### 1. File Organization
- **Absolute imports**: Uses `@/*` path mapping
- **Type collocation**: Types defined near usage (e.g., `PlaceDoc` in model file)
- **Route groups**: `(map)` for URL structure without affecting routing

### 2. TypeScript Patterns
- **Strict configuration**: `strict: true`, no implicit any
- **Type inference**: Leverages Zod's `z.infer<>` for form validation
- **Global declarations**: Custom global types for MongoDB connection caching

### 3. Error Handling
- **API validation**: Zod schema validation with structured error responses
- **UI feedback**: Toast notifications for user actions
- **Loading states**: Proper loading/error states for async operations

### 4. Performance Optimizations
- **Connection pooling**: MongoDB connection reuse in serverless environment
- **Debounced updates**: Map drag events efficiently trigger new searches
- **Limited results**: API limits prevent excessive data transfer

## Environment Setup Requirements

### Required Environment Variables
```bash
# MongoDB connection string with appropriate permissions
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"

# Google Maps API key with Maps JavaScript API and Places API enabled
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<your_api_key>"
```

### MongoDB Requirements
- **User permissions**: Database user must have permissions to create indexes
- **Index creation**: The application automatically creates a 2dsphere index
- **Connection options**: Uses `retryWrites=true&w=majority` for reliability

### Google Maps API Setup
1. Enable **Maps JavaScript API**
2. Enable **Places API** (for autocomplete functionality)
3. Set appropriate restrictions (HTTP referrers for web usage)
4. API key should be browser-safe (restricted to your domain)

## Database Schema and Geospatial Indexing

### Place Document Structure
```typescript
type PlaceDoc = {
  _id: string
  name: string           // Required display name
  address?: string       // Optional street address
  city?: string         // Optional city
  state?: string        // Optional state/region
  lat: number           // Latitude (-90 to 90)
  lng: number           // Longitude (-180 to 180)
  location: {           // GeoJSON Point for spatial queries
    type: 'Point'
    coordinates: [number, number] // [lng, lat] - note order!
  }
  createdAt: Date       // Auto-generated
  updatedAt: Date       // Auto-generated
}
```

### Geospatial Indexing Strategy
```typescript
PlaceSchema.index({ location: '2dsphere' })
```

**Index Benefits:**
- **Efficient proximity queries**: O(log n) lookup time for nearby places
- **Spherical calculations**: Accounts for Earth's curvature
- **Distance calculations**: Returns actual distances in meters
- **Scalable**: Performs well with large datasets

### Query Performance
- **$geoNear aggregation**: Single-stage proximity search with distance calculation
- **Spherical geometry**: `spherical: true` for accurate Earth-surface distances
- **Distance field**: Automatically calculated `distanceMeters` in results
- **Limit enforcement**: Prevents excessive result sets

## Development Workflow

### 1. Local Development
```bash
npm install           # Install dependencies
npm run dev          # Start development server
```

### 2. Code Quality
```bash
npm run lint         # Check for linting issues
npm run format       # Auto-format code with Prettier
```

### 3. Production Deployment
```bash
npm run build        # Create optimized production build
npm run start        # Start production server
```

### 4. Environment Configuration
- Create `.env.local` with required environment variables
- Set up Clerk application with Google OAuth provider
- Ensure MongoDB cluster is accessible
- Verify Google Maps API keys and restrictions

## Authentication & Multi-Tenancy

### Clerk Setup
```bash
# Required environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<clerk_publishable_key>"
CLERK_SECRET_KEY="<clerk_secret_key>"
```

### Authentication Flow
1. **Middleware protection**: `middleware.ts` protects all routes except home page
2. **API route security**: All API endpoints require authentication via `dualAuth()`
3. **Dual authentication**: Supports both Clerk sessions and API key authentication
4. **UI conditional rendering**: Uses `<SignedIn>` and `<SignedOut>` components

### Brand-Based Multi-Tenancy

**Architecture**: User → Brand → Places

**Key Features:**
- Users can own and collaborate on multiple brands
- Each brand manages its own set of places
- Role-based access control (owner/admin/member)
- Brand-level data isolation

**Multi-Tenant Data Isolation:**
- **Database level**: Places filtered by `brandId`, brands filtered by membership
- **API level**: `validateBrandAccess()` ensures user is member before granting access
- **UI level**: BrandProvider manages selected brand, users see only authorized brands

**Authorization Hierarchy:**
```typescript
// Role hierarchy: owner > admin > member
owner:  Can delete brand, manage all members, edit brand, manage places
admin:  Can manage members, edit brand, manage places
member: Can manage places (read/write)
```

**Brand Access Validation:**
```typescript
// All brand-scoped endpoints validate access
const membership = await validateBrandAccess(userId, brandId, requiredRole?)
if (!membership) return 403 Forbidden
```

**API Key Authentication:**
- API keys remain user-scoped (not brand-scoped)
- When using API key, must specify brandId in URL path
- Access validated same as Clerk session auth

This architecture provides a secure, scalable foundation for collaborative location-based applications with efficient geospatial queries, modern authentication, role-based access control, and complete brand-level data isolation.

## Data Migration

### Migrating from User-Based to Brand-Based Architecture

The application includes a migration script to transition existing data from the old User → Places architecture to the new User → Brand → Places structure.

**Migration Script**: `/lib/db/migrate-to-brands.ts`

**What it does:**
1. Finds all unique users with existing places
2. For each user:
   - Creates a default "My Brand" brand
   - Creates a BrandMember with owner role
   - Updates all their places to reference the new brandId
3. Logs progress and handles errors gracefully

**Running the migration:**
```bash
npx tsx lib/db/migrate-to-brands.ts
```

**Migration is idempotent**: Running it multiple times is safe - it skips users who already have brands.

**After migration:**
- Each user will have one brand ("My Brand")
- All existing places will belong to that brand
- Users can create additional brands as needed
- The old `userId` field on places is no longer used (but preserved during migration for safety)

## Brand Management Features

### BrandProvider Context

**Location**: `/components/providers/brand-provider.tsx`

**Provides:**
- `brands`: Array of all brands user is a member of
- `selectedBrand`: Currently active brand
- `isLoading`: Loading state
- `selectBrand()`: Switch to a different brand
- `createBrand()`: Create new brand
- `refreshBrands()`: Reload brands list

**State Persistence**: Selected brand is stored in localStorage and restored on page load.

### Brand Selector Component

**Location**: `/components/ui/brand-selector.tsx`

**Features:**
- Dropdown to view and switch between brands
- Shows brand name and user's role
- Displays brand description (if available)
- Auto-selects first brand on initial load

### Brand Management Modal

**Location**: `/components/ui/brand-management-modal.tsx`

**Capabilities:**
- Create new brands
- Edit brand details (admin/owner only)
- Delete brands (owner only)
- View all brands with roles
- Navigate to member management

### Member Management

**Location**: `/components/ui/member-management.tsx`

**Capabilities:**
- View all members of a brand
- Add new members by Clerk user ID
- Assign roles (owner/admin/member)
- Update member roles (admin/owner only)
- Remove members (admin/owner or self-removal)
- Prevents removing last owner

**Access Control:**
- Only admins and owners can manage members
- Role hierarchy enforced (owner > admin > member)
- Cannot remove the last owner of a brand