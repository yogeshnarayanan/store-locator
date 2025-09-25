'use client'

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'

type PlaceItem = {
  _id: string
  name: string
  address?: string
  lat: number
  lng: number
  distanceMeters: number
}

export default function NearbyPlacesPage() {
  const { user } = useUser()
  const userId = user?.id

  const [places, setPlaces] = useState<PlaceItem[]>([])
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radiusKm, setRadiusKm] = useState(10)
  const [limit, setLimit] = useState(20)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchNearbyPlaces = async () => {
    if (!lat || !lng || !userId) {
      setError('Please enter latitude and longitude')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `/api/places/near?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&limit=${limit}`,
        // {
        //   method: 'GET',
        //   headers: {
        //     Authorization: `Bearer sk_9fee0ae9f8e5c4226589c71defb323a4fd6ea6b9fc725f1cecb11d5afbc267ba`, // Replace with actual token logic if needed
        //   },
        // }
      )

      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }

      const data = await res.json()
      setPlaces(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch places')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Find Nearby Locations</h1>

      <div className="space-y-2 mb-4">
        <input
          type="number"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="Longitude"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="Radius (km)"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="Limit"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={fetchNearbyPlaces}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {places.length > 0 && (
        <div className="space-y-2">
          {places.map((place) => (
            <div key={place._id} className="border p-2 rounded">
              <h3 className="font-medium">{place.name}</h3>
              <p>{place.address}</p>
              <p>
                Distance: {(place.distanceMeters / 1000).toFixed(2)} km
              </p>
            </div>
          ))}
        </div>
      )}

      {places.length === 0 && !loading && <p>No nearby locations found.</p>}
    </div>
  )
}








