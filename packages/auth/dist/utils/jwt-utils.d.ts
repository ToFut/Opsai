import { TokenPayload } from '../types';
export declare class JWTUtils {
    private secret;
    constructor(secret: string);
    /**
     * Generate access token
     */
    generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
    /**
     * Generate refresh token
     */
    generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
    /**
     * Verify token
     */
    verifyToken(token: string): TokenPayload;
    /**
     * Decode token without verification
     */
    decodeToken(token: string): TokenPayload | null;
    /**
     * Check if token is expired
     */
    isTokenExpired(token: string): boolean;
    /**
     * Get token expiration time
     */
    getTokenExpiration(token: string): Date | null;
}
//# sourceMappingURL=jwt-utils.d.ts.map