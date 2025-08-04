
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class AuditService {
  static async logSystemEvent(data: {
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
    message: string
    source: string
    context?: any
    userId?: string
    requestId?: string
    
  }) {
    try {
      await prisma.systemLog.create({
        data: {
          ...data,
          context: data.context ? JSON.stringify(data.context) : null
        }
      })
    } catch (error) {
      console.error('Failed to log system event:', error)
    }
  }

  static async logSecurityEvent(data: {
    eventType: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: any
    
  }) {
    try {
      await prisma.securityEvent.create({
        data: {
          ...data,
          details: data.details ? JSON.stringify(data.details) : null
        }
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  static async getAuditTrail(tableName: string, recordId: string) {
    return await prisma.auditLog.findMany({
      where: {
        tableName,
        recordId
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
  }

  static async getSecurityAlerts(severity?: string) {
    return await prisma.securityEvent.findMany({
      where: {
        resolved: false,
        ...(severity && { severity })
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
  }

  static async resolveSecurityEvent(id: string, resolvedBy: string) {
    return await prisma.securityEvent.update({
      where: { id },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date()
      }
    })
  }
}
