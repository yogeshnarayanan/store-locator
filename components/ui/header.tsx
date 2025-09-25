'use client'

import { useState } from 'react'
import { MapPinIcon } from '@heroicons/react/24/solid'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from './button'
import { ApiKeyModal } from './api-key-modal'

export function Header() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  return (
    <>
      <header className="bg-white px-6 py-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between max-w-9.5xl mx-auto">
          
          {/* Left side: Logo and title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            <MapPinIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300">
              Store Locator
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-6">
            <button
              onClick={() => window.location.href = '/past-locations'}
              className="text-xl font-semibold mb-2 text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
            >
              Past Locations
            </button>
            <button
              onClick={() => window.location.href = '/Nearest-Location'}
              className="text-xl font-semibold mb-2 text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
            >
              Nearest Location
            </button>
          </div> 

          {/* Right side: API Key & User */}
          <div>
            <SignedOut>
              <SignInButton>
                <Button 
                  variant="outline" 
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300"
                >
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300"
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
