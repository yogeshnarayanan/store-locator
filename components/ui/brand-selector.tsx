'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Building2 } from 'lucide-react'
import { useBrand } from '@/components/providers/brand-provider'
import clsx from 'clsx'

export function BrandSelector() {
  const { brands, selectedBrand, isLoading, selectBrand } = useBrand()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading) {
    return (
      <div className="h-9 px-4 rounded-2xl bg-gray-100 animate-pulse w-32" />
    )
  }

  if (brands.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'inline-flex items-center justify-between gap-2 h-9 px-4 rounded-2xl',
          'border border-gray-300 hover:bg-gray-50 transition',
          'min-w-[160px] max-w-[200px]'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 className="w-4 h-4 flex-shrink-0 text-gray-600" />
          <span className="truncate text-sm">
            {selectedBrand?.name || 'Select Brand'}
          </span>
        </div>
        <ChevronDown
          className={clsx(
            'w-4 h-4 flex-shrink-0 text-gray-600 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {brands.map((brand) => (
              <button
                key={brand._id}
                onClick={() => {
                  selectBrand(brand)
                  setIsOpen(false)
                }}
                className={clsx(
                  'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition',
                  selectedBrand?._id === brand._id && 'bg-gray-100'
                )}
              >
                <div className="font-medium truncate">{brand.name}</div>
                {brand.description && (
                  <div className="text-xs text-gray-500 truncate">
                    {brand.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">
                  {brand.role === 'owner' && 'Owner'}
                  {brand.role === 'admin' && 'Admin'}
                  {brand.role === 'member' && 'Member'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
