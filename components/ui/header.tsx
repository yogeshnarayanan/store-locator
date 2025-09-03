'use client'

import { useState } from 'react'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from './button'
import { ApiKeyModal } from './api-key-modal'

export function Header() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

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
    </>
  )
}