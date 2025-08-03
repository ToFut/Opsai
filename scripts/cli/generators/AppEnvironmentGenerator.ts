import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

export class AppEnvironmentGenerator {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Generate .env file for a specific tenant's app
   * Each app gets its own isolated environment
   */
  async generateAppEnvironment(tenantId: string, appDir: string): Promise<void> {
    console.log(`🔐 Generating environment configuration for tenant: ${tenantId}`)

    // Fetch tenant's connected integrations
    const { data: integrations } = await this.supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'connected')

    // Fetch tenant's Airbyte connections
    const { data: airbyteConnections } = await this.supabase
      .from('tenant_airbyte_connections')
      .select('*')
      .eq('tenant_id', tenantId)

    // Generate unique database for this tenant
    const dbConfig = await this.createTenantDatabase(tenantId)

    // Generate environment variables
    const envVars = {
      // App identification
      TENANT_ID: tenantId,
      APP_NAME: `opsai-app-${tenantId}`,
      NODE_ENV: 'production',

      // Database (tenant-specific)
      DATABASE_URL: dbConfig.url,
      DATABASE_SCHEMA: `tenant_${tenantId}`,

      // Supabase (shared platform, but tenant-scoped)
      NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // Airbyte connections (read-only access to synced data)
      AIRBYTE_WORKSPACE_ID: `tenant_${tenantId}_workspace`,
      
      // Redis (tenant namespace)
      REDIS_URL: process.env.REDIS_URL,
      REDIS_NAMESPACE: `tenant:${tenantId}`,

      // File storage (tenant bucket)
      STORAGE_BUCKET: `tenant-${tenantId}-files`,

      // Security
      JWT_SECRET: this.generateSecureKey(),
      ENCRYPTION_KEY: this.generateSecureKey(),
      
      // Deployment
      VERCEL_PROJECT_ID: `opsai-${tenantId}`,
      
      // Features based on connected integrations
      ...this.getIntegrationFeatures(integrations),

      // Monitoring (tenant-specific dashboard)
      SENTRY_DSN: await this.createSentryProject(tenantId),
      ANALYTICS_ID: await this.createAnalyticsProperty(tenantId)
    }

    // Write .env file
    const envContent = this.formatEnvFile(envVars)
    fs.writeFileSync(path.join(appDir, '.env'), envContent)
    
    // Write .env.local for local development
    fs.writeFileSync(path.join(appDir, '.env.local'), envContent)
    
    // Write .env.example (without sensitive values)
    const exampleContent = this.formatEnvExample(envVars)
    fs.writeFileSync(path.join(appDir, '.env.example'), exampleContent)

    console.log('✅ Environment configuration generated')
  }

  private async createTenantDatabase(tenantId: string): Promise<{ url: string }> {
    // In production, you'd create an actual database/schema
    // For now, we'll use schema isolation
    const baseUrl = process.env.DATABASE_URL!
    const tenantUrl = baseUrl.includes('?') 
      ? `${baseUrl}&schema=tenant_${tenantId}`
      : `${baseUrl}?schema=tenant_${tenantId}`

    return { url: tenantUrl }
  }

  private getIntegrationFeatures(integrations: any[]): Record<string, string> {
    const features: Record<string, string> = {}

    integrations.forEach(integration => {
      switch (integration.provider) {
        case 'stripe':
          features.STRIPE_ENABLED = 'true'
          features.PAYMENT_PROVIDER = 'stripe'
          break
        case 'sendgrid':
        case 'mailchimp':
          features.EMAIL_ENABLED = 'true'
          features.EMAIL_PROVIDER = integration.provider
          break
        case 'slack':
          features.SLACK_ENABLED = 'true'
          features.NOTIFICATION_CHANNEL = 'slack'
          break
        case 'twilio':
          features.SMS_ENABLED = 'true'
          features.SMS_PROVIDER = 'twilio'
          break
      }
    })

    return features
  }

  private generateSecureKey(): string {
    // Generate a secure random key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < 64; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }

  private async createSentryProject(tenantId: string): Promise<string> {
    // In production, create actual Sentry project via API
    // For now, return a placeholder
    return `https://example@sentry.io/tenant-${tenantId}`
  }

  private async createAnalyticsProperty(tenantId: string): Promise<string> {
    // In production, create analytics property
    // For now, return a placeholder
    return `G-TENANT${tenantId.toUpperCase()}`
  }

  private formatEnvFile(vars: Record<string, any>): string {
    return Object.entries(vars)
      .map(([key, value]) => {
        // Quote values that contain spaces or special characters
        const needsQuotes = typeof value === 'string' && 
                          (value.includes(' ') || value.includes('=') || value.includes('"'))
        const formattedValue = needsQuotes ? `"${value}"` : value
        return `${key}=${formattedValue}`
      })
      .join('\n')
  }

  private formatEnvExample(vars: Record<string, any>): string {
    const sensitiveKeys = ['JWT_SECRET', 'ENCRYPTION_KEY', 'DATABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    
    return Object.entries(vars)
      .map(([key, value]) => {
        const exampleValue = sensitiveKeys.includes(key) 
          ? 'your-' + key.toLowerCase().replace(/_/g, '-')
          : value
        return `${key}=${exampleValue}`
      })
      .join('\n')
  }
}

/**
 * Example generated .env for a tenant app:
 * 
 * TENANT_ID=tenant_abc123
 * APP_NAME=opsai-app-tenant_abc123
 * NODE_ENV=production
 * 
 * # Database (isolated for this tenant)
 * DATABASE_URL=postgresql://user:pass@host:5432/db?schema=tenant_abc123
 * DATABASE_SCHEMA=tenant_abc123
 * 
 * # Supabase (platform services)
 * NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
 * 
 * # Features (based on connected integrations)
 * STRIPE_ENABLED=true
 * EMAIL_ENABLED=true
 * SLACK_ENABLED=true
 * 
 * # Security (unique per app)
 * JWT_SECRET=xxx
 * ENCRYPTION_KEY=xxx
 */