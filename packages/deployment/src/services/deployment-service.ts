import { CloudflareAPI } from './cloudflare-api'
import { VercelAPI } from './vercel-api'
import { TerraformService } from './terraform-service'
import { prisma } from '@opsai/database'

export interface DeploymentConfig {
  id: string
  tenantId: string
  appName: string
  platform: 'vercel' | 'netlify' | 'aws' | 'gcp' | 'azure'
  customDomain?: string
  environment: 'development' | 'staging' | 'production'
  autoDeploy: boolean
  sslEnabled: boolean
  cdnEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DeploymentStatus {
  id: string
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed'
  url?: string
  customDomain?: string
  sslStatus?: 'pending' | 'active' | 'failed'
  cdnStatus?: 'pending' | 'active' | 'failed'
  logs?: string[]
  createdAt: Date
  completedAt?: Date
}

export interface DomainConfig {
  domain: string
  sslCertificate?: string
  dnsRecords: DNSRecord[]
  status: 'pending' | 'active' | 'failed'
  verifiedAt?: Date
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT' | 'MX'
  name: string
  value: string
  ttl: number
  priority?: number
}

export class DeploymentService {
  private cloudflareAPI: CloudflareAPI
  private vercelAPI: VercelAPI
  private terraformService: TerraformService

  constructor() {
    this.cloudflareAPI = new CloudflareAPI()
    this.vercelAPI = new VercelAPI()
    this.terraformService = new TerraformService()
  }

  /**
   * Create deployment configuration
   */
  async createDeployment(
    tenantId: string,
    appName: string,
    platform: string,
    options?: {
      customDomain?: string
      environment?: string
      autoDeploy?: boolean
      sslEnabled?: boolean
      cdnEnabled?: boolean
    }
  ): Promise<DeploymentConfig> {
    try {
      const deployment = await prisma.deployment.create({
        data: {
          tenantId,
          appName,
          platform: platform as any,
          customDomain: options?.customDomain,
          environment: (options?.environment || 'development') as any,
          autoDeploy: options?.autoDeploy ?? true,
          sslEnabled: options?.sslEnabled ?? true,
          cdnEnabled: options?.cdnEnabled ?? true
        }
      })

      return this.mapDeploymentToConfig(deployment)
    } catch (error) {
      console.error('Create deployment error:', error)
      throw new Error('Failed to create deployment configuration')
    }
  }

  /**
   * Deploy application
   */
  async deployApplication(
    deploymentId: string,
    buildPath: string
  ): Promise<DeploymentStatus> {
    try {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId }
      })

      if (!deployment) {
        throw new Error('Deployment configuration not found')
      }

      // Create deployment status
      const status = await prisma.deploymentStatus.create({
        data: {
          deploymentId,
          status: 'pending',
          logs: ['Deployment started']
        }
      })

      try {
        // Deploy based on platform
        let deployResult: any

        switch (deployment.platform) {
          case 'vercel':
            deployResult = await this.deployToVercel(deployment, buildPath)
            break
          case 'netlify':
            deployResult = await this.deployToNetlify(deployment, buildPath)
            break
          case 'aws':
            deployResult = await this.deployToAWS(deployment, buildPath)
            break
          default:
            throw new Error(`Unsupported platform: ${deployment.platform}`)
        }

        // Update deployment status
        await prisma.deploymentStatus.update({
          where: { id: status.id },
          data: {
            status: 'success',
            url: deployResult.url,
            completedAt: new Date(),
            logs: [...(status.logs || []), 'Deployment completed successfully']
          }
        })

        // Configure custom domain if specified
        if (deployment.customDomain) {
          await this.configureCustomDomain(deployment, deployResult.url)
        }

        return this.mapStatusToDeploymentStatus({
          ...status,
          status: 'success',
          url: deployResult.url,
          completedAt: new Date()
        })
      } catch (error) {
        // Update deployment status to failed
        await prisma.deploymentStatus.update({
          where: { id: status.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            logs: [...(status.logs || []), `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
          }
        })

        throw error
      }
    } catch (error) {
      console.error('Deploy application error:', error)
      throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deploy to Vercel
   */
  private async deployToVercel(deployment: any, buildPath: string): Promise<{ url: string }> {
    try {
      const result = await this.vercelAPI.deploy({
        name: deployment.appName,
        files: buildPath,
        projectSettings: {
          framework: 'nextjs',
          buildCommand: 'npm run build',
          outputDirectory: '.next',
          installCommand: 'npm install'
        }
      })

      return { url: result.url }
    } catch (error) {
      console.error('Vercel deployment error:', error)
      throw new Error('Vercel deployment failed')
    }
  }

  /**
   * Deploy to Netlify
   */
  private async deployToNetlify(deployment: any, buildPath: string): Promise<{ url: string }> {
    // Implement Netlify deployment
    throw new Error('Netlify deployment not implemented yet')
  }

  /**
   * Deploy to AWS
   */
  private async deployToAWS(deployment: any, buildPath: string): Promise<{ url: string }> {
    try {
      const result = await this.terraformService.deploy({
        platform: 'aws',
        appName: deployment.appName,
        buildPath,
        customDomain: deployment.customDomain,
        sslEnabled: deployment.sslEnabled,
        cdnEnabled: deployment.cdnEnabled
      })

      return { url: result.url }
    } catch (error) {
      console.error('AWS deployment error:', error)
      throw new Error('AWS deployment failed')
    }
  }

  /**
   * Configure custom domain
   */
  private async configureCustomDomain(deployment: any, appUrl: string): Promise<void> {
    try {
      if (!deployment.customDomain) {
        return
      }

      // Create domain configuration
      const domainConfig = await prisma.domainConfig.create({
        data: {
          deploymentId: deployment.id,
          domain: deployment.customDomain,
          status: 'pending'
        }
      })

      // Configure DNS records
      const dnsRecords = await this.configureDNS(deployment.customDomain, appUrl)

      // Update domain configuration
      await prisma.domainConfig.update({
        where: { id: domainConfig.id },
        data: {
          dnsRecords,
          status: 'active',
          verifiedAt: new Date()
        }
      })

      // Configure SSL certificate
      if (deployment.sslEnabled) {
        await this.configureSSL(deployment.customDomain)
      }

      // Configure CDN
      if (deployment.cdnEnabled) {
        await this.configureCDN(deployment.customDomain, appUrl)
      }
    } catch (error) {
      console.error('Configure custom domain error:', error)
      throw new Error('Custom domain configuration failed')
    }
  }

  /**
   * Configure DNS records
   */
  private async configureDNS(domain: string, appUrl: string): Promise<DNSRecord[]> {
    try {
      const dnsRecords: DNSRecord[] = []

      // Add CNAME record for subdomain
      if (domain.includes('.')) {
        const subdomain = domain.split('.')[0]
        const rootDomain = domain.split('.').slice(1).join('.')

        dnsRecords.push({
          type: 'CNAME',
          name: subdomain,
          value: appUrl,
          ttl: 300
        })

        // Add TXT record for verification
        dnsRecords.push({
          type: 'TXT',
          name: `_vercel.${subdomain}`,
          value: 'vercel-verification',
          ttl: 300
        })
      } else {
        // Root domain - add A record
        dnsRecords.push({
          type: 'A',
          name: '@',
          value: appUrl,
          ttl: 300
        })
      }

      // Configure DNS through Cloudflare
      await this.cloudflareAPI.configureDNS(domain, dnsRecords)

      return dnsRecords
    } catch (error) {
      console.error('Configure DNS error:', error)
      throw new Error('DNS configuration failed')
    }
  }

  /**
   * Configure SSL certificate
   */
  private async configureSSL(domain: string): Promise<void> {
    try {
      // Request SSL certificate through Cloudflare
      await this.cloudflareAPI.requestSSLCertificate(domain)
    } catch (error) {
      console.error('Configure SSL error:', error)
      throw new Error('SSL configuration failed')
    }
  }

  /**
   * Configure CDN
   */
  private async configureCDN(domain: string, originUrl: string): Promise<void> {
    try {
      // Configure CDN through Cloudflare
      await this.cloudflareAPI.configureCDN(domain, originUrl)
    } catch (error) {
      console.error('Configure CDN error:', error)
      throw new Error('CDN configuration failed')
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus | null> {
    try {
      const status = await prisma.deploymentStatus.findFirst({
        where: { deploymentId },
        orderBy: { createdAt: 'desc' }
      })

      return status ? this.mapStatusToDeploymentStatus(status) : null
    } catch (error) {
      console.error('Get deployment status error:', error)
      throw new Error('Failed to get deployment status')
    }
  }

  /**
   * Get deployment configuration
   */
  async getDeployment(deploymentId: string): Promise<DeploymentConfig | null> {
    try {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId }
      })

      return deployment ? this.mapDeploymentToConfig(deployment) : null
    } catch (error) {
      console.error('Get deployment error:', error)
      throw new Error('Failed to get deployment')
    }
  }

  /**
   * List deployments for tenant
   */
  async listDeployments(tenantId: string): Promise<DeploymentConfig[]> {
    try {
      const deployments = await prisma.deployment.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
      })

      return deployments.map(this.mapDeploymentToConfig)
    } catch (error) {
      console.error('List deployments error:', error)
      throw new Error('Failed to list deployments')
    }
  }

  /**
   * Update deployment configuration
   */
  async updateDeployment(
    deploymentId: string,
    updates: Partial<DeploymentConfig>
  ): Promise<DeploymentConfig> {
    try {
      const deployment = await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          customDomain: updates.customDomain,
          environment: updates.environment as any,
          autoDeploy: updates.autoDeploy,
          sslEnabled: updates.sslEnabled,
          cdnEnabled: updates.cdnEnabled
        }
      })

      return this.mapDeploymentToConfig(deployment)
    } catch (error) {
      console.error('Update deployment error:', error)
      throw new Error('Failed to update deployment')
    }
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId: string): Promise<void> {
    try {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: { domainConfig: true }
      })

      if (!deployment) {
        throw new Error('Deployment not found')
      }

      // Remove custom domain if configured
      if (deployment.domainConfig) {
        await this.removeCustomDomain(deployment.domainConfig)
      }

      // Delete deployment
      await prisma.deployment.delete({
        where: { id: deploymentId }
      })
    } catch (error) {
      console.error('Delete deployment error:', error)
      throw new Error('Failed to delete deployment')
    }
  }

  /**
   * Remove custom domain
   */
  private async removeCustomDomain(domainConfig: any): Promise<void> {
    try {
      // Remove DNS records
      await this.cloudflareAPI.removeDNSRecords(domainConfig.domain)

      // Remove SSL certificate
      await this.cloudflareAPI.removeSSLCertificate(domainConfig.domain)

      // Remove CDN configuration
      await this.cloudflareAPI.removeCDN(domainConfig.domain)
    } catch (error) {
      console.error('Remove custom domain error:', error)
      // Don't throw error for cleanup failures
    }
  }

  /**
   * Map database deployment to config
   */
  private mapDeploymentToConfig(deployment: any): DeploymentConfig {
    return {
      id: deployment.id,
      tenantId: deployment.tenantId,
      appName: deployment.appName,
      platform: deployment.platform,
      customDomain: deployment.customDomain,
      environment: deployment.environment,
      autoDeploy: deployment.autoDeploy,
      sslEnabled: deployment.sslEnabled,
      cdnEnabled: deployment.cdnEnabled,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt
    }
  }

  /**
   * Map database status to deployment status
   */
  private mapStatusToDeploymentStatus(status: any): DeploymentStatus {
    return {
      id: status.id,
      status: status.status,
      url: status.url,
      customDomain: status.customDomain,
      sslStatus: status.sslStatus,
      cdnStatus: status.cdnStatus,
      logs: status.logs,
      createdAt: status.createdAt,
      completedAt: status.completedAt
    }
  }
} 