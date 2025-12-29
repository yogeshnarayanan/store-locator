'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, UserPlus, Shield, User, Crown } from 'lucide-react'
import { BrandWithRole } from '@/components/providers/brand-provider'
import { useToast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

type Member = {
  _id: string
  brandId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  invitedBy?: string
  acceptedAt?: string
  createdAt: string
  updatedAt: string
}

type MemberManagementProps = {
  brand: BrandWithRole | null
  isOpen: boolean
  onClose: () => void
}

export function MemberManagement({
  brand,
  isOpen,
  onClose,
}: MemberManagementProps) {
  const { push: pushToast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newUserId, setNewUserId] = useState('')
  const [newUserRole, setNewUserRole] = useState<'member' | 'admin' | 'owner'>(
    'member'
  )

  useEffect(() => {
    if (isOpen && brand) {
      fetchMembers()
    }
  }, [isOpen, brand])

  const fetchMembers = async () => {
    if (!brand) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/brands/${brand._id}/members`)
      if (!res.ok) throw new Error('Failed to fetch members')
      const data = await res.json()
      setMembers(data)
    } catch (error) {
      pushToast({ message: 'Failed to fetch members', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brand || !newUserId.trim()) return

    try {
      const res = await fetch(`/api/brands/${brand._id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId.trim(), role: newUserRole }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add member')
      }

      await fetchMembers()
      setNewUserId('')
      setNewUserRole('member')
      setIsAdding(false)
      pushToast({ message: 'Member added successfully', type: 'success' })
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : 'Failed to add member',
        type: 'error',
      })
    }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!brand) return

    try {
      const res = await fetch(`/api/brands/${brand._id}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update role')
      }

      await fetchMembers()
      pushToast({ message: 'Role updated successfully', type: 'success' })
    } catch (error) {
      pushToast({
        message:
          error instanceof Error ? error.message : 'Failed to update role',
        type: 'error',
      })
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!brand || !confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      const res = await fetch(`/api/brands/${brand._id}/members/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      await fetchMembers()
      pushToast({ message: 'Member removed successfully', type: 'success' })
    } catch (error) {
      pushToast({
        message:
          error instanceof Error ? error.message : 'Failed to remove member',
        type: 'error',
      })
    }
  }

  if (!isOpen || !brand) return null

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Manage Members</h2>
            <p className="text-sm text-gray-600">{brand.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <CardContent className="space-y-4">
            {/* Add member section */}
            {(brand.role === 'owner' || brand.role === 'admin') && (
              <>
                {!isAdding ? (
                  <Button
                    onClick={() => setIsAdding(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                ) : (
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <Input
                      placeholder="User ID (Clerk user ID)"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      autoFocus
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) =>
                        setNewUserRole(
                          e.target.value as 'member' | 'admin' | 'owner'
                        )
                      }
                      className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAdding(false)
                          setNewUserId('')
                          setNewUserRole('member')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Members list */}
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <Card key={member._id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <div className="font-medium text-sm">
                            {member.userId}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {member.role}
                          </div>
                        </div>
                      </div>

                      {(brand.role === 'owner' || brand.role === 'admin') && (
                        <div className="flex gap-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(member.userId, e.target.value)
                            }
                            className="text-sm rounded-lg border border-gray-300 px-2 py-1"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {members.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No members yet
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
