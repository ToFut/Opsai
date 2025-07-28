import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';

export class JWTUtils {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: '15m'
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: '7d'
    });
  }

  /**
   * Verify token
   */
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }

  /**
   * Decode token without verification
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }
} 