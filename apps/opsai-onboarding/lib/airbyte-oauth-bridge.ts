/**
 * Airbyte OAuth Bridge
 * Automatically updates Airbyte sources with OAuth tokens after user authentication
 */

import { createClient } from '@supabase/supabase-js';

const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';

interface AirbyteTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AirbyteSource {
  sourceId: string;
  name: string;
  sourceType: string;
  configuration: any;
}

class AirbyteOAuthBridge {
  private airbyteToken: string | null = null;
  private tokenExpiry: number = 0;

  private getConfig() {
    return {
      AIRBYTE_CLIENT_ID: process.env.AIRBYTE_CLIENT_ID!,
      AIRBYTE_CLIENT_SECRET: process.env.AIRBYTE_CLIENT_SECRET!,
      WORKSPACE_ID: process.env.AIRBYTE_WORKSPACE_ID!
    };
  }

  private getSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async getAirbyteToken(): Promise<string> {
    // Reuse token if still valid
    if (this.airbyteToken && Date.now() < this.tokenExpiry) {
      return this.airbyteToken;
    }

    const config = this.getConfig();
    const response = await fetch('https://api.airbyte.com/v1/applications/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.AIRBYTE_CLIENT_ID,
        client_secret: config.AIRBYTE_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get Airbyte token: ${response.status}`);
    }

    const data: AirbyteTokenResponse = await response.json();
    this.airbyteToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
    
    return this.airbyteToken;
  }

  async findSource(sourceType: string): Promise<AirbyteSource | null> {
    const token = await this.getAirbyteToken();
    const config = this.getConfig();
    
    const response = await fetch(`${AIRBYTE_API_URL}/sources?workspaceId=${config.WORKSPACE_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sources: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.find((s: AirbyteSource) => s.sourceType === sourceType || s.name.includes(sourceType)) || null;
  }

  async updateGitHubSource(accessToken: string): Promise<boolean> {
    console.log('🔧 Updating GitHub source with OAuth token...');
    
    try {
      const source = await this.findSource('github');
      if (!source) {
        console.log('❌ GitHub source not found');
        return false;
      }

      const token = await this.getAirbyteToken();

      // Get current configuration
      const detailResponse = await fetch(`${AIRBYTE_API_URL}/sources/${source.sourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const currentConfig = await detailResponse.json();

      // Update with OAuth token
      const updatedConfig = {
        ...currentConfig,
        configuration: {
          ...currentConfig.configuration,
          credentials: {
            personal_access_token: {
              option_title: "PAT Credentials",
              personal_access_token: accessToken
            }
          }
        }
      };

      const updateResponse = await fetch(`${AIRBYTE_API_URL}/sources/${source.sourceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatedConfig)
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.log('❌ Failed to update GitHub source:', error);
        return false;
      }

      // Test the connection
      const testResponse = await fetch(`${AIRBYTE_API_URL}/sources/${source.sourceId}/check_connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const testResult = await testResponse.json();
      
      if (testResponse.ok && testResult.jobInfo?.succeeded) {
        console.log('✅ GitHub source updated and tested successfully');
        return true;
      } else {
        console.log('❌ GitHub source connection test failed:', testResult);
        return false;
      }

    } catch (error) {
      console.error('Error updating GitHub source:', error);
      return false;
    }
  }

  async updateGoogleAnalyticsSource(refreshToken: string): Promise<boolean> {
    console.log('🔧 Updating Google Analytics source with OAuth token...');
    
    try {
      const source = await this.findSource('google-analytics');
      if (!source) {
        console.log('❌ Google Analytics source not found');
        return false;
      }

      const token = await this.getAirbyteToken();

      // Get current configuration
      const detailResponse = await fetch(`${AIRBYTE_API_URL}/sources/${source.sourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const currentConfig = await detailResponse.json();

      // Update with OAuth refresh token
      const updatedConfig = {
        ...currentConfig,
        configuration: {
          ...currentConfig.configuration,
          credentials: {
            auth_type: "Client",
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken
          }
        }
      };

      const updateResponse = await fetch(`${AIRBYTE_API_URL}/sources/${source.sourceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatedConfig)
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.log('❌ Failed to update Google Analytics source:', error);
        return false;
      }

      // Test the connection
      const testResponse = await fetch(`${AIRBYTE_API_URL}/sources/${source.sourceId}/check_connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const testResult = await testResponse.json();
      
      if (testResponse.ok && testResult.jobInfo?.succeeded) {
        console.log('✅ Google Analytics source updated and tested successfully');
        return true;
      } else {
        console.log('❌ Google Analytics source connection test failed:', testResult);
        return false;
      }

    } catch (error) {
      console.error('Error updating Google Analytics source:', error);
      return false;
    }
  }

  async createConnection(sourceId: string, destinationId: string, provider: string): Promise<string | null> {
    console.log(`🔗 Creating ${provider} to Supabase connection...`);
    
    try {
      const token = await this.getAirbyteToken();

      const connectionData = {
        name: `${provider} to Supabase - ${new Date().toISOString()}`,
        sourceId: sourceId,
        destinationId: destinationId,
        namespaceDefinition: 'custom_format',
        namespaceFormat: `${provider.toLowerCase()}_data`,
        status: 'active',
        schedule: {
          scheduleType: 'cron',
          cronExpression: provider === 'github' ? '0 */4 * * * ?' : '0 0 * * * ?'  // 4 hours for GitHub, daily for others
        }
      };

      const response = await fetch(`${AIRBYTE_API_URL}/connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(connectionData)
      });

      if (response.ok) {
        const connectionData = await response.json();
        console.log(`✅ ${provider} connection created:`, connectionData.connectionId);
        return connectionData.connectionId;
      } else {
        const error = await response.json();
        console.log(`❌ ${provider} connection failed:`, error);
        return null;
      }

    } catch (error) {
      console.error(`Error creating ${provider} connection:`, error);
      return null;
    }
  }

  async findDestination(name: string = 'supabase'): Promise<string | null> {
    const token = await this.getAirbyteToken();
    const config = this.getConfig();
    
    const response = await fetch(`${AIRBYTE_API_URL}/destinations?workspaceId=${config.WORKSPACE_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch destinations: ${response.status}`);
    }

    const data = await response.json();
    const destination = data.data?.find((d: any) => d.name.includes(name));
    return destination?.destinationId || null;
  }

  /**
   * Main function called after successful OAuth authentication
   */
  async onOAuthSuccess(provider: string, accessToken: string, refreshToken?: string): Promise<boolean> {
    console.log(`🎯 Processing OAuth success for ${provider}...`);
    
    try {
      let sourceUpdated = false;
      let sourceId: string | null = null;

      // Update the appropriate source
      if (provider === 'github' && accessToken) {
        sourceUpdated = await this.updateGitHubSource(accessToken);
        const source = await this.findSource('github');
        sourceId = source?.sourceId || null;
      } else if (provider === 'google' && refreshToken) {
        sourceUpdated = await this.updateGoogleAnalyticsSource(refreshToken);
        const source = await this.findSource('google-analytics');
        sourceId = source?.sourceId || null;
      }

      if (!sourceUpdated || !sourceId) {
        console.log(`❌ Failed to update ${provider} source`);
        return false;
      }

      // Find Supabase destination
      const destinationId = await this.findDestination('supabase');
      if (!destinationId) {
        console.log('❌ Supabase destination not found');
        return false;
      }

      // Create connection
      const connectionId = await this.createConnection(sourceId, destinationId, provider);
      
      if (connectionId) {
        // Update database with connection info
        const supabase = this.getSupabase();
        await supabase
          .from('tenant_integrations')
          .update({
            airbyte_source_id: sourceId,
            airbyte_connection_id: connectionId,
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('provider', provider)
          .eq('status', 'connected');

        console.log(`🎉 ${provider} integration fully configured for continuous sync!`);
        return true;
      }

      return false;

    } catch (error) {
      console.error(`Error processing OAuth success for ${provider}:`, error);
      return false;
    }
  }
}

export const airbyteOAuthBridge = new AirbyteOAuthBridge();