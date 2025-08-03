// Common type definitions for the onboarding app

export interface User {
  id: string
  email: string
  created_at?: string
  updated_at?: string
  user_metadata?: UserMetadata
}

export interface UserMetadata {
  firstName?: string
  lastName?: string
  company?: string
  role?: string
  [key: string]: any
}

export interface BusinessProfile {
  industry: string
  businessType: 'b2b' | 'b2c' | 'marketplace' | 'saas' | 'other'
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  description?: string
  primaryGoals?: string[]
  existingTools?: string[]
  revenue?: string
  employees?: string
}

export interface Application {
  id: string
  user_id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'archived'
  created_at: string
  updated_at: string
  metadata?: ApplicationMetadata
  customizations?: Customization[]
  ai_insights?: AIInsight[]
  performance_metrics?: PerformanceMetrics
  security_scores?: SecurityScore
  code_quality?: CodeQuality
}

export interface ApplicationMetadata {
  version?: string
  environment?: 'development' | 'staging' | 'production'
  tags?: string[]
  [key: string]: any
}

export interface Customization {
  id: string
  application_id: string
  type: string
  configuration: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AIInsight {
  id: string
  application_id: string
  type: string
  insight: string
  confidence: number
  created_at: string
}

export interface PerformanceMetrics {
  id: string
  application_id: string
  load_time?: number
  memory_usage?: number
  cpu_usage?: number
  error_rate?: number
  updated_at: string
}

export interface SecurityScore {
  id: string
  application_id: string
  score: number
  vulnerabilities?: Vulnerability[]
  updated_at: string
}

export interface Vulnerability {
  id: string
  security_score_id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  fixed: boolean
}

export interface CodeQuality {
  id: string
  application_id: string
  maintainability_score?: number
  test_coverage?: number
  code_smells?: number
  technical_debt?: number
  updated_at: string
}

export interface OAuthCredentials {
  access_token: string
  refresh_token?: string
  expires_at?: number
  scope?: string
  token_type?: string
}

export interface IntegrationConfig {
  provider: string
  credentials?: OAuthCredentials | Record<string, string>
  settings?: Record<string, any>
  metadata?: Record<string, any>
}