'use client'

import { useState } from 'react'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Settings } from 'lucide-react'
import { Button } from './button'
import { ApiKeyModal } from './api-key-modal'
import { BrandSelector } from './brand-selector'
import { BrandManagementModal } from './brand-management-modal'
import { MemberManagement } from './member-management'
import { BrandWithRole } from '@/components/providers/brand-provider'

export function Header() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showBrandManagement, setShowBrandManagement] = useState(false)
  const [memberManagementBrand, setMemberManagementBrand] =
    useState<BrandWithRole | null>(null)

  return (
    <>
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Store Locator</h1>
          <div>
            <SignedOut>
              <SignInButton>
                <Button variant="outline">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-3">
                <BrandSelector />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBrandManagement(true)}
                  title="Manage Brands"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyModal(true)}
                >
                  API Keys
                </Button>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      <BrandManagementModal
        isOpen={showBrandManagement}
        onClose={() => setShowBrandManagement(false)}
        onManageMembers={(brand) => {
          setMemberManagementBrand(brand)
          setShowBrandManagement(false)
        }}
      />

      <MemberManagement
        brand={memberManagementBrand}
        isOpen={!!memberManagementBrand}
        onClose={() => setMemberManagementBrand(null)}
      />
    </>
  )
}