"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@opsai/database");
class AuthService {
    constructor(config) {
        this.config = config;
        this.supabase = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseAnonKey);
    }
    /**
     * Register a new user
     */
    async register(data) {
        // Create user in Supabase
        const { data: authData, error } = await this.supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.firstName,
                    last_name: data.lastName,
                    tenant_id: data.tenantId,
                    role: data.role || 'user'
                }
            }
        });
        if (error) {
            throw new Error(`Registration failed: ${error.message}`);
        }
        if (!authData.user) {
            throw new Error('User creation failed');
        }
        // Create user record in our database
        const user = await database_1.prisma.user.create({
            data: {
                id: authData.user.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                tenantId: data.tenantId,
                role: data.role || 'user',
                isActive: true
            }
        });
        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        // Create session
        const session = await database_1.prisma.session.create({
            data: {
                userId: user.id,
                tenantId: data.tenantId,
                token: accessToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                isActive: true
            }
        });
        return {
            user: user,
            session: session,
            accessToken,
            refreshToken
        };
    }
    /**
     * Login user
     */
    async login(credentials) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });
        if (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
        if (!data.user) {
            throw new Error('User not found');
        }
        // Get user from our database
        const user = await database_1.prisma.user.findUnique({
            where: { id: data.user.id }
        });
        if (!user) {
            throw new Error('User not found in database');
        }
        if (!user.isActive) {
            throw new Error('User account is deactivated');
        }
        // Verify tenant access if specified
        if (credentials.tenantId && user.tenantId !== credentials.tenantId) {
            throw new Error('User does not have access to this tenant');
        }
        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        // Create or update session
        const session = await database_1.prisma.session.upsert({
            where: {
                userId_tenantId: {
                    userId: user.id,
                    tenantId: user.tenantId
                }
            },
            update: {
                token: accessToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                isActive: true
            },
            create: {
                userId: user.id,
                tenantId: user.tenantId,
                token: accessToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                isActive: true
            }
        });
        return {
            user: user,
            session: session,
            accessToken,
            refreshToken
        };
    }
    /**
     * Logout user
     */
    async logout(userId, tenantId) {
        // Deactivate session
        await database_1.prisma.session.updateMany({
            where: {
                userId,
                tenantId,
                isActive: true
            },
            data: {
                isActive: false
            }
        });
        // Sign out from Supabase
        await this.supabase.auth.signOut();
    }
    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, this.config.jwtSecret);
            const user = await database_1.prisma.user.findUnique({
                where: { id: payload.userId }
            });
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }
            const accessToken = this.generateAccessToken(user);
            return { accessToken };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    /**
     * Generate access token
     */
    generateAccessToken(user) {
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            roles: [user.role],
            permissions: [], // Will be populated by RBAC service
            iat: Date.now(),
            exp: Date.now() + 15 * 60 * 1000 // 15 minutes
        };
        return jsonwebtoken_1.default.sign(payload, this.config.jwtSecret);
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            roles: [user.role],
            permissions: [],
            iat: Date.now(),
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        return jsonwebtoken_1.default.sign(payload, this.config.jwtSecret);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map