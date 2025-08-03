// SOC 2 Compliant Audit Logger
import { apiLogger } from './logger'

export enum AuditEventType {
  // Authentication Events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  
  // Authorization Events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // Data Operations
  DATA_CREATED = 'DATA_CREATED',
  DATA_READ = 'DATA_READ',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  
  // System Operations
  APP_GENERATED = 'APP_GENERATED',
  APP_DEPLOYED = 'APP_DEPLOYED',
  INTEGRATION_CONFIGURED = 'INTEGRATION_CONFIGURED',
  SCHEMA_MODIFIED = 'SCHEMA_MODIFIED',
  
  // Security Events
  SECURITY_ALERT = 'SECURITY_ALERT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT'
}

interface AuditEvent {
  timestamp: string
  eventType: AuditEventType
  userId?: string
  userEmail?: string
  ipAddress?: string
  resource?: string
  action: string
  result: 'SUCCESS' | 'FAILURE'
  details?: Record<string, any>
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

class AuditLogger {
  // In production, this would write to an immutable audit log service
  async log(event: Partial<AuditEvent>): Promise<void> {
    const auditEvent: AuditEvent = {
      timestamp: new Date().toISOString(),
      result: 'SUCCESS',
      ...event,
      action: event.action || 'UNKNOWN'
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 AUDIT:', JSON.stringify(auditEvent, null, 2))
    }
    
    // In production, send to audit log storage
    if (process.env.NODE_ENV === 'production') {
      await this.sendToAuditService(auditEvent)
    }
    
    // Also log high-risk events to error tracking
    if (auditEvent.riskLevel === 'HIGH' || auditEvent.riskLevel === 'CRITICAL') {
      apiLogger.warn('High risk audit event', auditEvent)
    }
  }
  
  private async sendToAuditService(event: AuditEvent): Promise<void> {
    // TODO: Implement sending to:
    // - Immutable log storage (e.g., AWS CloudTrail, Datadog)
    // - SIEM system
    // - Compliance dashboard
    
    // For now, store in Supabase audit_logs table
    try {
      const { supabase } = await import('./supabase')
      await supabase.from('audit_logs').insert({
        ...event,
        created_at: event.timestamp
      })
    } catch (error) {
      // Never fail the main operation due to audit logging
      apiLogger.error('Failed to write audit log', error)
    }
  }
  
  // Convenience methods for common events
  async logUserAction(
    userId: string,
    userEmail: string,
    action: string,
    resource?: string,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.DATA_UPDATED,
      userId,
      userEmail,
      action,
      resource,
      result: success ? 'SUCCESS' : 'FAILURE'
    })
  }
  
  async logSecurityEvent(
    eventType: AuditEventType,
    details: Record<string, any>,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): Promise<void> {
    await this.log({
      eventType,
      details,
      riskLevel,
      result: 'FAILURE'
    })
  }
}

export const auditLogger = new AuditLogger()

// Export for use in API routes
export function createAuditLog(req: Request, userId?: string, userEmail?: string) {
  return {
    logSuccess: (action: string, resource?: string, details?: any) => 
      auditLogger.log({
        eventType: AuditEventType.DATA_UPDATED,
        userId,
        userEmail,
        action,
        resource,
        details,
        result: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      }),
    
    logFailure: (action: string, resource?: string, details?: any) =>
      auditLogger.log({
        eventType: AuditEventType.ACCESS_DENIED,
        userId,
        userEmail,
        action,
        resource,
        details,
        result: 'FAILURE',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      })
  }
}