import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { prisma } from '@opsai/database'
import { AuthConfig, AuthResponse, TokenPayload } from '../types'

export interface OAuthProvider {
  name: string
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope: string[]
}

export interface OAuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  provider: string
  providerId: string
}

export class OAuthService {
  private supabase: SupabaseClient
  private config: AuthConfig
  private providers: Map<string, OAuthProvider>

  constructor(config: AuthConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
    this.providers = new Map()
    this.initializeProviders()
  }

  /**
   * Initialize OAuth providers
   */
  private initializeProviders(): void {
    // Google OAuth
    this.providers.set('google', {
      name: 'Google',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: ['openid', 'email', 'profile']
    })

    // GitHub OAuth
    this.providers.set('github', {
      name: 'GitHub',
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scope: ['read:user', 'user:email']
    })

    // Microsoft OAuth
    this.providers.set('microsoft', {
      name: 'Microsoft',
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      scope: ['openid', 'email', 'profile']
    })
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(provider: string, redirectUri: string, state?: string): string {
    const oauthProvider = this.providers.get(provider)
    if (!oauthProvider) {
      throw new Error(`OAuth provider '${provider}' not supported`)
    }

    const params = new URLSearchParams({
      client_id: oauthProvider.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: oauthProvider.scope.join(' '),
      state: state || this.generateState()
    })

    return `${oauthProvider.authorizeUrl}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const oauthProvider = this.providers.get(provider)
    if (!oauthProvider) {
      throw new Error(`OAuth provider '${provider}' not supported`)
    }

    const response = await fetch(oauthProvider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: oauthProvider.clientId,
        client_secret: oauthProvider.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`)
    }

    const data = await response.json() as any
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token
    }
  }

  /**
   * Get user information from OAuth provider
   */
  async getUserInfo(provider: string, accessToken: string): Promise<OAuthUser> {
    const oauthProvider = this.providers.get(provider)
    if (!oauthProvider) {
      throw new Error(`OAuth provider '${provider}' not supported`)
    }

    const response = await fetch(oauthProvider.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`)
    }

    const userData = await response.json()
    return this.mapUserData(provider, userData)
  }

  /**
   * Map provider-specific user data to our format
   */
  private mapUserData(provider: string, userData: any): OAuthUser {
    switch (provider) {
      case 'google':
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.picture,
          provider: 'google',
          providerId: userData.id
        }
      
      case 'github':
        return {
          id: userData.id.toString(),
          email: userData.email || '',
          name: userData.name || userData.login,
          avatar: userData.avatar_url,
          provider: 'github',
          providerId: userData.id.toString()
        }
      
      case 'microsoft':
        return {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          avatar: undefined, // Microsoft doesn't provide avatar in basic profile
          provider: 'microsoft',
          providerId: userData.id
        }
      
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * Authenticate user with OAuth
   */
  async authenticateWithOAuth(
    provider: string,
    code: string,
    redirectUri: string,
    tenantId: string
  ): Promise<AuthResponse> {
    try {
      // Exchange code for token
      const { accessToken } = await this.exchangeCodeForToken(provider, code, redirectUri)

      // Get user info from provider
      const oauthUser = await this.getUserInfo(provider, accessToken)

      // Find or create user in our database
      let user = await this.findUserByOAuth(provider, oauthUser.providerId, tenantId)

      if (!user) {
        // Create new user
        user = await this.createUserFromOAuth(oauthUser, tenantId)
      } else {
        // Update existing user info
        user = await this.updateUserFromOAuth(user.id, oauthUser)
      }

      // Generate tokens
      const accessTokenJWT = this.generateAccessToken(user)
      const refreshToken = this.generateRefreshToken(user)

      // Create session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          tenantId,
          token: accessTokenJWT,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isActive: true
        }
      })

      return {
        user: user as any,
        session: session as any,
        accessToken: accessTokenJWT,
        refreshToken
      }
    } catch (error) {
      console.error('OAuth authentication error:', error)
      throw new Error(`OAuth authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find user by OAuth provider and ID
   */
  private async findUserByOAuth(provider: string, providerId: string, tenantId: string): Promise<any> {
    return prisma.user.findFirst({
      where: {
        email: {
          contains: providerId // This is a simplified approach - in production you'd have a separate OAuth accounts table
        },
        tenantId
      }
    })
  }

  /**
   * Create user from OAuth data
   */
  private async createUserFromOAuth(oauthUser: OAuthUser, tenantId: string): Promise<any> {
    return prisma.user.create({
      data: {
        email: oauthUser.email,
        firstName: oauthUser.name.split(' ')[0] || '',
        lastName: oauthUser.name.split(' ').slice(1).join(' ') || '',
        avatar: oauthUser.avatar,
        tenantId,
        role: 'user',
        isActive: true
      }
    })
  }

  /**
   * Update user from OAuth data
   */
  private async updateUserFromOAuth(userId: string, oauthUser: OAuthUser): Promise<any> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        firstName: oauthUser.name.split(' ')[0] || '',
        lastName: oauthUser.name.split(' ').slice(1).join(' ') || '',
        avatar: oauthUser.avatar
      }
    })
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: any): string {
    const jwt = require('jsonwebtoken')
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: [user.role],
      permissions: []
    }

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h',
      issuer: 'opsai',
      audience: 'opsai-users'
    })
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: any): string {
    const jwt = require('jsonwebtoken')
    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      type: 'refresh'
    }

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '7d',
      issuer: 'opsai',
      audience: 'opsai-users'
    })
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Check if provider is configured
   */
  isProviderConfigured(provider: string): boolean {
    const oauthProvider = this.providers.get(provider)
    return !!(oauthProvider?.clientId && oauthProvider?.clientSecret)
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider: string): OAuthProvider | null {
    return this.providers.get(provider) || null
  }
} 