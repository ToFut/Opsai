// Simple redirect-based OAuth handler that opens in new window
export function initiateOAuthRedirect(provider: string, tenantId: string, returnUrl?: string) {
  // Create state with redirect flow indicator
  const state = btoa(JSON.stringify({
    tenantId,
    provider,
    timestamp: Date.now(),
    popup: false, // Explicitly mark as redirect flow
    returnUrl: returnUrl || window.location.pathname
  }))

  // Use GET endpoint for direct redirect
  const params = new URLSearchParams({
    provider,
    state
  })

  // Build full URL
  const authUrl = `${window.location.origin}/api/oauth/connect?${params.toString()}`
  
  // Open in new window with specific features
  const width = 600
  const height = 700
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  
  const newWindow = window.open(
    authUrl, 
    `oauth_${provider}_${Date.now()}`, // Unique window name
    `width=${width},height=${height},left=${left},top=${top},location=yes,toolbar=no,menubar=no,status=yes,scrollbars=yes`
  )
  
  // Focus the new window
  if (newWindow) {
    newWindow.focus()
  } else {
    // Fallback if popup blocked - open in new tab
    const link = document.createElement('a')
    link.href = authUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}