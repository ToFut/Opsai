import { User, Session } from '@opsai/shared';
export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey: string;
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
    tenantId: string;
    role?: string;
}
export interface AuthResponse {
    user: User;
    session: Session;
    accessToken: string;
    refreshToken: string;
}
export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'execute';
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserRole {
    userId: string;
    roleId: string;
    tenantId: string;
    assignedAt: Date;
}
export interface AuthContext {
    user: User;
    tenantId: string;
    roles: Role[];
    permissions: Permission[];
}
export interface TokenPayload {
    userId: string;
    tenantId: string;
    email: string;
    roles: string[];
    permissions: string[];
    iat: number;
    exp: number;
}
//# sourceMappingURL=index.d.ts.map