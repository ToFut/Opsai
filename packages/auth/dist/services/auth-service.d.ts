import { AuthConfig, LoginCredentials, RegisterData, AuthResponse } from '../types';
export declare class AuthService {
    private supabase;
    private config;
    constructor(config: AuthConfig);
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
}
//# sourceMappingURL=auth-service.d.ts.map