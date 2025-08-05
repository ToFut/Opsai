import { apiLogger } from './logger'

interface SupabaseProject {
  id: string
  name: string
  url: string
  anonKey: string
  serviceKey: string
  databaseUrl: string
  region: string
  organizationId: string
}

interface CreateProjectRequest {
  name: string
  organizationId: string
  region?: string
  plan?: 'free' | 'pro' | 'team' | 'enterprise'
  databasePassword: string
}

export class SupabaseManagementClient {
  private baseUrl = 'https://api.supabase.com/v1'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Supabase Management API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async createProject(request: CreateProjectRequest): Promise<SupabaseProject> {
    apiLogger.info('Creating Supabase project:', request.name)
    
    try {
      // Create the project
      const project = await this.makeRequest('/projects', 'POST', {
        name: request.name,
        organization_id: request.organizationId,
        region: request.region || 'us-east-1',
        plan: request.plan || 'free',
        database_password: request.databasePassword,
      })

      // Wait for project to be ready (this can take a few minutes)
      let status = 'creating'
      let attempts = 0
      const maxAttempts = 60 // 5 minutes with 5 second intervals

      while (status !== 'active' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        
        const projectStatus = await this.makeRequest(`/projects/${project.id}`)
        status = projectStatus.status
        attempts++
        
        apiLogger.info(`Project ${project.id} status: ${status} (attempt ${attempts}/${maxAttempts})`)
      }

      if (status !== 'active') {
        throw new Error('Project creation timed out')
      }

      // Get project details including keys
      const projectDetails = await this.makeRequest(`/projects/${project.id}`)
      
      return {
        id: projectDetails.id,
        name: projectDetails.name,
        url: `https://${projectDetails.ref}.supabase.co`,
        anonKey: projectDetails.anon_key,
        serviceKey: projectDetails.service_role_key,
        databaseUrl: projectDetails.database_url,
        region: projectDetails.region,
        organizationId: projectDetails.organization_id,
      }
    } catch (error) {
      apiLogger.error('Failed to create Supabase project:', error)
      throw error
    }
  }

  async getProject(projectId: string): Promise<SupabaseProject> {
    const project = await this.makeRequest(`/projects/${projectId}`)
    
    return {
      id: project.id,
      name: project.name,
      url: `https://${project.ref}.supabase.co`,
      anonKey: project.anon_key,
      serviceKey: project.service_role_key,
      databaseUrl: project.database_url,
      region: project.region,
      organizationId: project.organization_id,
    }
  }

  async listProjects(organizationId: string): Promise<SupabaseProject[]> {
    const projects = await this.makeRequest(`/projects?organization_id=${organizationId}`)
    
    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      url: `https://${project.ref}.supabase.co`,
      anonKey: project.anon_key,
      serviceKey: project.service_role_key,
      databaseUrl: project.database_url,
      region: project.region,
      organizationId: project.organization_id,
    }))
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.makeRequest(`/projects/${projectId}`, 'DELETE')
  }

  async runMigrations(projectId: string, sql: string): Promise<void> {
    apiLogger.info(`Running migrations for project ${projectId}`)
    
    // Use the SQL editor API to run migrations
    await this.makeRequest(`/projects/${projectId}/database/query`, 'POST', {
      query: sql,
    })
  }
}

// Export a singleton instance if API key is available
export const supabaseManagement = process.env.SUPABASE_MANAGEMENT_API_KEY
  ? new SupabaseManagementClient(process.env.SUPABASE_MANAGEMENT_API_KEY)
  : null