import { Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac-service';
import { AuthenticatedRequest } from './auth-middleware';
export declare class RBACMiddleware {
    private rbacService;
    constructor(rbacService: RBACService);
    /**
     * Require specific role
     */
    requireRole: (role: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require specific permission
     */
    requirePermission: (resource: string, action: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require any of the specified roles
     */
    requireAnyRole: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require all of the specified permissions
     */
    requireAllPermissions: (permissions: Array<{
        resource: string;
        action: string;
    }>) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=rbac-middleware.d.ts.map