"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthMiddleware {
    constructor(authService) {
        /**
         * Verify JWT token middleware
         */
        this.authenticateToken = (req, res, next) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
            if (!token) {
                res.status(401).json({ error: 'Access token required' });
                return;
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                req.tenantId = decoded.tenantId;
                next();
            }
            catch (error) {
                res.status(403).json({ error: 'Invalid or expired token' });
                return;
            }
        };
        /**
         * Optional authentication middleware
         */
        this.optionalAuth = (req, _res, next) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token) {
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                    req.user = decoded;
                    req.tenantId = decoded.tenantId;
                }
                catch (error) {
                    // Token is invalid, but we continue without authentication
                }
            }
            next();
        };
        /**
         * Require specific role middleware
         */
        this.requireRole = (role) => {
            return (req, res, next) => {
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
        this.requirePermission = (resource, action) => {
            return (req, res, next) => {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const hasPermission = req.user.permissions.some(permission => permission === `${resource}:${action}`);
                if (!hasPermission) {
                    res.status(403).json({
                        error: `Permission '${action}' on '${resource}' required`
                    });
                    return;
                }
                next();
            };
        };
        this.authService = authService;
    }
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=auth-middleware.js.map