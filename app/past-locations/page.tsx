'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrashIcon, MapPinIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import { useRouter, usePathname } from 'next/navigation'

type PlaceItem = {
  _id: string
  name: string
  address?: string
  lat: number
  lng: number
}

// Re-usable modal
function CenterModal({
  message,
  onClose,
  onConfirm,
  isSuccess = false,
  isConfirm = false,
}: {
  message: string
  onClose: () => void
  onConfirm?: () => void
  isSuccess?: boolean
  isConfirm?: boolean
}) {
  // Auto-close success modal
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => onClose(), 750)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, onClose])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`${
          isSuccess
            ? 'bg-white border-green-500'
            : isConfirm
            ? 'bg-white border-blue-400'
            : 'bg-white border-red-400'
        } rounded-xl shadow-2xl p-6 max-w-sm w-full text-center border`}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          {!isConfirm && (
            <div
              className={`p-4 rounded-full text-2xl ${
                isSuccess
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {isSuccess ? '✅' : '⚠️'}
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-800">
            {isSuccess ? 'Success' : isConfirm ? 'Confirm Action' : 'Warning'}
          </h2>
          <p className="text-gray-600 text-sm">{message}</p>

          {isConfirm && (
            <div className="flex gap-4 mt-5 w-full">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}


export default function MyPlacesPage() {
  const { user } = useUser()
  const userId = user?.id
  const router = useRouter()
  const pathname = usePathname()

  const [places, setPlaces] = useState<PlaceItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // modal state
  const [modalMessage, setModalMessage] = useState('')
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalConfirm, setModalConfirm] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setPlaces([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(`/api/places/user?userId=${userId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
        return res.json()
      })
      .then((data) => setPlaces(data || []))
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error(err)
        setError('Failed to load places')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [userId])

  // step 1: show confirm modal
  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id)
    setModalMessage('Are you sure you want to delete this place?')
    setModalConfirm(true)
    setModalSuccess(false)
  }

  // step 2: confirm deletion
  const handleConfirmDelete = async () => {
    if (!userId || !pendingDeleteId) {
      setModalMessage('You must be signed in to delete places.')
      setModalConfirm(false)
      setModalSuccess(false)
      return
    }

    try {
      setDeletingId(pendingDeleteId)
      const res = await fetch(
        `/api/places/delete?userId=${userId}&ObjectId=${pendingDeleteId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
      setPlaces((prev) => prev.filter((p) => p._id !== pendingDeleteId))

      // success modal
      setModalMessage('Place deleted successfully')
      setModalConfirm(false)
      setModalSuccess(true)
      setTimeout(() => {
        setModalSuccess(false)
        setModalMessage('')
      }, 1500)
    } catch (err: any) {
      console.error(err)
      setModalMessage(err.message || 'Failed to delete place')
      setModalConfirm(false)
      setModalSuccess(false)
    } finally {
      setDeletingId(null)
      setPendingDeleteId(null)
    }
  }

  const handleModalClose = () => {
    setModalMessage('')
    setModalConfirm(false)
    setModalSuccess(false)
    setPendingDeleteId(null)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* modal */}
      {modalMessage && (
        <CenterModal
          message={modalMessage}
          onClose={handleModalClose}
          onConfirm={handleConfirmDelete}
          isSuccess={modalSuccess}
          isConfirm={modalConfirm}
        />
      )}

      {/* Back Arrow only on past-locations page */}
      {pathname === '/past-locations' && (
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        🌍 Saved Places
      </h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-pulse rounded-full bg-gray-200 h-10 w-10 mb-4" />
          <div className="text-gray-500">Loading your places...</div>
        </div>
      ) : error ? (
        <div className="text-center p-6 rounded-lg bg-red-50 border border-red-100 text-red-700">
          {error}
        </div>
      ) : places.length === 0 ? (
        <div className="text-center p-10 border-2 border-dashed rounded-2xl text-gray-500 bg-gray-50 shadow-inner">
          <MapPinIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-lg font-medium">No places saved yet.</p>
          <p className="text-sm">
            Start adding your favorite locations to see them here.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {places.map((place) => (
              <motion.div
                key={place._id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 p-5 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-blue-600" />
                    {place.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {place.address || 'No address available'}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleDeleteClick(place._id)}
                    disabled={deletingId === place._id}
                    className={
                      'flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg shadow transition duration-200 ' +
                      (deletingId === place._id ? 'opacity-60 cursor-not-allowed' : '')
                    }
                  >
                    <TrashIcon className="h-5 w-5" />
                    {deletingId === place._id ? 'Deleting...' : 'Delete'}
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-sm text-blue-600 hover:underline"
                  >
                    Open in Maps
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
