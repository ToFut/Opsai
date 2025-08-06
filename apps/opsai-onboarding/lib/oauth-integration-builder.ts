/**
 * OAuth Integration Builder
 * Creates complete OAuth flows for user-selected services
 * Then generates API integrations that use the OAuth tokens
 */

interface OAuthConfig {
  id: string
  name: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  clientIdEnv: string
  clientSecretEnv: string
  redirectUri: string
  requiresOAuth: boolean
}

interface GeneratedOAuth {
  authRoutes: string[]
  callbackRoutes: string[]
  tokenStorage: string[]
  apiIntegrations: string[]
  frontendComponents: string[]
  middleware: string[]
}

export class OAuthIntegrationBuilder {
  private oauthConfigs: Map<string, OAuthConfig> = new Map()

  constructor(selectedIntegrations: string[], baseUrl: string) {
    this.initializeOAuthConfigs(selectedIntegrations, baseUrl)
  }

  private initializeOAuthConfigs(integrations: string[], baseUrl: string) {
    const configs: OAuthConfig[] = [
      {
        id: 'stripe',
        name: 'Stripe',
        authUrl: 'https://connect.stripe.com/oauth/authorize',
        tokenUrl: 'https://connect.stripe.com/oauth/token',
        scopes: ['read_write'],
        clientIdEnv: 'STRIPE_CLIENT_ID',
        clientSecretEnv: 'STRIPE_SECRET_KEY',
        redirectUri: `${baseUrl}/api/oauth/stripe/callback`,
        requiresOAuth: true
      },
      {
        id: 'shopify',
        name: 'Shopify',
        authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
        tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
        scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
        clientIdEnv: 'SHOPIFY_API_KEY',
        clientSecretEnv: 'SHOPIFY_API_SECRET',
        redirectUri: `${baseUrl}/api/oauth/shopify/callback`,
        requiresOAuth: true
      },
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
        redirectUri: `${baseUrl}/api/oauth/google/callback`,
        requiresOAuth: true
      },
      {
        id: 'slack',
        name: 'Slack',
        authUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: ['channels:read', 'chat:write', 'users:read'],
        clientIdEnv: 'SLACK_CLIENT_ID',
        clientSecretEnv: 'SLACK_CLIENT_SECRET',
        redirectUri: `${baseUrl}/api/oauth/slack/callback`,
        requiresOAuth: true
      },
      {
        id: 'github',
        name: 'GitHub',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scopes: ['repo', 'user'],
        clientIdEnv: 'GITHUB_CLIENT_ID',
        clientSecretEnv: 'GITHUB_CLIENT_SECRET',
        redirectUri: `${baseUrl}/api/oauth/github/callback`,
        requiresOAuth: true
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        authUrl: 'https://appcenter.intuit.com/connect/oauth2',
        tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        scopes: ['com.intuit.quickbooks.accounting'],
        clientIdEnv: 'QUICKBOOKS_CLIENT_ID',
        clientSecretEnv: 'QUICKBOOKS_CLIENT_SECRET',
        redirectUri: `${baseUrl}/api/oauth/quickbooks/callback`,
        requiresOAuth: true
      }
    ]

    // Only include configs for selected integrations
    configs.forEach(config => {
      if (integrations.includes(config.id)) {
        this.oauthConfigs.set(config.id, config)
      }
    })
  }

  /**
   * Generate complete OAuth implementation
   */
  generateOAuthIntegration(): GeneratedOAuth {
    const result: GeneratedOAuth = {
      authRoutes: [],
      callbackRoutes: [],
      tokenStorage: [],
      apiIntegrations: [],
      frontendComponents: [],
      middleware: []
    }

    this.oauthConfigs.forEach(config => {
      // Generate OAuth flow routes
      result.authRoutes.push(this.generateAuthRoute(config))
      result.callbackRoutes.push(this.generateCallbackRoute(config))
      
      // Generate token storage
      result.tokenStorage.push(this.generateTokenStorage(config))
      
      // Generate API integration using tokens
      result.apiIntegrations.push(this.generateTokenizedAPI(config))
      
      // Generate frontend OAuth components
      result.frontendComponents.push(this.generateOAuthComponent(config))
      
      // Generate middleware for token validation
      result.middleware.push(this.generateOAuthMiddleware(config))
    })

    return result
  }

  /**
   * Generate OAuth authorization route
   */
  private generateAuthRoute(config: OAuthConfig): string {
    return `// app/api/oauth/${config.id}/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = generateStateToken() // CSRF protection
  
  // Store state in session/database for verification
  await storeOAuthState(state, '${config.id}')
  
  const authUrl = new URL('${config.authUrl}')
  authUrl.searchParams.set('client_id', process.env.${config.clientIdEnv}!)
  authUrl.searchParams.set('redirect_uri', '${config.redirectUri}')
  authUrl.searchParams.set('scope', '${config.scopes.join(' ')}')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')
  
  ${config.id === 'shopify' ? `
  // Shopify requires shop parameter
  const shop = searchParams.get('shop')
  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 })
  }
  const shopAuthUrl = authUrl.toString().replace('{shop}', shop)
  return redirect(shopAuthUrl)
  ` : `
  return redirect(authUrl.toString())
  `}
}

async function generateStateToken(): Promise<string> {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

async function storeOAuthState(state: string, provider: string) {
  // Store in database or session
  // This prevents CSRF attacks
  console.log(\`Storing OAuth state for \${provider}: \${state}\`)
}`
  }

  /**
   * Generate OAuth callback route
   */
  private generateCallbackRoute(config: OAuthConfig): string {
    return `// app/api/oauth/${config.id}/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  if (error) {
    return redirect(\`/oauth-error?provider=${config.id}&error=\${error}\`)
  }
  
  if (!code || !state) {
    return redirect(\`/oauth-error?provider=${config.id}&error=missing_parameters\`)
  }
  
  // Verify state token (CSRF protection)
  const isValidState = await verifyOAuthState(state, '${config.id}')
  if (!isValidState) {
    return redirect(\`/oauth-error?provider=${config.id}&error=invalid_state\`)
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('${config.tokenUrl}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: process.env.${config.clientIdEnv}!,
        client_secret: process.env.${config.clientSecretEnv}!,
        code,
        redirect_uri: '${config.redirectUri}',
        grant_type: 'authorization_code'
      })
    })
    
    if (!tokenResponse.ok) {
      throw new Error(\`Token exchange failed: \${tokenResponse.statusText}\`)
    }
    
    const tokens = await tokenResponse.json()
    
    ${this.generateTokenSpecificHandling(config)}
    
    // Store tokens securely
    await storeTokens('${config.id}', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      ${config.id === 'stripe' ? 'stripe_user_id: tokens.stripe_user_id,' : ''}
      ${config.id === 'shopify' ? 'shop: tokens.associated_user?.first_name,' : ''}
      created_at: new Date().toISOString()
    })
    
    // Test the API connection
    await testAPIConnection('${config.id}', tokens.access_token)
    
    return redirect(\`/oauth-success?provider=${config.id}\`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return redirect(\`/oauth-error?provider=${config.id}&error=\${error.message}\`)
  }
}

async function verifyOAuthState(state: string, provider: string): Promise<boolean> {
  // Verify state token from storage
  console.log(\`Verifying OAuth state for \${provider}: \${state}\`)
  return true // Implement actual verification
}

async function storeTokens(provider: string, tokens: any) {
  // Store in secure database
  console.log(\`Storing tokens for \${provider}\`)
  
  // Example: Store in Supabase
  // await supabase.from('oauth_tokens').upsert({
  //   provider,
  //   user_id: getCurrentUserId(),
  //   tokens: tokens,
  //   created_at: new Date().toISOString()
  // })
}

async function testAPIConnection(provider: string, accessToken: string) {
  // Test the API connection to ensure tokens work
  ${this.generateConnectionTest(config)}
}`
  }

  /**
   * Generate token-specific handling for different providers
   */
  private generateTokenSpecificHandling(config: OAuthConfig): string {
    switch (config.id) {
      case 'stripe':
        return `// Stripe Connect returns special fields
        const stripeUserId = tokens.stripe_user_id
        const stripePublishableKey = tokens.stripe_publishable_key`
      
      case 'shopify':
        return `// Shopify returns shop information
        const shop = tokens.associated_user?.first_name || searchParams.get('shop')
        const shopDomain = \`\${shop}.myshopify.com\``
      
      case 'google-analytics':
        return `// Google Analytics tokens
        const refreshToken = tokens.refresh_token
        const idToken = tokens.id_token`
      
      default:
        return '// Standard OAuth token handling'
    }
  }

  /**
   * Generate API connection test
   */
  private generateConnectionTest(config: OAuthConfig): string {
    switch (config.id) {
      case 'stripe':
        return `
        const stripeTest = await fetch('https://api.stripe.com/v1/account', {
          headers: { 'Authorization': \`Bearer \${accessToken}\` }
        })
        if (!stripeTest.ok) throw new Error('Stripe API test failed')`
      
      case 'shopify':
        return `
        const shopifyTest = await fetch(\`https://\${shop}.myshopify.com/admin/api/2023-10/shop.json\`, {
          headers: { 'X-Shopify-Access-Token': accessToken }
        })
        if (!shopifyTest.ok) throw new Error('Shopify API test failed')`
      
      case 'slack':
        return `
        const slackTest = await fetch('https://slack.com/api/auth.test', {
          headers: { 'Authorization': \`Bearer \${accessToken}\` }
        })
        if (!slackTest.ok) throw new Error('Slack API test failed')`
      
      default:
        return `console.log('API connection test for ${config.id}')`
    }
  }

  /**
   * Generate token storage system
   */
  private generateTokenStorage(config: OAuthConfig): string {
    return `// lib/token-storage/${config.id}.ts
import { supabase } from '@/lib/supabase'

interface ${config.name}Tokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  created_at: string
  ${config.id === 'stripe' ? 'stripe_user_id?: string' : ''}
  ${config.id === 'shopify' ? 'shop?: string' : ''}
}

export class ${config.name}TokenManager {
  private provider = '${config.id}'
  
  async storeTokens(userId: string, tokens: ${config.name}Tokens): Promise<void> {
    const { error } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider: this.provider,
        tokens,
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
  }
  
  async getTokens(userId: string): Promise<${config.name}Tokens | null> {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('tokens')
      .eq('user_id', userId)
      .eq('provider', this.provider)
      .single()
    
    if (error || !data) return null
    return data.tokens
  }
  
  async refreshTokens(userId: string): Promise<${config.name}Tokens> {
    const currentTokens = await this.getTokens(userId)
    if (!currentTokens?.refresh_token) {
      throw new Error('No refresh token available')
    }
    
    ${this.generateRefreshLogic(config)}
    
    await this.storeTokens(userId, newTokens)
    return newTokens
  }
  
  async revokeTokens(userId: string): Promise<void> {
    const tokens = await this.getTokens(userId)
    if (!tokens) return
    
    // Revoke with provider
    ${this.generateRevokeLogic(config)}
    
    // Remove from database
    await supabase
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', this.provider)
  }
}

export const ${config.id}TokenManager = new ${config.name}TokenManager()`
  }

  private generateRefreshLogic(config: OAuthConfig): string {
    return `
    const response = await fetch('${config.tokenUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refresh_token,
        client_id: process.env.${config.clientIdEnv}!,
        client_secret: process.env.${config.clientSecretEnv}!
      })
    })
    
    if (!response.ok) throw new Error('Token refresh failed')
    
    const newTokens = await response.json()
    return {
      ...currentTokens,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || currentTokens.refresh_token,
      expires_in: newTokens.expires_in,
      created_at: new Date().toISOString()
    }`
  }

  private generateRevokeLogic(config: OAuthConfig): string {
    switch (config.id) {
      case 'google-analytics':
        return `
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: \`token=\${tokens.access_token}\`
        })`
      
      default:
        return `console.log('Revoking ${config.id} tokens')`
    }
  }

  /**
   * Generate API integration that uses stored tokens
   */
  private generateTokenizedAPI(config: OAuthConfig): string {
    return `// lib/api/${config.id}-client.ts
import { ${config.id}TokenManager } from '../token-storage/${config.id}'

export class ${config.name}APIClient {
  private tokenManager = ${config.id}TokenManager
  private baseUrl = '${this.getAPIBaseUrl(config)}'
  
  async makeAuthenticatedRequest(
    userId: string, 
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    let tokens = await this.tokenManager.getTokens(userId)
    
    if (!tokens) {
      throw new Error('No tokens found. Please complete OAuth flow.')
    }
    
    // Check if token is expired and refresh if needed
    if (this.isTokenExpired(tokens)) {
      tokens = await this.tokenManager.refreshTokens(userId)
    }
    
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers: {
        ...options.headers,
        ${this.getAuthHeader(config)}
      }
    })
    
    if (response.status === 401) {
      // Token might be invalid, try to refresh
      tokens = await this.tokenManager.refreshTokens(userId)
      
      // Retry request with new token
      return fetch(\`\${this.baseUrl}\${endpoint}\`, {
        ...options,
        headers: {
          ...options.headers,
          ${this.getAuthHeader(config)}
        }
      })
    }
    
    if (!response.ok) {
      throw new Error(\`API request failed: \${response.statusText}\`)
    }
    
    return response.json()
  }
  
  private isTokenExpired(tokens: any): boolean {
    if (!tokens.expires_in || !tokens.created_at) return false
    
    const expiryTime = new Date(tokens.created_at).getTime() + (tokens.expires_in * 1000)
    const now = Date.now()
    const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
    
    return now >= (expiryTime - bufferTime)
  }
  
  ${this.generateAPISpecificMethods(config)}
}

export const ${config.id}Client = new ${config.name}APIClient()`
  }

  private getAPIBaseUrl(config: OAuthConfig): string {
    const baseUrls: { [key: string]: string } = {
      'stripe': 'https://api.stripe.com/v1',
      'shopify': 'https://{shop}.myshopify.com/admin/api/2023-10',
      'google-analytics': 'https://analyticsreporting.googleapis.com/v4',
      'slack': 'https://slack.com/api',
      'github': 'https://api.github.com',
      'quickbooks': 'https://sandbox-quickbooks.api.intuit.com'
    }
    return baseUrls[config.id] || 'https://api.example.com'
  }

  private getAuthHeader(config: OAuthConfig): string {
    const authHeaders: { [key: string]: string } = {
      'stripe': `'Authorization': \`Bearer \${tokens.access_token}\``,
      'shopify': `'X-Shopify-Access-Token': tokens.access_token`,
      'google-analytics': `'Authorization': \`Bearer \${tokens.access_token}\``,
      'slack': `'Authorization': \`Bearer \${tokens.access_token}\``,
      'github': `'Authorization': \`token \${tokens.access_token}\``,
      'quickbooks': `'Authorization': \`Bearer \${tokens.access_token}\``
    }
    return authHeaders[config.id] || `'Authorization': \`Bearer \${tokens.access_token}\``
  }

  private generateAPISpecificMethods(config: OAuthConfig): string {
    switch (config.id) {
      case 'stripe':
        return `
        async getAccount(userId: string) {
          return this.makeAuthenticatedRequest(userId, '/account')
        }
        
        async createPaymentIntent(userId: string, amount: number, currency = 'usd') {
          return this.makeAuthenticatedRequest(userId, '/payment_intents', {
            method: 'POST',
            body: new URLSearchParams({ amount: (amount * 100).toString(), currency })
          })
        }`
      
      case 'shopify':
        return `
        async getProducts(userId: string, shop: string) {
          this.baseUrl = this.baseUrl.replace('{shop}', shop)
          return this.makeAuthenticatedRequest(userId, '/products.json')
        }
        
        async createProduct(userId: string, shop: string, product: any) {
          this.baseUrl = this.baseUrl.replace('{shop}', shop)
          return this.makeAuthenticatedRequest(userId, '/products.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product })
          })
        }`
      
      case 'slack':
        return `
        async postMessage(userId: string, channel: string, text: string) {
          return this.makeAuthenticatedRequest(userId, '/chat.postMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel, text })
          })
        }
        
        async getChannels(userId: string) {
          return this.makeAuthenticatedRequest(userId, '/conversations.list')
        }`
      
      default:
        return `
        async get(userId: string, endpoint: string) {
          return this.makeAuthenticatedRequest(userId, endpoint)
        }
        
        async post(userId: string, endpoint: string, data: any) {
          return this.makeAuthenticatedRequest(userId, endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
        }`
    }
  }

  /**
   * Generate OAuth frontend component
   */
  private generateOAuthComponent(config: OAuthConfig): string {
    return `// components/oauth/${config.name}OAuth.tsx
'use client'

import { useState, useEffect } from 'react'
import { ${config.id}Client } from '@/lib/api/${config.id}-client'

interface ${config.name}OAuthProps {
  userId: string
  onSuccess?: (tokens: any) => void
  onError?: (error: string) => void
}

export default function ${config.name}OAuth({ 
  userId, 
  onSuccess, 
  onError 
}: ${config.name}OAuthProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionData, setConnectionData] = useState<any>(null)
  
  useEffect(() => {
    checkConnectionStatus()
  }, [userId])
  
  const checkConnectionStatus = async () => {
    try {
      // Test if we have valid tokens
      const testResult = await ${config.id}Client.makeAuthenticatedRequest(
        userId, 
        '${this.getTestEndpoint(config)}'
      )
      setIsConnected(true)
      setConnectionData(testResult)
    } catch (error) {
      setIsConnected(false)
    }
  }
  
  const handleConnect = () => {
    setIsConnecting(true)
    
    // Open OAuth popup
    const popup = window.open(
      \`/api/oauth/${config.id}?user_id=\${userId}\`,
      '${config.id}_oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    )
    
    // Listen for OAuth completion
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        setIsConnecting(false)
        
        // Check if connection was successful
        setTimeout(async () => {
          try {
            await checkConnectionStatus()
            if (isConnected && onSuccess) {
              onSuccess(connectionData)
            }
          } catch (error) {
            if (onError) {
              onError(error instanceof Error ? error.message : 'Connection failed')
            }
          }
        }, 1000)
      }
    }, 1000)
    
    // Timeout after 10 minutes
    setTimeout(() => {
      if (!popup?.closed) {
        popup?.close()
        clearInterval(checkClosed)
        setIsConnecting(false)
        if (onError) {
          onError('OAuth timeout')
        }
      }
    }, 600000)
  }
  
  const handleDisconnect = async () => {
    try {
      // Revoke tokens
      const { ${config.id}TokenManager } = await import('@/lib/token-storage/${config.id}')
      await ${config.id}TokenManager.revokeTokens(userId)
      
      setIsConnected(false)
      setConnectionData(null)
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }
  
  return (
    <div className="oauth-integration ${config.id}-oauth">
      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r ${this.getProviderColors(config)} flex items-center justify-center">
            ${this.getProviderIcon(config)}
          </div>
        </div>
        
        <div className="flex-grow">
          <h3 className="font-semibold">${config.name}</h3>
          <p className="text-sm text-gray-600">
            {isConnected ? (
              <>
                ✅ Connected ${this.getConnectionDetails(config)}
              </>
            ) : (
              'Not connected'
            )}
          </p>
        </div>
        
        <div>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="btn btn-secondary"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn btn-primary"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
      
      {connectionData && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Connection Details:</h4>
          <pre className="text-sm text-green-700">
            {JSON.stringify(connectionData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

${this.generateProviderSpecificComponents(config)}`
  }

  private getTestEndpoint(config: OAuthConfig): string {
    const endpoints: { [key: string]: string } = {
      'stripe': '/account',
      'shopify': '/shop.json',
      'slack': '/auth.test',
      'github': '/user',
      'google-analytics': '/reports:batchGet'
    }
    return endpoints[config.id] || '/test'
  }

  private getProviderColors(config: OAuthConfig): string {
    const colors: { [key: string]: string } = {
      'stripe': 'from-purple-500 to-blue-600',
      'shopify': 'from-green-500 to-green-600',
      'slack': 'from-purple-400 to-pink-500',
      'github': 'from-gray-700 to-gray-900',
      'google-analytics': 'from-blue-500 to-red-500'
    }
    return colors[config.id] || 'from-blue-500 to-purple-600'
  }

  private getProviderIcon(config: OAuthConfig): string {
    const icons: { [key: string]: string } = {
      'stripe': '💳',
      'shopify': '🛍️',
      'slack': '💬', 
      'github': '🐙',
      'google-analytics': '📊'
    }
    return icons[config.id] || '🔗'
  }

  private getConnectionDetails(config: OAuthConfig): string {
    switch (config.id) {
      case 'stripe':
        return '- {connectionData?.business_name || "Account"}'
      case 'shopify':
        return '- {connectionData?.shop?.name || "Shop"}'
      case 'slack':
        return '- {connectionData?.team || "Team"}'
      default:
        return ''
    }
  }

  private generateProviderSpecificComponents(config: OAuthConfig): string {
    return `
// ${config.name}-specific usage components
export function ${config.name}QuickActions({ userId }: { userId: string }) {
  ${this.generateQuickActions(config)}
}
`
  }

  private generateQuickActions(config: OAuthConfig): string {
    switch (config.id) {
      case 'stripe':
        return `
        const [paymentAmount, setPaymentAmount] = useState(0)
        
        const createPayment = async () => {
          try {
            const result = await ${config.id}Client.createPaymentIntent(userId, paymentAmount)
            console.log('Payment intent created:', result)
          } catch (error) {
            console.error('Payment creation failed:', error)
          }
        }
        
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Test Payment Amount</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full p-2 border rounded"
                placeholder="10.00"
              />
            </div>
            <button onClick={createPayment} className="btn btn-primary w-full">
              Create Test Payment Intent
            </button>
          </div>
        )`

      case 'slack':
        return `
        const [message, setMessage] = useState('')
        const [channel, setChannel] = useState('#general')
        
        const sendMessage = async () => {
          try {
            await ${config.id}Client.postMessage(userId, channel, message)
            setMessage('')
            console.log('Message sent to Slack')
          } catch (error) {
            console.error('Failed to send message:', error)
          }
        }
        
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="#general"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Hello from the app!"
              />
            </div>
            <button 
              onClick={sendMessage} 
              disabled={!message.trim()}
              className="btn btn-primary w-full"
            >
              Send Message
            </button>
          </div>
        )`

      default:
        return `
        return (
          <div className="text-center p-4 text-gray-500">
            ${config.name} integration ready to use!
          </div>
        )`
    }
  }

  /**
   * Generate OAuth middleware for route protection
   */
  private generateOAuthMiddleware(config: OAuthConfig): string {
    return `// middleware/oauth-${config.id}.ts
import { NextRequest, NextResponse } from 'next/server'
import { ${config.id}TokenManager } from '@/lib/token-storage/${config.id}'

export async function ${config.id}AuthMiddleware(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  // Check if user has valid ${config.name} tokens
  try {
    const tokens = await ${config.id}TokenManager.getTokens(userId)
    
    if (!tokens) {
      return NextResponse.json(
        { 
          error: '${config.name} not connected',
          oauth_url: \`/api/oauth/${config.id}?user_id=\${userId}\`
        },
        { status: 401 }
      )
    }
    
    // Add tokens to request headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-${config.id}-token', tokens.access_token)
    
    return response
    
  } catch (error) {
    return NextResponse.json(
      { error: '${config.name} authentication failed' },
      { status: 500 }
    )
  }
}`
  }

  /**
   * Generate environment variables template
   */
  generateEnvTemplate(): string {
    let envVars = ['# OAuth Integration Environment Variables', '']
    
    this.oauthConfigs.forEach(config => {
      envVars.push(`# ${config.name} OAuth`)
      envVars.push(`${config.clientIdEnv}=your_${config.id}_client_id`)
      envVars.push(`${config.clientSecretEnv}=your_${config.id}_client_secret`)
      envVars.push('')
    })
    
    return envVars.join('\n')
  }

  /**
   * Get list of required OAuth apps to create
   */
  getRequiredOAuthApps(): Array<{
    provider: string
    name: string
    redirectUri: string
    scopes: string[]
    setupUrl: string
  }> {
    const apps: any[] = []
    
    this.oauthConfigs.forEach(config => {
      apps.push({
        provider: config.id,
        name: config.name,
        redirectUri: config.redirectUri,
        scopes: config.scopes,
        setupUrl: this.getOAuthSetupUrl(config)
      })
    })
    
    return apps
  }

  private getOAuthSetupUrl(config: OAuthConfig): string {
    const setupUrls: { [key: string]: string } = {
      'stripe': 'https://dashboard.stripe.com/applications',
      'shopify': 'https://partners.shopify.com/organizations',
      'slack': 'https://api.slack.com/apps',
      'github': 'https://github.com/settings/applications/new',
      'google-analytics': 'https://console.developers.google.com/apis/credentials'
    }
    return setupUrls[config.id] || 'https://developer.example.com'
  }
}

export default OAuthIntegrationBuilder`