"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const database_1 = require("@opsai/database");
class SessionService {
    /**
     * Create a new session
     */
    async createSession(userId, tenantId, token, expiresAt) {
        return database_1.prisma.session.create({
            data: {
                userId,
                tenantId,
                token,
                expiresAt,
                isActive: true
            }
        });
    }
    /**
     * Get active session for user
     */
    async getActiveSession(userId, tenantId) {
        return database_1.prisma.session.findFirst({
            where: {
                userId,
                tenantId,
                isActive: true,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
    }
    /**
     * Validate session
     */
    async validateSession(sessionId) {
        const session = await database_1.prisma.session.findUnique({
            where: { id: sessionId }
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return null;
        }
        return session;
    }
    /**
     * Deactivate session
     */
    async deactivateSession(sessionId) {
        await database_1.prisma.session.update({
            where: { id: sessionId },
            data: { isActive: false }
        });
    }
    /**
     * Deactivate all sessions for user
     */
    async deactivateAllSessions(userId, tenantId) {
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
    }
    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        const result = await database_1.prisma.session.updateMany({
            where: {
                expiresAt: {
                    lt: new Date()
                },
                isActive: true
            },
            data: {
                isActive: false
            }
        });
        return result.count;
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session-service.js.map