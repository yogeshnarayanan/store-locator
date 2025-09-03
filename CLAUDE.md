# Store Locator Architecture Documentation

## Overview
A multi-tenant Next.js application for store location management with interactive maps, built with TypeScript, MongoDB for geospatial data storage, Google Maps integration, and Clerk authentication with Google OAuth. Each authenticated user manages their own set of places.

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
├── layout.tsx              # Root layout with ClerkProvider and Header
├── (map)/                  # Route group for main functionality
│   └── page.tsx           # Main map interface page (auth-gated)
├── sign-in/[[...sign-in]]/ # Clerk sign-in pages
├── sign-up/[[...sign-up]]/ # Clerk sign-up pages
└── api/                   # API routes (all protected)
    └── places/
        ├── route.ts       # POST endpoint for creating user places
        └── near/
            └── route.ts   # GET endpoint for user's nearby places
```

**Key Patterns:**
- Uses App Router with route groups `(map)` for organization  
- Clerk authentication middleware protects all routes except home page
- Server-side API routes handle database operations with user isolation
- Client components handle interactive map functionality
- TypeScript strict mode enabled throughout

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
  userId: { type: String, required: true, index: true }, // Multi-tenant isolation
}, { timestamps: true })

// Critical indexes for performance
PlaceSchema.index({ location: '2dsphere' })  // Geospatial queries
// userId index created automatically for multi-tenant filtering
```

**Schema Design:**
- **Multi-tenant isolation**: `userId` field links places to authenticated users
- **Dual coordinate storage**: `lat/lng` fields for easy access + GeoJSON `location` field
- **GeoJSON Point format**: `coordinates: [longitude, latitude]` (note order!)
- **2dsphere index**: Enables efficient proximity queries on spherical geometry
- **User index**: Ensures fast filtering by user for tenant isolation
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

#### Create Place Endpoint (`/api/places/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const parsed = upsertPlaceSchema.safeParse(json)
  // Creates both lat/lng fields AND GeoJSON location field
  const doc = await Place.create({
    name, address, city, state, lat, lng,
    location: { type: 'Point', coordinates: [lng, lat] },
  })
}
```

#### Proximity Search Endpoint (`/api/places/near/route.ts`)
```typescript
const results = await Place.aggregate([
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'distanceMeters',
      spherical: true,            // Use spherical geometry
      maxDistance: radiusKm * 1000, // Convert km to meters
    },
  },
  { $limit: limit },
])
```

**Query Parameters:**
- `lat`, `lng`: Required coordinates
- `radiusKm`: Search radius (default: 5km)
- `limit`: Max results (default: 20, max: 100)

#### Validation Schema (`/lib/validation/place.ts`)
```typescript
export const upsertPlaceSchema = z.object({
  name: z.string().min(1),
  lat: z.number().gte(-90).lte(90),    // Valid latitude range
  lng: z.number().gte(-180).lte(180),  // Valid longitude range
})
```

### 5. UI Component Organization

#### Component Structure
```
components/ui/
├── button.tsx      # Styled button with variants (default, outline)
├── card.tsx        # Container with shadow and rounded corners
├── input.tsx       # Form input with focus states
└── toaster.tsx     # Toast notification system
```

**Design Patterns:**
- **Compound components**: Card + CardContent pattern
- **Variant-based styling**: Using clsx for conditional classes
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
2. **API route security**: All `/api/places/*` endpoints require authentication via `auth()`
3. **User isolation**: Database queries automatically filter by authenticated user's `userId`
4. **UI conditional rendering**: Uses `<SignedIn>` and `<SignedOut>` components

### Multi-Tenant Data Isolation
- **Database level**: All place queries include `{ userId }` filter
- **API level**: User ID extracted from Clerk session and injected into operations
- **UI level**: Users only see and can manage their own places

This architecture provides a secure, scalable foundation for multi-tenant location-based applications with efficient geospatial queries, modern authentication, and complete user data isolation.