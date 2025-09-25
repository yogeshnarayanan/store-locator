'use client'

import { useState, useEffect } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Input } from './input'
import { useToast } from './toaster'
import { Copy, Eye, EyeOff, RefreshCw, Trash2 } from 'lucide-react'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ApiKeyInfo {
  hasKey: boolean
  name?: string
  isActive?: boolean
  lastUsed?: string
  createdAt?: string
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo>({ hasKey: false })
  const [newApiKey, setNewApiKey] = useState<string>('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      const fetchKeyInfo = async () => {
        try {
          const response = await fetch('/api/api-keys')
          const data = await response.json()
          setKeyInfo(data)
        } catch (error) {
          toast.toast({ title: 'Failed to load API key info' })
        }
      }
      fetchKeyInfo()
    }
  }, [isOpen, toast])


  const generateKey = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/api-keys', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        setNewApiKey(data.apiKey)
        setShowKey(true)
        toast.toast({ title: 'API key generated successfully' })
        setKeyInfo({ hasKey: true, name: 'Default API Key', isActive: true, createdAt: new Date().toISOString() })
      } else {
        toast.toast({ title: data.error || 'Failed to generate API key' })
      }
    } catch (error) {
      toast.toast({ title: 'Failed to generate API key' })
    }
    setLoading(false)
  }

  const deleteKey = async () => {
    if (!confirm('Are you sure you want to delete your API key? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/api-keys', { method: 'DELETE' })
      
      if (response.ok) {
        toast.toast({ title: 'API key deleted successfully' })
        setKeyInfo({ hasKey: false })
        setNewApiKey('')
        setShowKey(false)
      } else {
        const data = await response.json()
        toast.toast({ title: data.error || 'Failed to delete API key' })
      }
    } catch (error) {
      toast.toast({ title: 'Failed to delete API key' })
    }
    setLoading(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.toast({ title: 'Copied to clipboard' })
    } catch (error) {
      toast.toast({ title: 'Failed to copy to clipboard' })
    }
  }

  const handleClose = () => {
    setNewApiKey('')
    setShowKey(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="API Key Management">
      <div className="space-y-6">
        {keyInfo.hasKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="text-sm text-gray-500">Current API Key</div>
              <div className="font-semibold text-gray-800">{keyInfo.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                Created: {keyInfo.createdAt ? new Date(keyInfo.createdAt).toLocaleDateString() : 'Unknown'}
                {keyInfo.lastUsed && (
                  <span className="ml-4">
                    Last used: {new Date(keyInfo.lastUsed).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={generateKey}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Key
              </Button>
              <Button
                variant="outline"
                onClick={deleteKey}
                disabled={loading}
                className="border-red-400 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-gray-600">You don&apos;t have an API key yet.</p>
            <Button
              onClick={generateKey}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Generate API Key
            </Button>
          </div>
        )}

        {newApiKey && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 mb-2">
              Your new API key (save this now - it won&apos;t be shown again):
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={newApiKey}
                readOnly
                type={showKey ? 'text' : 'password'}
                className="font-mono text-sm bg-yellow-100 border-yellow-300"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="hover:bg-yellow-200"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newApiKey)}
                className="hover:bg-yellow-200"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {keyInfo.hasKey && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800 font-medium">
              Usage:
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Include this header in your API requests:
            </div>
            <code className="block mt-2 text-xs bg-blue-100 p-2 rounded font-mono">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>
        )}
      </div>
    </Modal>
  )
}
