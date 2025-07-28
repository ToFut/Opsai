import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth-service';
import { TokenPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  tenantId?: string;
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Verify JWT token middleware
   */
  authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      req.user = decoded;
      req.tenantId = decoded.tenantId;
      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
  };

  /**
   * Optional authentication middleware
   */
  optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        req.user = decoded;
        req.tenantId = decoded.tenantId;
      } catch (error) {
        // Token is invalid, but we continue without authentication
      }
    }

    next();
  };

  /**
   * Require specific role middleware
   */
  requireRole = (role: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!req.user.roles.includes(role)) {
        res.status(403).json({ error: `Role '${role}' required` });
        return;
      }

      next();
    };
  };

  /**
   * Require specific permission middleware
   */
  requirePermission = (resource: string, action: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const hasPermission = req.user.permissions.some(
        permission => permission === `${resource}:${action}`
      );

      if (!hasPermission) {
        res.status(403).json({
          error: `Permission '${action}' on '${resource}' required`
        });
        return;
      }

      next();
    };
  };
} 