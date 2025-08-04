import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

interface AirbyteTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class AirbyteTerraformSDK {
  private clientId: string;
  private clientSecret: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    this.clientId = process.env.AIRBYTE_CLIENT_ID || '4af7a574-b155-47ee-8dce-2cd2c519a34a';
    this.clientSecret = process.env.AIRBYTE_CLIENT_SECRET || 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7';
  }

  /**
   * Get fresh API token using OAuth2 client credentials
   * Access tokens are short-lived (15 minutes), always refresh automatically
   * NEVER uses the static AIRBYTE_API_KEY from .env
   */
  async getValidApiToken(): Promise<string> {
    // Always refresh if token is older than 10 minutes (600 seconds buffer)
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    console.log('🔄 Refreshing Airbyte API token via OAuth2 client credentials (auto-refresh enabled)...');

    try {
      // Use OAuth2 client credentials flow to get fresh token
      const response = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'openid email profile'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${await response.text()}`);
      }

      const tokenData: AirbyteTokenResponse = await response.json();
      
      // Cache the token with 60-second buffer before expiry (since tokens are 3 minutes)
      this.tokenCache = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000
      };

      console.log('✅ Airbyte API token refreshed successfully');
      console.log(`   Expires in: ${Math.round(tokenData.expires_in / 60)} minutes (${tokenData.expires_in}s)`);

      // Update environment file for other processes
      await this.updateEnvironmentToken(tokenData.access_token);

      return tokenData.access_token;

    } catch (error) {
      console.error('❌ Failed to refresh Airbyte token:', error);
      
      // Fallback to Terraform if direct OAuth fails
      return this.getTerraformToken();
    }
  }

  /**
   * Use Terraform to refresh the token (alternative method)
   */
  private async getTerraformToken(): Promise<string> {
    console.log('🔄 Using Terraform to refresh Airbyte token...');

    try {
      // Run terraform refresh to get latest token
      const terraformDir = '/Users/segevbin/Desktop/Opsai/terraform';
      
      await execAsync('terraform refresh', { cwd: terraformDir });
      
      // Get the token from terraform output
      const { stdout } = await execAsync('terraform output -raw airbyte_api_token', { 
        cwd: terraformDir 
      });
      
      const freshToken = stdout.trim();
      
      if (freshToken && freshToken !== 'null') {
        console.log('✅ Got fresh token from Terraform');
        await this.updateEnvironmentToken(freshToken);
        return freshToken;
      } else {
        throw new Error('No token returned from Terraform');
      }

    } catch (error) {
      console.error('❌ Terraform token refresh failed:', error);
      throw new Error('Could not refresh Airbyte token via Terraform');
    }
  }

  /**
   * Update environment files with new token
   */
  private async updateEnvironmentToken(newToken: string): Promise<void> {
    try {
      const envPath = '/Users/segevbin/Desktop/Opsai/apps/opsai-onboarding/.env.local';
      
      // Read current env file
      const envContent = await fs.readFile(envPath, 'utf-8');
      
      // Replace the AIRBYTE_API_KEY line
      const updatedContent = envContent.replace(
        /AIRBYTE_API_KEY=.*/,
        `AIRBYTE_API_KEY=${newToken}`
      );
      
      // Write back the updated content
      await fs.writeFile(envPath, updatedContent);
      
      // Also update process.env for immediate use
      process.env.AIRBYTE_API_KEY = newToken;
      
      console.log('✅ Environment updated with fresh Airbyte token');

    } catch (error) {
      console.warn('⚠️ Could not update environment file:', error);
    }
  }

  /**
   * Make authenticated API request to Airbyte
   */
  async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidApiToken();
    
    return fetch(`https://api.airbyte.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  /**
   * Create Airbyte destination with automatic token refresh
   */
  async createDestination(config: {
    name: string;
    workspaceId: string;
    definitionId: string;
    configuration: any;
  }): Promise<any> {
    const requestBody = {
      name: config.name,
      workspaceId: config.workspaceId,
      definitionId: config.definitionId,  // Use 'definitionId' not 'destinationDefinitionId'
      configuration: config.configuration
    };

    console.log('🔧 Creating destination with config:', JSON.stringify(requestBody, null, 2));

    const response = await this.makeApiRequest('/destinations', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create destination: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Create Airbyte connection with automatic token refresh
   */
  async createConnection(config: {
    name: string;
    sourceId: string;
    destinationId: string;
    configurations?: any;
    schedule?: any;
  }): Promise<any> {
    const requestBody = {
      name: config.name,
      sourceId: config.sourceId,
      destinationId: config.destinationId,
      configurations: config.configurations || {
        namespaceDefinition: 'destination',
        namespaceFormat: '${SOURCE_NAMESPACE}',
        prefix: 'opsai_'
      },
      schedule: config.schedule || {
        scheduleType: 'manual'
      },
      dataResidency: 'auto'
    };

    console.log('🔧 Creating connection with config:', JSON.stringify(requestBody, null, 2));

    const response = await this.makeApiRequest('/connections', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create connection: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Trigger a sync job
   */
  async triggerSync(connectionId: string): Promise<any> {
    const response = await this.makeApiRequest('/connections/sync', {
      method: 'POST',
      body: JSON.stringify({
        connectionId: connectionId,
        jobType: 'sync'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger sync: ${response.status} ${errorText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const airbyteTerraformSDK = new AirbyteTerraformSDK();
export default AirbyteTerraformSDK;