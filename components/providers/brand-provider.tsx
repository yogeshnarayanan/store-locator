'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export type BrandWithRole = {
  _id: string
  name: string
  description?: string
  ownerId: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
  updatedAt: string
}

type BrandContextType = {
  brands: BrandWithRole[]
  selectedBrand: BrandWithRole | null
  isLoading: boolean
  error: string | null
  selectBrand: (brand: BrandWithRole) => void
  refreshBrands: () => Promise<void>
  createBrand: (data: { name: string; description?: string }) => Promise<void>
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

const STORAGE_KEY = 'selected_brand_id'

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isUserLoaded, isSignedIn } = useUser()
  const [brands, setBrands] = useState<BrandWithRole[]>([])
  const [selectedBrand, setSelectedBrand] = useState<BrandWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBrands = async () => {
    if (!isSignedIn) {
      setBrands([])
      setSelectedBrand(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/brands')

      if (!res.ok) {
        throw new Error('Failed to fetch brands')
      }

      const data = await res.json()
      setBrands(data)

      // Try to restore previously selected brand from localStorage
      const savedBrandId =
        typeof window !== 'undefined'
          ? localStorage.getItem(STORAGE_KEY)
          : null
      const savedBrand = data.find((b: BrandWithRole) => b._id === savedBrandId)

      // Select saved brand, or first available brand
      setSelectedBrand(savedBrand || data[0] || null)
    } catch (err) {
      console.error('Error fetching brands:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const selectBrand = (brand: BrandWithRole) => {
    setSelectedBrand(brand)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, brand._id)
    }
  }

  const createBrand = async (data: {
    name: string
    description?: string
  }) => {
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Failed to create brand')
      }

      const newBrand = await res.json()

      // Add to brands list and select it
      setBrands((prev) => [newBrand, ...prev])
      selectBrand(newBrand)
    } catch (err) {
      console.error('Error creating brand:', err)
      throw err
    }
  }

  // Fetch brands when user loads
  useEffect(() => {
    if (isUserLoaded) {
      fetchBrands()
    }
  }, [isUserLoaded, isSignedIn])

  return (
    <BrandContext.Provider
      value={{
        brands,
        selectedBrand,
        isLoading,
        error,
        selectBrand,
        refreshBrands: fetchBrands,
        createBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const context = useContext(BrandContext)
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider')
  }
  return context
}
