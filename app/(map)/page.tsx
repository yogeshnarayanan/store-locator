'use client'

import { useEffect, useState, useRef } from 'react'
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
  Autocomplete,
} from '@react-google-maps/api'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const libraries: 'places'[] = ['places']

type PlaceItem = {
  _id: string
  name: string
  address?: string
  lat: number
  lng: number
  distanceMeters?: number
}

/** --- Warning / Success Modal --- */
function WarningModal({
  message,
  onClose,
  autoClose = false,
  success = false,
}: {
  message: string
  onClose: () => void
  autoClose?: boolean
  success?: boolean
}) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => onClose(), 750)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div
        className={`rounded-lg shadow-lg p-6 max-w-sm w-full text-center border ${
          success ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${
            success ? 'text-green-700' : 'text-gray-800'
          }`}
        >
          {success ? '✅ Success' : '⚠️ Warning'}
        </h2>
        <p className={`${success ? 'text-green-800' : 'text-gray-700'} mb-6`}>
          {message}
        </p>
        {!autoClose && (
          <button
            className={`px-4 py-2 rounded transition ${
              success
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 })
  const [places, setPlaces] = useState<PlaceItem[]>([])
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null)
  const [selected, setSelected] = useState<{
    name: string
    address?: string
    lat: number
    lng: number
  } | null>(null)

  // modal state
  const [warningMessage, setWarningMessage] = useState('')
  const [autoClose, setAutoClose] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isLoaded) fetchNear(mapCenter.lat, mapCenter.lng)
  }, [isLoaded, mapCenter.lat, mapCenter.lng])

  async function fetchNear(lat: number, lng: number) {
    const res = await fetch(
      `/api/places/near?lat=${lat}&lng=${lng}&radiusKm=10&limit=50`
    )
    const data = await res.json()
    setPlaces(data)
  }

  const onPlaceChanged = () => {
    if (!autocomplete) return
    const place = autocomplete.getPlace()
    const geom = place.geometry?.location
    if (!geom) return
    const lat = geom.lat()
    const lng = geom.lng()
    setMapCenter({ lat, lng })
    setSelected({
      name: place.name || place.formatted_address || 'Unnamed',
      address: place.formatted_address || undefined,
      lat,
      lng,
    })
    fetchNear(lat, lng)
  }

  async function addSelected() {
    if (!selected) return
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selected),
    })

    if (!res.ok) {
      if (res.status === 409) {
        setWarningMessage(`${selected.name} is already added.`)
        setSuccess(false)
        setAutoClose(false)
      } else {
        setWarningMessage('Failed to add place. Please try again.')
        setSuccess(false)
        setAutoClose(false)
      }
      return
    }

    setWarningMessage(`${selected.name} added successfully!`)
    setSuccess(true)
    setAutoClose(true)

    fetchNear(selected.lat, selected.lng)
  }

  if (loadError)
    return <div className="p-4 text-red-500 text-center">Failed to load Google Maps</div>
  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    )

  return (
    <div className="p-4">
      {warningMessage && (
        <WarningModal
          message={warningMessage}
          onClose={() => setWarningMessage('')}
          autoClose={autoClose}
          success={success}
        />
      )}

      <SignedOut>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to Store Locator</h2>
              <p className="text-gray-600 mb-4">
                Sign in to start managing your store locations
              </p>
            </CardContent>
          </Card>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="grid md:grid-cols-[360px_1fr] gap-4">
      <Card className="h-[80vh]">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <span className="text-sm font-medium">🔍 Store Finder</span>
            <Autocomplete
              onLoad={setAutocomplete}
              onPlaceChanged={onPlaceChanged}
            >
              <Input placeholder="Search places" />
            </Autocomplete>
          </div>
          {selected && (
            <div className="space-y-2">
              <div className="text-sm">
                Selected: <span className="font-semibold">{selected.name}</span>
              </div>
              <Button onClick={addSelected}>Add Place</Button>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Showing {places.length} nearby places
          </div>
          <div className="space-y-2 max-h-[43vh] overflow-auto pr-2">
            {places.map(p => (
              <div key={p._id} className="border rounded-md p-2">
                <div className="font-medium">{p.name}</div>
                {p.address && (
                  <div className="text-xs text-gray-500">{p.address}</div>
                )}
                {typeof p.distanceMeters === 'number' && (
                  <div className="text-xs">
                    {(p.distanceMeters / 1000).toFixed(2)} km
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="h-[80vh] w-full">
        <GoogleMap
          zoom={13}
          center={mapCenter}
          mapContainerStyle={{ height: '100%', width: '100%' }}
          onLoad={map => { mapRef.current = map }}
          onDragEnd={() => {
            if (mapRef.current) {
              const center = mapRef.current.getCenter()
              if (center) {
                const lat = center.lat()
                const lng = center.lng()
                setMapCenter({ lat, lng })
                fetchNear(lat, lng)
              }
            }
          }}
        >
          <MarkerF position={mapCenter} />
          {places.map(p => (
            <MarkerF key={p._id} position={{ lat: p.lat, lng: p.lng }} />
          ))}
        </GoogleMap>
      </div>
        </div>
      </SignedIn>
    </div>
  )
}
