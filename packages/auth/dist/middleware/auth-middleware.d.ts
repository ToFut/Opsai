import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth-service';
import { TokenPayload } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
    tenantId?: string;
}
export declare class AuthMiddleware {
    private authService;
    constructor(authService: AuthService);
    /**
     * Verify JWT token middleware
     */
    authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Optional authentication middleware
     */
    optionalAuth: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
    /**
     * Require specific role middleware
     */
    requireRole: (role: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require specific permission middleware
     */
    requirePermission: (resource: string, action: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=auth-middleware.d.ts.map