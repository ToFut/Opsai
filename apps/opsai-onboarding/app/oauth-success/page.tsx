'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function OAuthSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing authentication...')
  const [provider, setProvider] = useState('')
  const [accountName, setAccountName] = useState('')

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`Authentication failed: ${error}`)
          return
        }

        if (!code || !state) {
          setStatus('error')
          setMessage('Missing authentication parameters')
          return
        }

        // Decode state to get tenant and provider info
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        setProvider(stateData.provider)

        // Exchange code for access token
        // Use the new Airbyte OAuth complete endpoint
        const exchangeUrl = '/api/airbyte/oauth-complete'
          
        const response = await fetch(exchangeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            state,
            provider: stateData.provider,
            tenantId: stateData.tenantId,
            redirectUri: `${window.location.origin}/oauth-success`
          })
        })

        const result = await response.json()

        if (response.ok && result.success) {
          setStatus('success')
          setProvider(result.provider)
          
          // Handle GitHub special case with user info
          if (result.provider === 'github' && result.user) {
            setAccountName(result.user.name || result.user.login || 'GitHub Account')
          } else {
            setAccountName(result.accountName || `${result.provider} Account`)
          }
          
          setMessage(`Successfully connected to ${result.provider}!`)

          // Store connection info for the integration page
          localStorage.setItem('oauth_success', JSON.stringify({
            provider: result.provider,
            tenantId: stateData.tenantId,
            accountName: result.accountName || (result.user?.name || result.user?.login),
            connection: result.connection || {
              accessToken: result.accessToken,
              tokenType: result.tokenType,
              user: result.user
            },
            timestamp: Date.now()
          }))

          // Determine where to redirect based on context
          const returnTo = localStorage.getItem('oauth_return_to') || '/onboarding'
          localStorage.removeItem('oauth_return_to') // Clean up
          
          console.log(`✅ OAuth success for ${result.provider}, redirecting to: ${returnTo}`)

          // Redirect back to the appropriate page after delay
          setTimeout(() => {
            if (returnTo.includes('test-integrations')) {
              router.push('/test-integrations')
            } else if (returnTo.includes('debug-cards')) {
              router.push('/debug-cards')
            } else {
              // Default to onboarding, but try to go to integrations step
              router.push('/onboarding?step=connect-data')
            }
          }, 2500)

        } else {
          setStatus('error')
          setMessage(result.error || 'Authentication failed')
        }

      } catch (error) {
        console.error('OAuth processing error:', error)
        setStatus('error')
        setMessage('Failed to process authentication')
      }
    }

    processOAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">
          {status === 'processing' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {status === 'processing' && 'Processing...'}
          {status === 'success' && 'Connection Successful!'}
          {status === 'error' && 'Connection Failed'}
        </h1>
        <p className="text-gray-600 mb-4">
          {message}
        </p>
        {accountName && status === 'success' && (
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-green-600">Connected as:</div>
            <div className="font-medium text-green-800">{accountName}</div>
          </div>
        )}
        <div className="text-sm text-gray-500">
          {status === 'processing' && 'Please wait while we process your authentication...'}
          {status === 'success' && 'Redirecting back to setup...'}
          {status === 'error' && (
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Return to Setup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center"><div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"><div className="text-6xl mb-4">⏳</div><h1 className="text-2xl font-bold mb-2">Loading...</h1></div></div>}>
      <OAuthSuccessContent />
    </Suspense>
  )
}
