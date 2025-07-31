'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function OAuthSuccessPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success')
    const provider = searchParams.get('provider')
    const account = searchParams.get('account')
    
    if (success === 'true' && provider) {
      // Send success message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_SUCCESS',
          provider,
          account,
          success: true
        }, window.location.origin)
        
        // Close the popup
        window.close()
      } else {
        // Fallback: redirect to main page if not in popup
        window.location.href = `/?success=true&provider=${provider}&account=${account}`
      }
    } else {
      // Handle error case
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_ERROR',
          provider,
          success: false
        }, window.location.origin)
        window.close()
      } else {
        window.location.href = '/?error=oauth_failed'
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Completing connection...</p>
      </div>
    </div>
  )
}