import { SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { prisma } from '@opsai/database';
import { AuthConfig, LoginCredentials, RegisterData, AuthResponse, TokenPayload } from '../types';
import { supabaseConfig } from '../config/supabase-config';

export class AuthService {
  private supabase: SupabaseClient;
  private config: AuthConfig;

  constructor(config?: Partial<AuthConfig>) {
    // Merge provided config with Supabase config
    const supabaseConf = supabaseConfig.getConfig();
    this.config = {
      supabaseUrl: config?.supabaseUrl || supabaseConf.url,
      supabaseAnonKey: config?.supabaseAnonKey || supabaseConf.anonKey,
      jwtSecret: config?.jwtSecret || supabaseConf.jwtSecret,
      jwtExpiresIn: config?.jwtExpiresIn || '15m',
      refreshTokenExpiresIn: config?.refreshTokenExpiresIn || '7d'
    };

    // Validate configuration
    const validation = supabaseConfig.validateConfig();
    if (!validation.valid) {
      throw new Error(`Invalid Supabase configuration: ${validation.errors.join(', ')}`);
    }

    this.supabase = supabaseConfig.getClient();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Create user in Supabase
    const { data: authData, error } = await this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          tenant_id: data.tenantId,
          role: data.role || 'user'
        }
      }
    });

    if (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create user record in our database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId: data.tenantId,
        role: data.role || 'user',
        isActive: true
      }
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tenantId: data.tenantId,
        token: accessToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true
      }
    });

    return {
      user: user as any,
      session: session as any,
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('User not found');
    }

    // Get user from our database
    const user = await prisma.user.findUnique({
      where: { id: data.user.id }
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Verify tenant access if specified
    if (credentials.tenantId && user.tenantId !== credentials.tenantId) {
      throw new Error('User does not have access to this tenant');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Create or update session
    const session = await prisma.session.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: user.tenantId
        }
      },
      update: {
        token: accessToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true
      },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        token: accessToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true
      }
    });

    return {
      user: user as any,
      session: session as any,
      accessToken,
      refreshToken
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string, tenantId: string): Promise<void> {
    // Deactivate session
    await prisma.session.updateMany({
      where: {
        userId,
        tenantId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Sign out from Supabase
    await this.supabase.auth.signOut();
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = jwt.verify(refreshToken, this.config.jwtSecret) as TokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: any): string {
    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: [user.role],
      permissions: [], // Will be populated by RBAC service
      iat: Date.now(),
      exp: Date.now() + 15 * 60 * 1000 // 15 minutes
    };

    return jwt.sign(payload, this.config.jwtSecret);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: any): string {
    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: [user.role],
      permissions: [],
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    return jwt.sign(payload, this.config.jwtSecret);
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'google' | 'github' | 'microsoft', options?: {
    redirectTo?: string;
    scopes?: string;
  }): Promise<{ data: any; error: any }> {
    return await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        scopes: options?.scopes
      }
    });
  }

  /**
   * Sign in with magic link
   */
  async signInWithMagicLink(email: string, options?: {
    redirectTo?: string;
  }): Promise<{ data: any; error: any }> {
    return await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: options?.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });
  }

  /**
   * Verify OTP for magic link or SMS
   */
  async verifyOtp(email: string, token: string, type: 'signup' | 'magiclink' | 'recovery' = 'magiclink'): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type
    });

    if (error) {
      throw new Error(`OTP verification failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('OTP verification failed');
    }

    // Get or create user in our database
    let user = await prisma.user.findUnique({
      where: { id: data.user.id }
    });

    if (!user) {
      // Create user if doesn't exist (for magic link signups)
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata?.first_name || '',
          lastName: data.user.user_metadata?.last_name || '',
          tenantId: data.user.user_metadata?.tenant_id || 'default',
          role: 'user',
          isActive: true
        }
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user as any,
      session: data.session as any,
      accessToken,
      refreshToken
    };
  }

  /**
   * Get current session from Supabase
   */
  async getCurrentSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
    return session;
  }

  /**
   * Check authentication health
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const connectionTest = await supabaseConfig.testConnection();
      const session = await this.getCurrentSession();
      
      return {
        status: connectionTest.success ? 'healthy' : 'unhealthy',
        details: {
          supabaseConnection: connectionTest,
          hasActiveSession: !!session,
          configValid: supabaseConfig.validateConfig().valid
        }
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          configValid: supabaseConfig.validateConfig().valid
        }
      };
    }
  }

  /**
   * Initialize tenant-specific auth
   */
  async initializeTenant(tenantId: string, tenantConfig?: {
    allowedDomains?: string[];
    ssoProviders?: string[];
    passwordPolicy?: any;
  }): Promise<void> {
    // Create tenant-specific auth configuration
    if (tenantConfig) {
      await prisma.tenantAuthConfig.upsert({
        where: { tenantId },
        update: {
          allowedDomains: tenantConfig.allowedDomains || [],
          ssoProviders: tenantConfig.ssoProviders || [],
          passwordPolicy: tenantConfig.passwordPolicy || {}
        },
        create: {
          tenantId,
          allowedDomains: tenantConfig.allowedDomains || [],
          ssoProviders: tenantConfig.ssoProviders || [],
          passwordPolicy: tenantConfig.passwordPolicy || {}
        }
      });
    }
  }
} 