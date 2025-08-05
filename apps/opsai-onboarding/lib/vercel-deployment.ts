import { apiLogger } from './logger'

interface VercelDeployment {
  id: string
  name: string
  url: string
  state: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'CANCELED'
  readyAt?: number
  createdAt: number
  creator: {
    uid: string
    email?: string
    username?: string
  }
}

interface CreateDeploymentRequest {
  name: string
  files: Array<{
    file: string
    data: string | Buffer
  }>
  projectSettings?: {
    framework?: string
    buildCommand?: string
    outputDirectory?: string
    installCommand?: string
    devCommand?: string
  }
  env?: Record<string, string>
  buildEnv?: Record<string, string>
  functions?: Record<string, { runtime: string }>
  routes?: Array<{
    src: string
    dest?: string
    headers?: Record<string, string>
    methods?: string[]
  }>
}

export class VercelClient {
  private baseUrl = 'https://api.vercel.com'
  private token: string
  private teamId?: string

  constructor(token: string, teamId?: string) {
    this.token = token
    this.teamId = teamId
  }

  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    isFormData: boolean = false
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}${this.teamId ? `?teamId=${this.teamId}` : ''}`
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.token}`,
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vercel API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async createDeployment(request: CreateDeploymentRequest): Promise<VercelDeployment> {
    apiLogger.info('Creating Vercel deployment:', request.name)
    
    try {
      // First, create or get the project
      let project
      try {
        project = await this.makeRequest(`/v9/projects/${request.name}`)
      } catch (error) {
        // Project doesn't exist, create it
        project = await this.makeRequest('/v9/projects', 'POST', {
          name: request.name,
          framework: request.projectSettings?.framework || 'nextjs',
          buildCommand: request.projectSettings?.buildCommand || 'next build',
          outputDirectory: request.projectSettings?.outputDirectory || '.next',
          installCommand: request.projectSettings?.installCommand || 'npm install',
          devCommand: request.projectSettings?.devCommand || 'next dev',
          environmentVariables: Object.entries(request.env || {}).map(([key, value]) => ({
            key,
            value,
            target: ['production', 'preview', 'development'],
          })),
        })
      }

      // Prepare files for deployment
      const files = request.files.map(({ file, data }) => ({
        file,
        data: typeof data === 'string' ? data : data.toString('base64'),
        encoding: typeof data === 'string' ? 'utf-8' : 'base64',
      }))

      // Create deployment
      const deployment = await this.makeRequest('/v13/deployments', 'POST', {
        name: request.name,
        files,
        projectId: project.id,
        target: 'production',
        gitSource: {
          type: 'github',
          ref: 'main',
        },
        functions: request.functions || {},
        routes: request.routes || [],
        buildEnv: request.buildEnv || {},
      })

      apiLogger.info(`Vercel deployment created: ${deployment.id}`)
      apiLogger.info(`Deployment URL: ${deployment.url}`)

      // Wait for deployment to be ready
      let status = deployment.state
      let attempts = 0
      const maxAttempts = 60 // 5 minutes with 5 second intervals

      while (status === 'BUILDING' || status === 'QUEUED' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        
        const deploymentStatus = await this.makeRequest(`/v13/deployments/${deployment.id}`)
        status = deploymentStatus.state
        attempts++
        
        apiLogger.info(`Deployment ${deployment.id} status: ${status} (attempt ${attempts}/${maxAttempts})`)
      }

      if (status === 'ERROR') {
        throw new Error('Deployment failed')
      }

      if (status !== 'READY') {
        throw new Error('Deployment timed out')
      }

      return deployment
    } catch (error) {
      apiLogger.error('Failed to create Vercel deployment:', error)
      throw error
    }
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.makeRequest(`/v13/deployments/${deploymentId}`)
  }

  async listDeployments(projectName?: string): Promise<VercelDeployment[]> {
    const endpoint = projectName
      ? `/v6/deployments?projectId=${projectName}`
      : '/v6/deployments'
    
    const response = await this.makeRequest(endpoint)
    return response.deployments
  }

  async deleteDeployment(deploymentId: string): Promise<void> {
    await this.makeRequest(`/v13/deployments/${deploymentId}`, 'DELETE')
  }

  async promoteDeployment(deploymentId: string): Promise<void> {
    await this.makeRequest(`/v13/deployments/${deploymentId}/promote`, 'POST')
  }

  async setEnvironmentVariables(
    projectName: string,
    variables: Record<string, string>
  ): Promise<void> {
    const envVars = Object.entries(variables).map(([key, value]) => ({
      key,
      value,
      target: ['production', 'preview', 'development'],
    }))

    for (const envVar of envVars) {
      await this.makeRequest(`/v10/projects/${projectName}/env`, 'POST', envVar)
    }
  }

  async createDeploymentFromGitHub(
    projectName: string,
    githubRepo: string,
    githubBranch: string = 'main'
  ): Promise<VercelDeployment> {
    apiLogger.info(`Creating Vercel deployment from GitHub: ${githubRepo}`)
    
    // First ensure the project is connected to GitHub
    const project = await this.makeRequest(`/v9/projects/${projectName}`)
    
    if (!project.link) {
      // Link to GitHub repository
      await this.makeRequest(`/v9/projects/${projectName}`, 'PATCH', {
        link: {
          type: 'github',
          repo: githubRepo,
          repoId: await this.getGitHubRepoId(githubRepo),
        },
      })
    }

    // Trigger deployment from GitHub
    const deployment = await this.makeRequest('/v13/deployments', 'POST', {
      name: projectName,
      gitSource: {
        type: 'github',
        repo: githubRepo,
        ref: githubBranch,
      },
    })

    return deployment
  }

  private async getGitHubRepoId(repo: string): Promise<string> {
    // This would typically use GitHub API to get the repo ID
    // For now, we'll use a placeholder
    return `github-repo-${repo.replace('/', '-')}`
  }
}

// Export a singleton instance if token is available
export const vercelClient = process.env.VERCEL_TOKEN
  ? new VercelClient(process.env.VERCEL_TOKEN, process.env.VERCEL_TEAM_ID)
  : null