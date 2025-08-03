'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Loader2, Check, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing OAuth callback...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get query parameters from Airbyte OAuth callback
        const secretId = searchParams.get('secretId')
        const error = searchParams.get('error')
        
        if (error) {
          setStatus('error')
          setMessage(`OAuth failed: ${error}`)
          return
        }

        if (!secretId) {
          setStatus('error')
          setMessage('No secretId received from OAuth provider')
          return
        }

        // Get stored OAuth context
        const oauthContext = localStorage.getItem('oauth_context')
        if (!oauthContext) {
          setStatus('error')
          setMessage('OAuth context not found. Please start the process again.')
          return
        }

        const { sourceType, sourceName } = JSON.parse(oauthContext)

        // Create the source with the secretId
        const response = await fetch('/api/airbyte-v2/create-source', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType,
            name: sourceName,
            secretId
          })
        })

        const result = await response.json()

        if (response.ok && result.success) {
          setStatus('success')
          setMessage(`Successfully created ${sourceType} source!`)
          
          // Store success info
          localStorage.setItem('oauth_success', JSON.stringify({
            sourceId: result.sourceId,
            sourceType,
            sourceName
          }))
          
          // Clean up
          localStorage.removeItem('oauth_context')
          
          // Redirect back after delay
          setTimeout(() => {
            router.push('/airbyte-setup')
          }, 2000)
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to create source')
        }

      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage('Failed to process OAuth callback')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          {status === 'processing' && (
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          )}
          {status === 'success' && (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <X className="w-6 h-6 text-red-600" />
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          {status === 'processing' && 'Processing OAuth...'}
          {status === 'success' && 'OAuth Successful!'}
          {status === 'error' && 'OAuth Failed'}
        </h1>
        
        <p className="text-gray-600 mb-4">{message}</p>
        
        {status === 'processing' && (
          <p className="text-sm text-gray-500">
            Please wait while we complete the OAuth process...
          </p>
        )}
        
        {status === 'success' && (
          <p className="text-sm text-gray-500">
            Redirecting back to setup...
          </p>
        )}
        
        {status === 'error' && (
          <button
            onClick={() => router.push('/airbyte-setup')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Setup
          </button>
        )}
      </Card>
    </div>
  )
}