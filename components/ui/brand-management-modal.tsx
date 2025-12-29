'use client'

import React, { useState } from 'react'
import { X, Plus, Building2, Users } from 'lucide-react'
import { useBrand, BrandWithRole } from '@/components/providers/brand-provider'
import { useToast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import clsx from 'clsx'

type BrandManagementModalProps = {
  isOpen: boolean
  onClose: () => void
  onManageMembers?: (brand: BrandWithRole) => void
}

export function BrandManagementModal({
  isOpen,
  onClose,
  onManageMembers,
}: BrandManagementModalProps) {
  const { brands, selectedBrand, selectBrand, createBrand, refreshBrands } =
    useBrand()
  const { push: pushToast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandDesc, setNewBrandDesc] = useState('')
  const [editingBrand, setEditingBrand] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  if (!isOpen) return null

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBrandName.trim()) return

    try {
      await createBrand({
        name: newBrandName.trim(),
        description: newBrandDesc.trim() || undefined,
      })
      setNewBrandName('')
      setNewBrandDesc('')
      setIsCreating(false)
      pushToast({ message: 'Brand created successfully', type: 'success' })
    } catch (error) {
      pushToast({ message: 'Failed to create brand', type: 'error' })
    }
  }

  const handleUpdateBrand = async (brandId: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          description: editDesc.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to update brand')

      await refreshBrands()
      setEditingBrand(null)
      pushToast({ message: 'Brand updated successfully', type: 'success' })
    } catch (error) {
      pushToast({ message: 'Failed to update brand', type: 'error' })
    }
  }

  const handleDeleteBrand = async (brandId: string, brandName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${brandName}"? This will delete all places in this brand.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' })

      if (!res.ok) throw new Error('Failed to delete brand')

      await refreshBrands()
      pushToast({ message: 'Brand deleted successfully', type: 'success' })
    } catch (error) {
      pushToast({ message: 'Failed to delete brand', type: 'error' })
    }
  }

  const startEdit = (brand: BrandWithRole) => {
    setEditingBrand(brand._id)
    setEditName(brand.name)
    setEditDesc(brand.description || '')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Brands</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <CardContent className="space-y-4">
            {/* Create new brand section */}
            {!isCreating ? (
              <Button
                onClick={() => setIsCreating(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Brand
              </Button>
            ) : (
              <form onSubmit={handleCreateBrand} className="space-y-3">
                <Input
                  placeholder="Brand name"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Description (optional)"
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false)
                      setNewBrandName('')
                      setNewBrandDesc('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* List of brands */}
            <div className="space-y-3">
              {brands.map((brand) => (
                <Card
                  key={brand._id}
                  className={clsx(
                    'p-4',
                    selectedBrand?._id === brand._id && 'ring-2 ring-black/10'
                  )}
                >
                  {editingBrand === brand._id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateBrand(brand._id)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingBrand(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Building2 className="w-5 h-5 text-gray-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-medium">{brand.name}</h3>
                            {brand.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {brand.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="capitalize">{brand.role}</span>
                              <span>•</span>
                              <span>
                                {new Date(brand.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            selectBrand(brand)
                            onClose()
                          }}
                        >
                          Select
                        </Button>
                        {(brand.role === 'owner' || brand.role === 'admin') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(brand)}
                          >
                            Edit
                          </Button>
                        )}
                        {onManageMembers && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onManageMembers(brand)}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Members
                          </Button>
                        )}
                        {brand.role === 'owner' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDeleteBrand(brand._id, brand.name)
                            }
                            className="text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {brands.length === 0 && !isCreating && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No brands yet. Create one to get started!</p>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
