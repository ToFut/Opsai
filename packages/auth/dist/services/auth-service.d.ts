import { AuthConfig, LoginCredentials, RegisterData, AuthResponse } from '../types';
export declare class AuthService {
    private supabase;
    private config;
    constructor(config?: Partial<AuthConfig>);
    /**
     * Register a new user
     */
    register(data: RegisterData): Promise<AuthResponse>;
    /**
     * Login user
     */
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    /**
     * Logout user
     */
    logout(userId: string, tenantId: string): Promise<void>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    /**
     * Generate access token
     */
    private generateAccessToken;
    /**
     * Generate refresh token
     */
    private generateRefreshToken;
    /**
     * Sign in with OAuth provider
     */
    signInWithOAuth(provider: 'google' | 'github' | 'microsoft', options?: {
        redirectTo?: string;
        scopes?: string;
    }): Promise<{
        data: any;
        error: any;
    }>;
    /**
     * Sign in with magic link
     */
    signInWithMagicLink(email: string, options?: {
        redirectTo?: string;
    }): Promise<{
        data: any;
        error: any;
    }>;
    /**
     * Verify OTP for magic link or SMS
     */
    verifyOtp(email: string, token: string, type?: 'signup' | 'magiclink' | 'recovery'): Promise<AuthResponse>;
    /**
     * Get current session from Supabase
     */
    getCurrentSession(): Promise<import("@supabase/supabase-js").AuthSession>;
    /**
     * Check authentication health
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
    }>;
    /**
     * Initialize tenant-specific auth
     */
    initializeTenant(tenantId: string, tenantConfig?: {
        allowedDomains?: string[];
        ssoProviders?: string[];
        passwordPolicy?: any;
    }): Promise<void>;
}
//# sourceMappingURL=auth-service.d.ts.map