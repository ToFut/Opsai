import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class TerraformService {
  private terraformDir: string;
  private userConfigDir: string;

  constructor() {
    this.terraformDir = path.join(process.cwd(), 'terraform');
    this.userConfigDir = path.join(process.cwd(), 'terraform', 'users');
  }

  /**
   * Update Terraform configuration for a user's OAuth connection
   */
  async updateUserConfig(userId: string, provider: string, tokens: any) {
    try {
      logger.info(`Updating Terraform config for user ${userId}, provider ${provider}`);

      // Create user-specific directory
      const userDir = path.join(this.userConfigDir, userId);
      await fs.mkdir(userDir, { recursive: true });

      // Copy base Terraform files if not exists
      await this.copyBaseTerraformFiles(userDir);

      // Generate user-specific tfvars
      const tfvars = await this.generateUserTfvars(userId, provider, tokens);
      const tfvarsPath = path.join(userDir, 'terraform.tfvars');
      await fs.writeFile(tfvarsPath, tfvars);

      // Initialize and apply Terraform
      await this.applyTerraform(userDir);

      logger.info(`Terraform config updated successfully for user ${userId}`);
      return true;

    } catch (error: any) {
      logger.error(`Terraform update failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Copy base Terraform files to user directory
   */
  private async copyBaseTerraformFiles(userDir: string) {
    const baseFiles = [
      'main.tf',
      'variables.tf',
      'sources.tf',
      'destinations.tf',
      'connections.tf',
      'outputs.tf',
      'backend.tf'
    ];

    for (const file of baseFiles) {
      const sourcePath = path.join(this.terraformDir, file);
      const destPath = path.join(userDir, file);

      try {
        // Check if source file exists
        await fs.access(sourcePath);
        
        // Check if destination doesn't exist
        try {
          await fs.access(destPath);
          // File exists, skip
          continue;
        } catch {
          // File doesn't exist, copy it
          const content = await fs.readFile(sourcePath, 'utf8');
          await fs.writeFile(destPath, content);
        }
      } catch (error) {
        logger.warn(`Could not copy ${file}: ${error}`);
      }
    }
  }

  /**
   * Generate user-specific terraform.tfvars
   */
  private async generateUserTfvars(userId: string, provider: string, tokens: any): Promise<string> {
    const baseConfig = {
      user_id: `"${userId}"`,
      environment: `"production"`,
      project_name: `"opsai"`,
      airbyte_workspace_id: `"${process.env.AIRBYTE_WORKSPACE_ID || ''}"`,
      airbyte_api_url: `"${process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'}"`,
      supabase_url: `"${process.env.SUPABASE_URL}"`,
      supabase_key: `"${process.env.SUPABASE_SERVICE_KEY}"`
    };

    // Provider-specific configuration
    const providerConfigs: Record<string, any> = {
      stripe: {
        stripe_enabled: true,
        stripe_api_key: `"${tokens.access_token}"`
      },
      quickbooks: {
        quickbooks_enabled: true,
        quickbooks_access_token: `"${tokens.access_token}"`,
        quickbooks_refresh_token: `"${tokens.refresh_token}"`,
        quickbooks_realm_id: `"${tokens.realmId || ''}"`
      },
      netsuite: {
        netsuite_enabled: true,
        netsuite_access_token: `"${tokens.access_token}"`,
        netsuite_token_secret: `"${tokens.token_secret || ''}"`,
        netsuite_account_id: `"${tokens.account_id || ''}"`
      },
      shopify: {
        shopify_enabled: true,
        shopify_access_token: `"${tokens.access_token}"`,
        shopify_shop_domain: `"${tokens.shop_domain || ''}"`
      },
      google: {
        google_enabled: true,
        google_refresh_token: `"${tokens.refresh_token}"`,
        google_property_ids: `["${tokens.property_ids?.join('", "') || ''}"]`
      }
    };

    // Merge base config with provider config
    const config = { ...baseConfig, ...providerConfigs[provider] };

    // Convert to tfvars format
    let tfvars = '';
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        tfvars += `${key} = {\n`;
        for (const [subKey, subValue] of Object.entries(value)) {
          tfvars += `  ${subKey} = ${subValue}\n`;
        }
        tfvars += '}\n\n';
      } else {
        tfvars += `${key} = ${value}\n`;
      }
    }

    // Add OAuth providers block
    tfvars += `\noauth_providers = {\n`;
    tfvars += `  ${provider} = {\n`;
    tfvars += `    enabled = true\n`;
    tfvars += `    client_secret = "${tokens.access_token || tokens.refresh_token}"\n`;
    tfvars += `  }\n`;
    tfvars += `}\n`;

    return tfvars;
  }

  /**
   * Apply Terraform configuration
   */
  private async applyTerraform(userDir: string) {
    try {
      logger.info(`Applying Terraform in ${userDir}`);

      // Initialize Terraform
      const { stdout: initOut, stderr: initErr } = await execAsync(
        'terraform init -upgrade',
        { cwd: userDir }
      );
      
      if (initErr && !initErr.includes('Terraform has been successfully initialized')) {
        logger.warn(`Terraform init warnings: ${initErr}`);
      }

      // Plan Terraform changes
      const { stdout: planOut } = await execAsync(
        'terraform plan -out=tfplan',
        { cwd: userDir }
      );
      logger.info(`Terraform plan output: ${planOut.slice(0, 500)}...`);

      // Apply Terraform changes
      const { stdout: applyOut, stderr: applyErr } = await execAsync(
        'terraform apply -auto-approve tfplan',
        { 
          cwd: userDir,
          timeout: 300000 // 5 minutes timeout
        }
      );

      if (applyErr) {
        logger.warn(`Terraform apply warnings: ${applyErr}`);
      }

      logger.info(`Terraform applied successfully`);
      return this.parseTerraformOutputs(applyOut);

    } catch (error: any) {
      logger.error(`Terraform apply failed: ${error.message}`);
      
      // Try to destroy on error to clean up
      try {
        await execAsync('terraform destroy -auto-approve', { cwd: userDir });
      } catch (destroyError) {
        logger.error(`Cleanup failed: ${destroyError}`);
      }
      
      throw error;
    }
  }

  /**
   * Parse Terraform outputs
   */
  private parseTerraformOutputs(output: string): Record<string, string> {
    const outputs: Record<string, string> = {};
    
    // Look for outputs section
    const outputMatch = output.match(/Outputs:\n\n([\s\S]*?)(?:\n\n|$)/);
    if (!outputMatch) return outputs;

    const lines = outputMatch[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*=\s*"?([^"]+)"?$/);
      if (match) {
        outputs[match[1]] = match[2];
      }
    }

    return outputs;
  }

  /**
   * Get Terraform state for a user
   */
  async getUserState(userId: string): Promise<any> {
    try {
      const userDir = path.join(this.userConfigDir, userId);
      const stateFile = path.join(userDir, 'terraform.tfstate');
      
      const stateContent = await fs.readFile(stateFile, 'utf8');
      return JSON.parse(stateContent);
    } catch (error) {
      logger.error(`Failed to read state for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Destroy user's Terraform resources
   */
  async destroyUserResources(userId: string): Promise<void> {
    try {
      const userDir = path.join(this.userConfigDir, userId);
      
      await execAsync('terraform destroy -auto-approve', {
        cwd: userDir,
        timeout: 300000
      });
      
      // Clean up user directory
      await fs.rm(userDir, { recursive: true, force: true });
      
      logger.info(`Destroyed resources for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to destroy resources for user ${userId}:`, error);
      throw error;
    }
  }
}