import { Role, Permission, UserRole, AuthContext } from '../types';
export declare class RBACService {
    /**
     * Create a new role
     */
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role>;
    /**
     * Get user roles and permissions
     */
    getUserContext(userId: string, tenantId: string): Promise<AuthContext>;
    /**
     * Check if user has permission
     */
    hasPermission(userId: string, tenantId: string, resource: string, action: string): Promise<boolean>;
    /**
     * Assign role to user
     */
    assignRole(userId: string, roleId: string, tenantId: string): Promise<UserRole>;
    /**
     * Remove role from user
     */
    removeRole(userId: string, roleId: string, tenantId: string): Promise<void>;
    /**
     * Get all roles for tenant
     */
    getRoles(tenantId: string): Promise<Role[]>;
    /**
     * Get all permissions for tenant
     */
    getPermissions(tenantId: string): Promise<Permission[]>;
}
//# sourceMappingURL=rbac-service.d.ts.map