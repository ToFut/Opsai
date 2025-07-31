export interface YamlConfig {
  vertical: {
    name: string
    description: string
    industry: string
  }
  business: {
    name: string
    type: string
  }
  database: {
    models: Array<{
      name: string
      fields: Array<{
        name: string
        type: string
        required: boolean
        unique?: boolean
      }>
    }>
  }
  apis: {
    integrations: Array<{
      name: string
      enabled: boolean
    }>
  }
  workflows: Array<{
    name: string
    description: string
  }>
  ui: {
    pages: Array<{
      name: string
      path: string
      components: Array<{
        type: string
        dataSource: string
        actions?: string[]
        mode?: string
      }>
    }>
  }
}

export interface AppConfig {
  name: string
  version: string
  description: string
  framework: 'nextjs' | 'react' | 'vue' | 'angular'
  database: 'prisma' | 'typeorm' | 'sequelize'
  authentication: 'supabase' | 'auth0' | 'firebase' | 'custom'
  deployment: 'vercel' | 'netlify' | 'aws' | 'docker'
  features: string[]
  integrations: string[]
}

export interface GenerationOptions {
  outputDir: string
  template?: string
  overwrite?: boolean
  installDeps?: boolean
  startApp?: boolean
  port?: number
}

export interface ValidationResult {
  success: boolean
  errors?: string[]
  warnings?: string[]
  data?: any
} 