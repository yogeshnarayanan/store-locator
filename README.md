# Store Locator (Next.js + TypeScript + MongoDB + Google Maps)

A minimal scaffold with:
- Next.js App Router
- MongoDB via Mongoose (with 2dsphere index)
- Google Maps + Places Autocomplete
- Simple shadcn-like UI components (button, input, card, toast) styled with Tailwind

## Quick Start
1. **Install**
```bash
pnpm i
# or npm i / yarn
```
2. **Env**
Create `.env.local`:
```bash
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<browser_key_restricted>"
```
3. **Dev**
```bash
pnpm dev
```
Open http://localhost:3000

## API
- POST `/api/places` — add a place
- GET `/api/places/near?lat=..&lng=..&radiusKm=5&limit=20` — nearest places

## Notes
- UI components here mimic shadcn/ui styles; you can replace with official shadcn components if you run the CLI later.
- Ensure your MongoDB user has permissions to create indexes.
# store-locator
