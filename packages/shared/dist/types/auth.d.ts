export interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    role: string;
    tenantId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    settings: TenantSettings;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface TenantSettings {
    theme: {
        primaryColor: string;
        secondaryColor: string;
        logo?: string;
    };
    features: string[];
    integrations: Record<string, any>;
    limits: {
        users: number;
        storage: number;
        apiCalls: number;
    };
}
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';
export interface Permission {
    resource: string;
    action: string;
    conditions?: Record<string, any>;
}
export interface Role {
    name: string;
    permissions: Permission[];
    description?: string;
}
export interface Session {
    id: string;
    userId: string;
    tenantId: string;
    token: string;
    expiresAt: Date;
    isActive: boolean;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthToken {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    tokenType: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
    tenantId?: string;
}
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantName: string;
    tenantSlug: string;
}
export interface PasswordReset {
    email: string;
    token: string;
    newPassword: string;
}
//# sourceMappingURL=auth.d.ts.map