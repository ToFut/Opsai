import axios, { AxiosInstance } from 'axios';
import { supabase } from '../server';
import { logger } from '../utils/logger';

interface AirbyteConnection {
  connectionId: string;
  sourceId: string;
  destinationId: string;
  status: string;
  schedule?: {
    units: number;
    timeUnit: string;
  };
}

export class AirbyteService {
  private client: AxiosInstance;
  private workspaceId: string;

  constructor() {
    this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID || '';
    
    // Initialize Airbyte API client
    this.client = axios.create({
      baseURL: process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create Airbyte connection for a user and provider
   */
  async createConnection(userId: string, provider: string): Promise<AirbyteConnection> {
    try {
      logger.info(`Creating Airbyte connection for user ${userId}, provider ${provider}`);

      // Get OAuth credentials
      const credentials = await this.getUserCredentials(userId, provider);
      if (!credentials) {
        throw new Error(`No credentials found for user ${userId}, provider ${provider}`);
      }

      // Create source
      const sourceId = await this.createSource(userId, provider, credentials);

      // Get or create destination (Supabase)
      const destinationId = await this.getOrCreateDestination(userId);

      // Create connection
      const connection = await this.createConnectionBetween(
        sourceId,
        destinationId,
        userId,
        provider
      );

      // Store connection info in database
      await this.storeConnectionInfo(userId, provider, connection);

      // Trigger initial sync
      await this.triggerSync(connection.connectionId);

      logger.info(`Airbyte connection created: ${connection.connectionId}`);
      return connection;

    } catch (error: any) {
      logger.error(`Failed to create Airbyte connection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's OAuth credentials from database
   */
  private async getUserCredentials(userId: string, provider: string) {
    const { data, error } = await supabase
      .from('oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Create Airbyte source
   */
  private async createSource(userId: string, provider: string, credentials: any): Promise<string> {
    const sourceConfigs: Record<string, any> = {
      stripe: {
        sourceDefinitionId: 'e094cb9a-26de-4645-8761-65c0c425d1de', // Stripe source definition ID
        connectionConfiguration: {
          account_id: credentials.metadata?.stripe_account_id || '',
          client_secret: credentials.access_token,
          start_date: '2020-01-01T00:00:00Z'
        }
      },
      quickbooks: {
        sourceDefinitionId: 'cf9c4355-b171-4477-8f2d-6c5cc5fc8b7e', // QuickBooks source definition ID
        connectionConfiguration: {
          credentials: {
            auth_type: 'oauth2.0',
            client_id: process.env.QUICKBOOKS_CLIENT_ID,
            client_secret: process.env.QUICKBOOKS_CLIENT_SECRET,
            refresh_token: credentials.refresh_token,
            access_token: credentials.access_token,
            realm_id: credentials.metadata?.realm_id
          },
          start_date: '2020-01-01T00:00:00Z',
          sandbox: process.env.NODE_ENV !== 'production'
        }
      },
      shopify: {
        sourceDefinitionId: '9da77001-af33-4bcd-be46-6252bf9342b9', // Shopify source definition ID
        connectionConfiguration: {
          shop: credentials.metadata?.shop_domain || '',
          credentials: {
            auth_method: 'access_token',
            access_token: credentials.access_token
          },
          start_date: '2020-01-01T00:00:00Z'
        }
      },
      google_analytics: {
        sourceDefinitionId: 'eff3616a-f9c3-11eb-9a03-0242ac130003', // Google Analytics source definition ID
        connectionConfiguration: {
          credentials: {
            auth_type: 'Oauth2.0',
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: credentials.refresh_token,
            access_token: credentials.access_token
          },
          property_id: credentials.metadata?.property_ids?.[0] || '',
          date_ranges_start_date: '2020-01-01',
          window_in_days: 1
        }
      }
    };

    const config = sourceConfigs[provider];
    if (!config) {
      throw new Error(`No source configuration for provider ${provider}`);
    }

    const sourceData = {
      workspaceId: this.workspaceId,
      sourceDefinitionId: config.sourceDefinitionId,
      connectionConfiguration: config.connectionConfiguration,
      name: `${provider}_${userId}`
    };

    try {
      const response = await this.client.post('/sources', sourceData);
      return response.data.sourceId;
    } catch (error: any) {
      logger.error(`Failed to create source: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Get or create Supabase destination
   */
  private async getOrCreateDestination(userId: string): Promise<string> {
    // Check if destination already exists for user
    const { data: existing } = await supabase
      .from('airbyte_destinations')
      .select('destination_id')
      .eq('user_id', userId)
      .single();

    if (existing?.destination_id) {
      return existing.destination_id;
    }

    // Create new Supabase destination
    const destinationData = {
      workspaceId: this.workspaceId,
      destinationDefinitionId: '22f6c74f-5699-40ff-833c-4a879ea40133', // Postgres destination ID
      connectionConfiguration: {
        host: new URL(process.env.SUPABASE_URL!).hostname,
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD,
        schema: `user_${userId.replace(/-/g, '_')}`, // User-specific schema
        ssl_mode: {
          mode: 'require'
        }
      },
      name: `supabase_${userId}`
    };

    try {
      const response = await this.client.post('/destinations', destinationData);
      const destinationId = response.data.destinationId;

      // Store destination info
      await supabase
        .from('airbyte_destinations')
        .insert({
          user_id: userId,
          destination_id: destinationId,
          created_at: new Date().toISOString()
        });

      return destinationId;
    } catch (error: any) {
      logger.error(`Failed to create destination: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Create connection between source and destination
   */
  private async createConnectionBetween(
    sourceId: string,
    destinationId: string,
    userId: string,
    provider: string
  ): Promise<AirbyteConnection> {
    const connectionData = {
      sourceId,
      destinationId,
      name: `${provider}_to_supabase_${userId}`,
      namespaceDefinition: 'customformat',
      namespaceFormat: `user_${userId.replace(/-/g, '_')}`,
      status: 'active',
      schedule: {
        units: 24,
        timeUnit: 'hours'
      },
      syncCatalog: {
        streams: [] // Will be auto-discovered
      }
    };

    try {
      // First, discover schema
      const schemaResponse = await this.client.post('/sources/discover_schema', {
        sourceId
      });

      // Use discovered schema
      connectionData.syncCatalog = schemaResponse.data.catalog;

      // Create connection
      const response = await this.client.post('/connections', connectionData);

      return {
        connectionId: response.data.connectionId,
        sourceId,
        destinationId,
        status: response.data.status,
        schedule: response.data.schedule
      };
    } catch (error: any) {
      logger.error(`Failed to create connection: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Store connection info in database
   */
  private async storeConnectionInfo(userId: string, provider: string, connection: AirbyteConnection) {
    await supabase
      .from('airbyte_connections')
      .upsert({
        user_id: userId,
        provider,
        connection_id: connection.connectionId,
        source_id: connection.sourceId,
        destination_id: connection.destinationId,
        status: connection.status,
        schedule: connection.schedule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });
  }

  /**
   * Trigger manual sync for a connection
   */
  async triggerSync(connectionId: string): Promise<void> {
    try {
      await this.client.post('/connections/sync', {
        connectionId
      });
      logger.info(`Sync triggered for connection ${connectionId}`);
    } catch (error: any) {
      logger.error(`Failed to trigger sync: ${error.response?.data || error.message}`);
      // Don't throw - sync will happen on schedule anyway
    }
  }

  /**
   * Get sync status for a connection
   */
  async getSyncStatus(connectionId: string): Promise<any> {
    try {
      const response = await this.client.get(`/connections/${connectionId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get sync status: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Get all connections for a user
   */
  async getUserConnections(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('airbyte_connections')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      logger.error(`Failed to get user connections: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      await this.client.delete(`/connections/${connectionId}`);
      logger.info(`Connection ${connectionId} deleted`);
    } catch (error: any) {
      logger.error(`Failed to delete connection: ${error.response?.data || error.message}`);
      throw error;
    }
  }
}