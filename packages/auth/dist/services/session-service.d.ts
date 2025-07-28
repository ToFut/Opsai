import { Session } from '@opsai/shared';
export declare class SessionService {
    /**
     * Create a new session
     */
    createSession(userId: string, tenantId: string, token: string, expiresAt: Date): Promise<Session>;
    /**
     * Get active session for user
     */
    getActiveSession(userId: string, tenantId: string): Promise<Session | null>;
    /**
     * Validate session
     */
    validateSession(sessionId: string): Promise<Session | null>;
    /**
     * Deactivate session
     */
    deactivateSession(sessionId: string): Promise<void>;
    /**
     * Deactivate all sessions for user
     */
    deactivateAllSessions(userId: string, tenantId: string): Promise<void>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
}
//# sourceMappingURL=session-service.d.ts.map