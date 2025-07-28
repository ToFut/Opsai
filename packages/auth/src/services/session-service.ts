import { prisma } from '@opsai/database';
import { Session } from '@opsai/shared';

export class SessionService {
  /**
   * Create a new session
   */
  async createSession(userId: string, tenantId: string, token: string, expiresAt: Date): Promise<Session> {
    return prisma.session.create({
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
  async getActiveSession(userId: string, tenantId: string): Promise<Session | null> {
    return prisma.session.findFirst({
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
  async validateSession(sessionId: string): Promise<Session | null> {
    const session = await prisma.session.findUnique({
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
  async deactivateSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
  }

  /**
   * Deactivate all sessions for user
   */
  async deactivateAllSessions(userId: string, tenantId: string): Promise<void> {
    await prisma.session.updateMany({
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
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.updateMany({
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