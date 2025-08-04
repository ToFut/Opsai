import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { userId, provider, credentials } = await request.json()

    console.log(`🚀 Starting Airbyte deployment for user ${userId} with provider ${provider}`)

    // Create user-specific Terraform directory
    const terraformDir = path.join(process.cwd(), '..', '..', 'terraform', 'users', userId)
    await mkdir(terraformDir, { recursive: true })

    // Generate Terraform variables file for this user
    const terraformVars = generateTerraformVars(userId, provider, credentials)
    const varsFilePath = path.join(terraformDir, 'terraform.tfvars')
    await writeFile(varsFilePath, terraformVars)

    // Create user-specific main.tf that includes the base configuration
    const userMainTf = generateUserMainTf(userId, provider)
    const mainTfPath = path.join(terraformDir, 'main.tf')
    await writeFile(mainTfPath, userMainTf)

    // Initialize and apply Terraform
    const terraformCommands = [
      `cd ${terraformDir} && terraform init -backend-config="path=terraform.tfstate"`,
      `cd ${terraformDir} && terraform plan -out=tfplan`,
      `cd ${terraformDir} && terraform apply -auto-approve tfplan`
    ]

    console.log('📝 Running Terraform initialization...')
    const { stdout: initOutput } = await execAsync(terraformCommands[0])
    console.log('Init output:', initOutput)

    console.log('🔍 Running Terraform plan...')
    const { stdout: planOutput } = await execAsync(terraformCommands[1])
    console.log('Plan output:', planOutput)

    console.log('🚀 Applying Terraform configuration...')
    const { stdout: applyOutput } = await execAsync(terraformCommands[2])
    console.log('Apply output:', applyOutput)

    // Extract connection IDs from Terraform output
    const connectionIds = extractConnectionIds(applyOutput)

    return NextResponse.json({
      success: true,
      message: `Successfully deployed ${provider} connection for user ${userId}`,
      connectionIds,
      terraformOutput: {
        init: initOutput,
        plan: planOutput,
        apply: applyOutput
      }
    })

  } catch (error) {
    console.error('❌ Terraform deployment failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    }, { status: 500 })
  }
}

function generateTerraformVars(userId: string, provider: string, credentials: any): string {
  return `
# User-specific configuration for ${userId}
user_id = "${userId}"
airbyte_workspace_id = "workspace-123"
airbyte_client_id = "${process.env.AIRBYTE_CLIENT_ID || 'your-client-id'}"
airbyte_client_secret = "${process.env.AIRBYTE_CLIENT_SECRET || 'your-client-secret'}"
airbyte_api_url = "${process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'}"
project_name = "opsai-${userId}"
environment = "production"

# Provider-specific credentials
oauth_providers = {
  ${provider} = {
    enabled = true
    access_token = "${credentials.access_token}"
    ${credentials.refresh_token ? `refresh_token = "${credentials.refresh_token}"` : ''}
    ${credentials.metadata ? `metadata = ${JSON.stringify(credentials.metadata)}` : ''}
  }
}

# Supabase destination configuration
supabase_config = {
  host = "${process.env.SUPABASE_DB_HOST || 'aws-0-us-east-1.pooler.supabase.com'}"
  database = "${process.env.SUPABASE_DB_NAME || 'postgres'}"
  username = "${process.env.SUPABASE_DB_USER || 'postgres.wrkzrmvwxxtsdpyhrxhz'}"
  password = "${process.env.SUPABASE_DB_PASSWORD || 'OpsAi-postgresql-2024'}"
  port = ${process.env.SUPABASE_DB_PORT || '5432'}
  schema = "user_${userId.replace(/-/g, '_')}"
}
  `.trim()
}

function generateUserMainTf(userId: string, provider: string): string {
  return `
# User-specific Terraform configuration for ${userId}
terraform {
  required_version = ">= 1.0"
  required_providers {
    airbyte = {
      source  = "airbytehq/airbyte"
      version = "~> 0.13.0"
    }
  }
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Include base Terraform configuration
module "airbyte_setup" {
  source = "../../"
  
  # Pass all variables to the base module
  user_id = var.user_id
  airbyte_workspace_id = var.airbyte_workspace_id
  airbyte_client_id = var.airbyte_client_id
  airbyte_client_secret = var.airbyte_client_secret
  airbyte_api_url = var.airbyte_api_url
  project_name = var.project_name
  environment = var.environment
  oauth_providers = var.oauth_providers
  supabase_config = var.supabase_config
}

# Variable declarations
variable "user_id" {
  type = string
}

variable "airbyte_workspace_id" {
  type = string
}

variable "airbyte_client_id" {
  type = string
}

variable "airbyte_client_secret" {
  type = string
  sensitive = true
}

variable "airbyte_api_url" {
  type = string
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "oauth_providers" {
  type = map(object({
    enabled = bool
    access_token = string
    refresh_token = optional(string)
    metadata = optional(string)
  }))
}

variable "supabase_config" {
  type = object({
    host = string
    database = string
    username = string
    password = string
    port = number
    schema = string
  })
  sensitive = true
}

# Outputs
output "connection_ids" {
  value = module.airbyte_setup.connection_ids
}

output "source_ids" {
  value = module.airbyte_setup.source_ids
}

output "destination_id" {
  value = module.airbyte_setup.destination_id
}
  `.trim()
}

function extractConnectionIds(terraformOutput: string): string[] {
  const connectionIds: string[] = []
  
  // Extract connection IDs from Terraform output
  const connectionIdRegex = /connection_ids\s*=\s*\[(.*?)\]/s
  const match = terraformOutput.match(connectionIdRegex)
  
  if (match && match[1]) {
    const ids = match[1].split(',').map(id => id.trim().replace(/['"]/g, ''))
    connectionIds.push(...ids.filter(id => id.length > 0))
  }
  
  return connectionIds
}