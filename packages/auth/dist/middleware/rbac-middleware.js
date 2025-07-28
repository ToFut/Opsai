"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACMiddleware = void 0;
class RBACMiddleware {
    constructor(rbacService) {
        /**
         * Require specific role
         */
        this.requireRole = (role) => {
            return async (req, res, next) => {
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
                }
                catch (error) {
                    res.status(500).json({ error: 'Failed to check role' });
                    return;
                }
            };
        };
        /**
         * Require specific permission
         */
        this.requirePermission = (resource, action) => {
            return async (req, res, next) => {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                try {
                    const hasPermission = await this.rbacService.hasPermission(req.user.userId, req.user.tenantId, resource, action);
                    if (!hasPermission) {
                        res.status(403).json({
                            error: `Permission '${action}' on '${resource}' required`
                        });
                        return;
                    }
                    next();
                }
                catch (error) {
                    res.status(500).json({ error: 'Failed to check permission' });
                    return;
                }
            };
        };
        /**
         * Require any of the specified roles
         */
        this.requireAnyRole = (roles) => {
            return async (req, res, next) => {
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
                }
                catch (error) {
                    res.status(500).json({ error: 'Failed to check roles' });
                    return;
                }
            };
        };
        /**
         * Require all of the specified permissions
         */
        this.requireAllPermissions = (permissions) => {
            return async (req, res, next) => {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                try {
                    for (const permission of permissions) {
                        const hasPermission = await this.rbacService.hasPermission(req.user.userId, req.user.tenantId, permission.resource, permission.action);
                        if (!hasPermission) {
                            res.status(403).json({
                                error: `Permission '${permission.action}' on '${permission.resource}' required`
                            });
                            return;
                        }
                    }
                    next();
                }
                catch (error) {
                    res.status(500).json({ error: 'Failed to check permissions' });
                    return;
                }
            };
        };
        this.rbacService = rbacService;
    }
}
exports.RBACMiddleware = RBACMiddleware;
//# sourceMappingURL=rbac-middleware.js.map