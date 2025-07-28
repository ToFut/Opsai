import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { prisma } from '@opsai/database';
import { AuthConfig, LoginCredentials, RegisterData, AuthResponse, TokenPayload } from '../types';

export class AuthService {
  private supabase: SupabaseClient;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
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
} 