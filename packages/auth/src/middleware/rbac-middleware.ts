import { Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac-service';
import { AuthenticatedRequest } from './auth-middleware';

export class RBACMiddleware {
  private rbacService: RBACService;

  constructor(rbacService: RBACService) {
    this.rbacService = rbacService;
  }

  /**
   * Require specific role
   */
  requireRole = (role: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      try {
        const context = await this.rbacService.getUserContext(req.user.userId, req.user.tenantId);
        const hasRole = context.roles.some(r => r.name === role);

        if (!hasRole) {
          res.status(403).json({ error: `Role '${role}' required` });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Failed to check role' });
        return;
      }
    };
  };

  /**
   * Require specific permission
   */
  requirePermission = (resource: string, action: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      try {
        const hasPermission = await this.rbacService.hasPermission(
          req.user.userId,
          req.user.tenantId,
          resource,
          action
        );

        if (!hasPermission) {
          res.status(403).json({
            error: `Permission '${action}' on '${resource}' required`
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Failed to check permission' });
        return;
      }
    };
  };

  /**
   * Require any of the specified roles
   */
  requireAnyRole = (roles: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      try {
        const context = await this.rbacService.getUserContext(req.user.userId, req.user.tenantId);
        const hasAnyRole = context.roles.some(r => roles.includes(r.name));

        if (!hasAnyRole) {
          res.status(403).json({
            error: `One of the following roles required: ${roles.join(', ')}`
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Failed to check roles' });
        return;
      }
    };
  };

  /**
   * Require all of the specified permissions
   */
  requireAllPermissions = (permissions: Array<{ resource: string; action: string }>) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      try {
        for (const permission of permissions) {
          const hasPermission = await this.rbacService.hasPermission(
            req.user.userId,
            req.user.tenantId,
            permission.resource,
            permission.action
          );

          if (!hasPermission) {
            res.status(403).json({
              error: `Permission '${permission.action}' on '${permission.resource}' required`
            });
            return;
          }
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Failed to check permissions' });
        return;
      }
    };
  };
} 