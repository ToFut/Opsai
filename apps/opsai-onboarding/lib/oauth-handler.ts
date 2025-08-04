// Simple OAuth handler that opens auth in a new window
export async function initiateOAuth(provider: string, tenantId: string) {
  // Create state for OAuth with popup flag
  const state = btoa(JSON.stringify({
    tenantId,
    provider,
    timestamp: Date.now(),
    popup: true
  }))

  // Build OAuth URL
  const response = await fetch('/api/oauth/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      tenantId,
      state  // Pass pre-created state with popup flag
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create OAuth URL')
  }

  const { authUrl } = await response.json()
  
  console.log(`🚀 Opening OAuth popup for ${provider}:`, authUrl)
  
  // Open OAuth in new window
  const width = 600
  const height = 700
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2
  
  const authWindow = window.open(
    authUrl,
    `${provider}_oauth`,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
  )
  
  if (!authWindow) {
    throw new Error('Failed to open OAuth popup. Please check your popup blocker settings.')
  }

  // Return a promise that resolves when OAuth completes
  return new Promise((resolve, reject) => {
    // Check if window closed
    const checkInterval = setInterval(() => {
      if (authWindow && authWindow.closed) {
        clearInterval(checkInterval)
        
        // Check if OAuth succeeded by looking for success marker
        const successMarker = localStorage.getItem(`oauth_success_${provider}`)
        if (successMarker) {
          localStorage.removeItem(`oauth_success_${provider}`)
          resolve(JSON.parse(successMarker))
        } else {
          reject(new Error('OAuth window closed without completing'))
        }
      }
    }, 500)

    // Also listen for postMessage from OAuth callback
    const messageHandler = (event: MessageEvent) => {
      console.log('📨 Received message:', event.data)
      
      if (event.data.type === 'oauth-success' && event.data.provider === provider) {
        console.log(`✅ OAuth success for ${provider}`)
        clearInterval(checkInterval)
        window.removeEventListener('message', messageHandler)
        if (authWindow && !authWindow.closed) {
          authWindow.close()
        }
        resolve(event.data)
      } else if (event.data.type === 'oauth-error') {
        console.log(`❌ OAuth error for ${provider}:`, event.data.error)
        clearInterval(checkInterval)
        window.removeEventListener('message', messageHandler)
        if (authWindow && !authWindow.closed) {
          authWindow.close()
        }
        reject(new Error(event.data.error || 'OAuth failed'))
      }
    }
    window.addEventListener('message', messageHandler)

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval)
      window.removeEventListener('message', messageHandler)
      if (authWindow && !authWindow.closed) {
        authWindow.close()
      }
      reject(new Error('OAuth timeout'))
    }, 5 * 60 * 1000)
  })
}