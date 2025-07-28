import { prisma } from '@opsai/database';
import { Role, Permission, UserRole, AuthContext } from '../types';

export class RBACService {
  /**
   * Create a new role
   */
  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const createdRole = await prisma.role.create({
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
  async getUserContext(userId: string, tenantId: string): Promise<AuthContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userRoles = await prisma.userRole.findMany({
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

    const roles = userRoles.map((ur: any) => ({
      ...ur.role,
      permissions: ur.role.permissions.map((rp: any) => rp.permission)
    }));

    const permissions = roles.flatMap((role: any) => role.permissions);

    return {
      user: user as any,
      tenantId: user.tenantId,
      roles: roles as any,
      permissions: permissions as any
    };
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const context = await this.getUserContext(userId, tenantId);

    return context.permissions.some(permission =>
      permission.resource === resource &&
      permission.action === action
    );
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, tenantId: string): Promise<UserRole> {
    return prisma.userRole.create({
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
  async removeRole(userId: string, roleId: string, tenantId: string): Promise<void> {
    await prisma.userRole.deleteMany({
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
  async getRoles(tenantId: string): Promise<Role[]> {
    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return roles.map((role: any) => ({
      ...role,
      permissions: role.permissions.map((rp: any) => rp.permission)
    }));
  }

  /**
   * Get all permissions for tenant
   */
  async getPermissions(tenantId: string): Promise<Permission[]> {
    return prisma.permission.findMany({
      where: { tenantId }
    }) as any;
  }
} 