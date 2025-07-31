import { YAMLValidator, YAMLConfig } from '@opsai/yaml-validator'
import { TenantManager } from '@opsai/multi-tenant'
import { IntegrationManager } from '@opsai/integrations'
import { DeploymentManager } from '@opsai/deployment'
import { BillingManager } from '@opsai/billing'
import { WorkflowEngine } from './workflow-engine'
import { FileManager } from './file-manager'
import { AlertManager } from './alert-manager'
import { MonitoringManager } from './monitoring-manager'
import { DatabaseManager } from './database-manager'
import { AuthManager } from './auth-manager'
import { DashboardGenerator } from './dashboard-generator'
import { AutomationManager } from './automation-manager'

export interface WorkflowStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: Date
  endTime?: Date
  error?: string
  progress: number
  metadata?: Record<string, any>
}

export interface WorkflowExecution {
  id: string
  tenantId: string
  config: YAMLConfig
  steps: WorkflowStep[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
  totalSteps: number
  completedSteps: number
}

export class WorkflowOrchestrator {
  private yamlValidator: YAMLValidator
  private tenantManager: TenantManager
  private integrationManager: IntegrationManager
  private deploymentManager: DeploymentManager
  private billingManager: BillingManager
  private workflowEngine: WorkflowEngine
  private fileManager: FileManager
  private alertManager: AlertManager
  private monitoringManager: MonitoringManager
  private databaseManager: DatabaseManager
  private authManager: AuthManager
  private dashboardGenerator: DashboardGenerator
  private automationManager: AutomationManager

  private executions: Map<string, WorkflowExecution> = new Map()

  constructor() {
    this.yamlValidator = YAMLValidator.getInstance()
    this.tenantManager = TenantManager.getInstance()
    this.integrationManager = new IntegrationManager()
    this.deploymentManager = new DeploymentManager()
    this.billingManager = new BillingManager(process.env.STRIPE_SECRET_KEY || '')
    this.workflowEngine = new WorkflowEngine()
    this.fileManager = new FileManager()
    this.alertManager = new AlertManager()
    this.monitoringManager = new MonitoringManager()
    this.databaseManager = new DatabaseManager()
    this.authManager = new AuthManager()
    this.dashboardGenerator = new DashboardGenerator()
    this.automationManager = new AutomationManager()
  }

  // Main orchestration method
  async executeCompleteWorkflow(yamlConfig: YAMLConfig, tenantName: string): Promise<WorkflowExecution> {
    const executionId = this.generateId()
    const tenantId = this.generateId()

    const execution: WorkflowExecution = {
      id: executionId,
      tenantId,
      config: yamlConfig,
      steps: this.createWorkflowSteps(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalSteps: 10,
      completedSteps: 0
    }

    this.executions.set(executionId, execution)

    try {
      execution.status = 'running'
      execution.updatedAt = new Date()

      // Step 1: Validate YAML Configuration
      await this.executeStep(execution, 'validate-yaml', async () => {
        const result = this.yamlValidator.validateYAMLObject(yamlConfig)
        if (!result.valid) {
          throw new Error(`YAML validation failed: ${result.errors.map(e => e.message).join(', ')}`)
        }
        
        const businessResult = this.yamlValidator.validateBusinessLogic(yamlConfig)
        if (!businessResult.valid) {
          throw new Error(`Business logic validation failed: ${businessResult.errors.map(e => e.message).join(', ')}`)
        }
      })

      // Step 2: Create Tenant and Setup Database
      await this.executeStep(execution, 'setup-tenant', async () => {
        const tenant = await this.tenantManager.createTenant({
          name: tenantName,
          slug: tenantName.toLowerCase().replace(/\s+/g, '-'),
          config: yamlConfig,
          status: 'active',
          settings: {
            timezone: yamlConfig.business.settings?.timezone || 'UTC',
            currency: yamlConfig.business.settings?.currency || 'USD',
            language: yamlConfig.business.settings?.language || 'en'
          }
        })

        // Setup database schema
        await this.databaseManager.setupTenantDatabase(tenant.id, yamlConfig)
        
        execution.tenantId = tenant.id
      })

      // Step 3: Setup Authentication and Roles
      await this.executeStep(execution, 'setup-auth', async () => {
        if (yamlConfig.auth) {
          await this.authManager.setupAuth(execution.tenantId, yamlConfig.auth)
        } else {
          // Setup default auth
          await this.authManager.setupDefaultAuth(execution.tenantId)
        }
      })

      // Step 4: Generate Dashboard and UI
      await this.executeStep(execution, 'generate-dashboard', async () => {
        if (yamlConfig.dashboards) {
          for (const dashboard of yamlConfig.dashboards) {
            await this.dashboardGenerator.generateDashboard(execution.tenantId, dashboard)
          }
        }
        
        // Generate default dashboard
        await this.dashboardGenerator.generateDefaultDashboard(execution.tenantId, yamlConfig)
      })

      // Step 5: Setup Integrations
      await this.executeStep(execution, 'setup-integrations', async () => {
        if (yamlConfig.integrations) {
          for (const integration of yamlConfig.integrations) {
            await this.integrationManager.createIntegration({
              ...integration,
              tenantId: execution.tenantId
            })
          }
        }
      })

      // Step 6: Setup Automations and Workflows
      await this.executeStep(execution, 'setup-automations', async () => {
        if (yamlConfig.workflows) {
          for (const workflow of yamlConfig.workflows) {
            await this.automationManager.createWorkflow(execution.tenantId, workflow)
          }
        }
      })

      // Step 7: Setup File Handling and OCR
      await this.executeStep(execution, 'setup-file-handling', async () => {
        await this.fileManager.setupFileStorage(execution.tenantId, yamlConfig)
      })

      // Step 8: Setup Alerts and Monitoring
      await this.executeStep(execution, 'setup-monitoring', async () => {
        await this.monitoringManager.setupMonitoring(execution.tenantId, yamlConfig)
        await this.alertManager.setupAlerts(execution.tenantId, yamlConfig)
      })

      // Step 9: Setup Billing
      await this.executeStep(execution, 'setup-billing', async () => {
        if (yamlConfig.billing) {
          for (const plan of yamlConfig.billing.plans) {
            await this.billingManager.createPlan({
              name: plan.name,
              price: plan.price,
              currency: plan.currency,
              interval: plan.interval,
              limits: plan.limits,
              features: plan.features
            })
          }
        }
      })

      // Step 10: Deploy Application
      await this.executeStep(execution, 'deploy-application', async () => {
        const deploymentConfig = yamlConfig.deployment || {
          provider: 'vercel',
          environment: 'production',
          autoDeploy: true,
          rollback: true,
          environmentVariables: {}
        }

        const deployment = await this.deploymentManager.createDeployment(execution.tenantId, deploymentConfig)
        
        // Wait for deployment to complete
        await this.waitForDeployment(deployment.id)
      })

      execution.status = 'completed'
      execution.completedSteps = execution.totalSteps
      execution.updatedAt = new Date()

      console.log(`✅ Complete workflow executed successfully for tenant: ${tenantName}`)
      return execution

    } catch (error) {
      execution.status = 'failed'
      execution.updatedAt = new Date()
      
      console.error(`❌ Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  private createWorkflowSteps(): WorkflowStep[] {
    return [
      { id: 'validate-yaml', name: 'Validate YAML Configuration', status: 'pending', progress: 0 },
      { id: 'setup-tenant', name: 'Setup Tenant and Database', status: 'pending', progress: 0 },
      { id: 'setup-auth', name: 'Setup Authentication and Roles', status: 'pending', progress: 0 },
      { id: 'generate-dashboard', name: 'Generate Dashboard and UI', status: 'pending', progress: 0 },
      { id: 'setup-integrations', name: 'Setup Integrations', status: 'pending', progress: 0 },
      { id: 'setup-automations', name: 'Setup Automations and Workflows', status: 'pending', progress: 0 },
      { id: 'setup-file-handling', name: 'Setup File Handling and OCR', status: 'pending', progress: 0 },
      { id: 'setup-monitoring', name: 'Setup Alerts and Monitoring', status: 'pending', progress: 0 },
      { id: 'setup-billing', name: 'Setup Billing and Plans', status: 'pending', progress: 0 },
      { id: 'deploy-application', name: 'Deploy Application', status: 'pending', progress: 0 }
    ]
  }

  private async executeStep(execution: WorkflowExecution, stepId: string, stepFunction: () => Promise<void>): Promise<void> {
    const step = execution.steps.find(s => s.id === stepId)
    if (!step) throw new Error(`Step not found: ${stepId}`)

    try {
      step.status = 'running'
      step.startTime = new Date()
      step.progress = 0
      execution.updatedAt = new Date()

      console.log(`🔄 Executing step: ${step.name}`)

      // Execute the step
      await stepFunction()

      step.status = 'completed'
      step.endTime = new Date()
      step.progress = 100
      execution.completedSteps++
      execution.updatedAt = new Date()

      console.log(`✅ Completed step: ${step.name}`)

    } catch (error) {
      step.status = 'failed'
      step.endTime = new Date()
      step.error = error instanceof Error ? error.message : 'Unknown error'
      execution.updatedAt = new Date()

      console.error(`❌ Failed step: ${step.name} - ${step.error}`)
      throw error
    }
  }

  private async waitForDeployment(deploymentId: string): Promise<void> {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      const deployment = await this.deploymentManager.getDeployment(deploymentId)
      
      if (deployment?.status === 'success') {
        return
      } else if (deployment?.status === 'failed') {
        throw new Error(`Deployment failed: ${deployment.errorMessage}`)
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    throw new Error('Deployment timeout')
  }

  // Get execution status
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null
  }

  // List all executions
  async listExecutions(): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values())
  }

  // Cancel execution
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    if (!execution) throw new Error('Execution not found')

    if (execution.status === 'running') {
      execution.status = 'failed'
      execution.updatedAt = new Date()
      
      // Cancel any running steps
      execution.steps.forEach(step => {
        if (step.status === 'running') {
          step.status = 'failed'
          step.error = 'Cancelled by user'
          step.endTime = new Date()
        }
      })
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 