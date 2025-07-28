"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
const database_1 = require("@opsai/database");
class RBACService {
    /**
     * Create a new role
     */
    async createRole(role) {
        const createdRole = await database_1.prisma.role.create({
            data: {
                name: role.name,
                description: role.description,
                tenantId: role.tenantId
            }
        });
        return {
            ...createdRole,
            permissions: role.permissions
        };
    }
    /**
     * Get user roles and permissions
     */
    async getUserContext(userId, tenantId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const userRoles = await database_1.prisma.userRole.findMany({
            where: {
                userId,
                tenantId
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });
        const roles = userRoles.map((ur) => ({
            ...ur.role,
            permissions: ur.role.permissions.map((rp) => rp.permission)
        }));
        const permissions = roles.flatMap((role) => role.permissions);
        return {
            user: user,
            tenantId: user.tenantId,
            roles: roles,
            permissions: permissions
        };
    }
    /**
     * Check if user has permission
     */
    async hasPermission(userId, tenantId, resource, action) {
        const context = await this.getUserContext(userId, tenantId);
        return context.permissions.some(permission => permission.resource === resource &&
            permission.action === action);
    }
    /**
     * Assign role to user
     */
    async assignRole(userId, roleId, tenantId) {
        return database_1.prisma.userRole.create({
            data: {
                userId,
                roleId,
                tenantId,
                assignedAt: new Date()
            }
        });
    }
    /**
     * Remove role from user
     */
    async removeRole(userId, roleId, tenantId) {
        await database_1.prisma.userRole.deleteMany({
            where: {
                userId,
                roleId,
                tenantId
            }
        });
    }
    /**
     * Get all roles for tenant
     */
    async getRoles(tenantId) {
        const roles = await database_1.prisma.role.findMany({
            where: { tenantId },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
        return roles.map((role) => ({
            ...role,
            permissions: role.permissions.map((rp) => rp.permission)
        }));
    }
    /**
     * Get all permissions for tenant
     */
    async getPermissions(tenantId) {
        return database_1.prisma.permission.findMany({
            where: { tenantId }
        });
    }
}
exports.RBACService = RBACService;
//# sourceMappingURL=rbac-service.js.map