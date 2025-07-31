import { NextRequest, NextResponse } from 'next/server'
import { oauthManager } from '@/lib/oauth-providers'
// Simple UUID generation (avoiding uuid dependency for demo)
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params
  const sessionId = request.nextUrl.searchParams.get('session_id') || generateUuid()
  
  try {
    // Get the authorization URL for the provider
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const authUrl = oauthManager.getAuthorizationUrl(provider, sessionId, baseUrl)
    
    // For demo flows, the URL is already complete, just redirect
    if (authUrl.includes('/demo-success')) {
      return NextResponse.redirect(authUrl)
    }
    
    // For real OAuth flows, add session ID to the auth URL
    const url = new URL(authUrl)
    url.searchParams.set('session_id', sessionId)
    
    // Redirect to the OAuth provider
    return NextResponse.redirect(url.toString())
    
  } catch (error) {
    console.error(`Failed to initiate OAuth for ${provider}:`, error)
    
    return NextResponse.redirect(
      new URL(`/?error=oauth_init_failed&provider=${provider}`, request.url)
    )
  }
}