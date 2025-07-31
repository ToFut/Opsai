import { YamlConfig } from '../../../packages/shared/src/types';
import * as fs from 'fs';
import * as path from 'path';

export interface AirbyteConfig {
  connections: Array<{
    name: string;
    sourceId: string;
    destinationId: string;
    syncMode: 'full_refresh' | 'incremental';
    schedule: {
      frequency: string;
      cronExpression?: string;
    };
    streams: Array<{
      name: string;
      namespace?: string;
      syncMode: string;
      destinationSyncMode: string;
      cursorField?: string;
      primaryKey?: string[];
    }>;
  }>;
  sources: Array<{
    id: string;
    name: string;
    sourceDefinitionId: string;
    connectionConfiguration: any;
  }>;
  destinations: Array<{
    id: string;
    name: string;
    destinationDefinitionId: string;
    connectionConfiguration: any;
  }>;
}

export class AirbyteGenerator {
  constructor(private config: YamlConfig, private outputDir: string) {}

  async generateAirbyteSetup(): Promise<AirbyteConfig> {
    console.log('🔄 Generating Airbyte configuration...');

    // Extract integration requirements from YAML
    const airbyteConfig = this.extractAirbyteConfig();
    
    // Generate Airbyte configuration files
    await this.generateAirbyteFiles(airbyteConfig);
    
    // Generate Docker Compose for Airbyte
    await this.generateDockerCompose();
    
    // Generate data sync services
    await this.generateDataSyncServices(airbyteConfig);
    
    // Generate transformation scripts
    await this.generateTransformations(airbyteConfig);
    
    // Generate monitoring and alerting
    await this.generateMonitoring(airbyteConfig);

    console.log('✅ Airbyte configuration generated successfully');
    return airbyteConfig;
  }

  private extractAirbyteConfig(): AirbyteConfig {
    const integrations = this.config.apis?.integrations || [];
    const entities = this.config.entities || {};
    
    const sources: any[] = [];
    const destinations: any[] = [];
    const connections: any[] = [];

    // Generate sources from integrations
    integrations.forEach((integration: any, index: number) => {
      const sourceId = `source-${integration.name}-${index}`;
      
      // Map integration to Airbyte source
      const sourceConfig = this.mapIntegrationToSource(integration, sourceId);
      if (sourceConfig) {
        sources.push(sourceConfig);
      }
    });

    // Create destination (our database)
    const destinationId = 'destination-postgres-main';
    destinations.push({
      id: destinationId,
      name: 'Main Database',
      destinationDefinitionId: '25c5221d-dce2-4163-ade9-739ef790f503', // Postgres destination
      connectionConfiguration: {
        host: 'localhost',
        port: 54322,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres',
        schema: 'public',
        ssl: false,
        tunnel_method: {
          tunnel_method: 'NO_TUNNEL'
        }
      }
    });

    // Create connections between sources and destination
    sources.forEach(source => {
      const connection = {
        name: `${source.name} -> Database`,
        sourceId: source.id,
        destinationId: destinationId,
        syncMode: 'incremental' as const,
        schedule: {
          frequency: '0 */6 * * *', // Every 6 hours
          cronExpression: '0 */6 * * *'
        },
        streams: this.generateStreamsForSource(source, entities)
      };
      connections.push(connection);
    });

    return {
      sources,
      destinations,
      connections
    };
  }

  private mapIntegrationToSource(integration: any, sourceId: string): any | null {
    const sourceConfigs: { [key: string]: any } = {
      stripe: {
        id: sourceId,
        name: `Stripe - ${integration.name}`,
        sourceDefinitionId: 'e094cb9a-26de-4645-8761-65c0c425d1de',
        connectionConfiguration: {
          client_secret: '${STRIPE_SECRET_KEY}',
          account_id: '${STRIPE_ACCOUNT_ID}',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      },
      salesforce: {
        id: sourceId,
        name: `Salesforce - ${integration.name}`,
        sourceDefinitionId: 'b117307c-14b6-41aa-9422-947e34922962',
        connectionConfiguration: {
          client_id: '${SALESFORCE_CLIENT_ID}',
          client_secret: '${SALESFORCE_CLIENT_SECRET}',
          refresh_token: '${SALESFORCE_REFRESH_TOKEN}',
          is_sandbox: false,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      },
      hubspot: {
        id: sourceId,
        name: `HubSpot - ${integration.name}`,
        sourceDefinitionId: '36c891d9-4bd9-43ac-bad2-10e12756272c',
        connectionConfiguration: {
          credentials: {
            credentials_title: 'Private App Credentials',
            access_token: '${HUBSPOT_ACCESS_TOKEN}'
          },
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      },
      quickbooks: {
        id: sourceId,
        name: `QuickBooks - ${integration.name}`,
        sourceDefinitionId: '6fd5e14e-5b07-4833-b2bb-a6cecf2e46bb',
        connectionConfiguration: {
          credentials: {
            auth_type: 'oauth2.0',
            client_id: '${QUICKBOOKS_CLIENT_ID}',
            client_secret: '${QUICKBOOKS_CLIENT_SECRET}',
            refresh_token: '${QUICKBOOKS_REFRESH_TOKEN}',
            access_token: '${QUICKBOOKS_ACCESS_TOKEN}',
            realm_id: '${QUICKBOOKS_REALM_ID}'
          },
          sandbox: false,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      },
      shopify: {
        id: sourceId,
        name: `Shopify - ${integration.name}`,
        sourceDefinitionId: '9da77001-af33-4bcd-be46-6252bf9342b9',
        connectionConfiguration: {
          shop: '${SHOPIFY_SHOP_NAME}',
          credentials: {
            auth_method: 'api_password',
            api_password: '${SHOPIFY_API_PASSWORD}'
          },
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      },
      mailchimp: {
        id: sourceId,
        name: `Mailchimp - ${integration.name}`,
        sourceDefinitionId: 'b2e40e36-5e53-4d0a-a3a9-fd0a00ad5ced',
        connectionConfiguration: {
          credentials: {
            auth_type: 'apikey',
            apikey: '${MAILCHIMP_API_KEY}'
          },
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    };

    return sourceConfigs[integration.provider?.toLowerCase()] || null;
  }

  private generateStreamsForSource(source: any, entities: any): any[] {
    const streams: any[] = [];
    
    // Map common streams based on source type
    if (source.name.includes('Stripe')) {
      streams.push(
        { name: 'customers', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'created' },
        { name: 'charges', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'created' },
        { name: 'invoices', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'created' },
        { name: 'subscriptions', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'created' }
      );
    } else if (source.name.includes('Salesforce')) {
      streams.push(
        { name: 'Account', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'LastModifiedDate' },
        { name: 'Contact', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'LastModifiedDate' },
        { name: 'Lead', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'LastModifiedDate' },
        { name: 'Opportunity', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'LastModifiedDate' }
      );
    } else if (source.name.includes('HubSpot')) {
      streams.push(
        { name: 'contacts', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'lastmodifieddate' },
        { name: 'companies', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'hs_lastmodifieddate' },
        { name: 'deals', syncMode: 'incremental', destinationSyncMode: 'append_dedup', cursorField: 'hs_lastmodifieddate' }
      );
    }

    return streams;
  }

  private async generateAirbyteFiles(airbyteConfig: AirbyteConfig): Promise<void> {
    const airbyteDir = path.join(this.outputDir, 'airbyte');
    
    // Create airbyte directory structure
    const dirs = [
      'airbyte',
      'airbyte/configs',
      'airbyte/transformations',
      'airbyte/monitoring'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    // Generate Airbyte configuration JSON
    const configJson = {
      version: '0.50.0',
      sources: airbyteConfig.sources,
      destinations: airbyteConfig.destinations,
      connections: airbyteConfig.connections
    };

    fs.writeFileSync(
      path.join(airbyteDir, 'configs', 'airbyte-config.json'),
      JSON.stringify(configJson, null, 2)
    );

    // Generate environment variables template
    const envTemplate = `
# Airbyte Configuration
AIRBYTE_API_URL=http://localhost:8001/api/v1
AIRBYTE_USERNAME=airbyte
AIRBYTE_PASSWORD=password

# Integration Credentials
${airbyteConfig.sources.map(source => {
  if (source.name.includes('Stripe')) {
    return 'STRIPE_SECRET_KEY=sk_test_...\nSTRIPE_ACCOUNT_ID=acct_...';
  } else if (source.name.includes('Salesforce')) {
    return 'SALESFORCE_CLIENT_ID=...\nSALESFORCE_CLIENT_SECRET=...\nSALESFORCE_REFRESH_TOKEN=...';
  } else if (source.name.includes('HubSpot')) {
    return 'HUBSPOT_ACCESS_TOKEN=...';
  } else if (source.name.includes('QuickBooks')) {
    return 'QUICKBOOKS_CLIENT_ID=...\nQUICKBOOKS_CLIENT_SECRET=...\nQUICKBOOKS_REFRESH_TOKEN=...\nQUICKBOOKS_ACCESS_TOKEN=...\nQUICKBOOKS_REALM_ID=...';
  } else if (source.name.includes('Shopify')) {
    return 'SHOPIFY_SHOP_NAME=...\nSHOPIFY_API_PASSWORD=...';
  } else if (source.name.includes('Mailchimp')) {
    return 'MAILCHIMP_API_KEY=...';
  }
  return '';
}).filter(Boolean).join('\n\n')}
`;

    // Append to existing .env.local
    const envPath = path.join(this.outputDir, '.env.local');
    if (fs.existsSync(envPath)) {
      const existingEnv = fs.readFileSync(envPath, 'utf8');
      fs.writeFileSync(envPath, existingEnv + '\n' + envTemplate);
    } else {
      fs.writeFileSync(envPath, envTemplate);
    }
  }

  private async generateDockerCompose(): Promise<void> {
    const dockerCompose = `
version: '3.8'

services:
  # Airbyte Services
  airbyte-init:
    image: airbyte/init:0.50.0
    container_name: init
    command: /bin/sh -c "sleep 5"
    environment:
      - DATABASE_USER=docker
      - DATABASE_PASSWORD=docker
      - DATABASE_URL=jdbc:postgresql://db:5432/airbyte
    depends_on:
      - db

  airbyte-db:
    image: airbyte/db:0.50.0
    container_name: airbyte-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=docker
      - POSTGRES_PASSWORD=docker
      - POSTGRES_DB=airbyte
    volumes:
      - airbyte_db:/var/lib/postgresql/data

  airbyte-server:
    image: airbyte/server:0.50.0
    container_name: airbyte-server
    restart: unless-stopped
    environment:
      - DATABASE_USER=docker
      - DATABASE_PASSWORD=docker
      - DATABASE_URL=jdbc:postgresql://db:5432/airbyte
      - WORKSPACE_ROOT=/tmp/workspace
      - WORKSPACE_DOCKER_MOUNT=airbyte_workspace
      - LOCAL_ROOT=/tmp/airbyte_local
      - LOCAL_DOCKER_MOUNT=/tmp/airbyte_local
      - WEBAPP_URL=http://localhost:8000
      - API_URL=/api/v1/
    ports:
      - "8001:8001"
    volumes:
      - airbyte_workspace:/tmp/workspace
      - airbyte_local:/tmp/airbyte_local
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - airbyte-db

  airbyte-webapp:
    image: airbyte/webapp:0.50.0
    container_name: airbyte-webapp
    restart: unless-stopped
    ports:
      - "8000:80"
    environment:
      - API_URL=http://airbyte-server:8001/api/v1/
    depends_on:
      - airbyte-server

  airbyte-worker:
    image: airbyte/worker:0.50.0
    container_name: airbyte-worker
    restart: unless-stopped
    environment:
      - DATABASE_USER=docker
      - DATABASE_PASSWORD=docker
      - DATABASE_URL=jdbc:postgresql://db:5432/airbyte
      - WORKSPACE_ROOT=/tmp/workspace
      - WORKSPACE_DOCKER_MOUNT=airbyte_workspace
      - LOCAL_ROOT=/tmp/airbyte_local
      - LOCAL_DOCKER_MOUNT=/tmp/airbyte_local
    volumes:
      - airbyte_workspace:/tmp/workspace
      - airbyte_local:/tmp/airbyte_local
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - airbyte-server

volumes:
  airbyte_db:
  airbyte_workspace:
  airbyte_local:
`;

    fs.writeFileSync(
      path.join(this.outputDir, 'airbyte', 'docker-compose.yml'),
      dockerCompose
    );

    // Add npm scripts
    const packageJsonPath = path.join(this.outputDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.scripts = {
        ...packageJson.scripts,
        'airbyte:start': 'cd airbyte && docker-compose up -d',
        'airbyte:stop': 'cd airbyte && docker-compose down',
        'airbyte:logs': 'cd airbyte && docker-compose logs -f',
        'airbyte:reset': 'cd airbyte && docker-compose down -v && docker-compose up -d'
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }

  private async generateDataSyncServices(airbyteConfig: AirbyteConfig): Promise<void> {
    const servicesDir = path.join(this.outputDir, 'lib', 'services');
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }

    const dataSyncService = `
import { supabaseAdmin } from '../supabase'

export class DataSyncService {
  private static readonly AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || 'http://localhost:8001/api/v1'
  
  static async triggerSync(connectionId: string): Promise<void> {
    try {
      const response = await fetch(\`\${this.AIRBYTE_API_URL}/connections/\${connectionId}/sync\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error(\`Failed to trigger sync: \${response.statusText}\`)
      }

      console.log(\`Triggered sync for connection \${connectionId}\`)
    } catch (error) {
      console.error('Error triggering sync:', error)
      throw error
    }
  }

  static async getSyncStatus(connectionId: string): Promise<any> {
    try {
      const response = await fetch(\`\${this.AIRBYTE_API_URL}/connections/\${connectionId}/jobs\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(\`Failed to get sync status: \${response.statusText}\`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting sync status:', error)
      throw error
    }
  }

  static async scheduleBulkSync(): Promise<void> {
    const connections = ${JSON.stringify(airbyteConfig.connections.map(c => c.sourceId), null, 2)}
    
    for (const connectionId of connections) {
      try {
        await this.triggerSync(connectionId)
        console.log(\`Scheduled sync for \${connectionId}\`)
      } catch (error) {
        console.error(\`Failed to schedule sync for \${connectionId}:\`, error)
      }
    }
  }

  static async syncDataToSupabase(tableName: string, data: any[]): Promise<void> {
    if (!data || data.length === 0) return

    try {
      // Upsert data to Supabase
      const { error } = await supabaseAdmin
        .from(tableName)
        .upsert(data, { onConflict: 'id' })

      if (error) {
        throw error
      }

      console.log(\`Synced \${data.length} records to \${tableName}\`)
    } catch (error) {
      console.error(\`Error syncing data to \${tableName}:\`, error)
      throw error
    }
  }

  static async getLastSyncTimestamp(connectionId: string): Promise<Date | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('sync_metadata')
        .select('last_sync')
        .eq('connection_id', connectionId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data?.last_sync ? new Date(data.last_sync) : null
    } catch (error) {
      console.error('Error getting last sync timestamp:', error)
      return null
    }
  }

  static async updateLastSyncTimestamp(connectionId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('sync_metadata')
        .upsert({
          connection_id: connectionId,
          last_sync: new Date().toISOString()
        }, { onConflict: 'connection_id' })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error updating last sync timestamp:', error)
      throw error
    }
  }
}
`;

    fs.writeFileSync(path.join(servicesDir, 'DataSyncService.ts'), dataSyncService);

    // Generate sync metadata table migration
    const migrationsDir = path.join(this.outputDir, 'supabase', 'migrations');
    const timestamp = new Date(Date.now() + 20000).toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    
    const syncMetadataMigration = `
-- Create sync metadata table
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id TEXT UNIQUE NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS sync_metadata_connection_id_idx ON sync_metadata(connection_id);
CREATE INDEX IF NOT EXISTS sync_metadata_last_sync_idx ON sync_metadata(last_sync);

-- Enable RLS
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy for system access
CREATE POLICY "sync_metadata_system_access" ON sync_metadata
  USING (true);
`;

    fs.writeFileSync(
      path.join(migrationsDir, `${timestamp}_sync_metadata.sql`),
      syncMetadataMigration
    );
  }

  private async generateTransformations(airbyteConfig: AirbyteConfig): Promise<void> {
    const transformationsDir = path.join(this.outputDir, 'airbyte', 'transformations');

    // Generate dbt project file
    const dbtProject = `
name: 'business_intelligence'
version: '1.0.0'
config-version: 2

profile: 'supabase'

model-paths: ["models"]
analysis-paths: ["analysis"]
test-paths: ["tests"]
seed-paths: ["data"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

models:
  business_intelligence:
    staging:
      materialized: view
    marts:
      materialized: table
`;

    fs.writeFileSync(path.join(transformationsDir, 'dbt_project.yml'), dbtProject);

    // Generate profiles.yml
    const profilesYml = `
supabase:
  target: dev
  outputs:
    dev:
      type: postgres
      host: localhost
      user: postgres
      password: postgres
      port: 54322
      dbname: postgres
      schema: public
      threads: 4
      keepalives_idle: 0
`;

    fs.writeFileSync(path.join(transformationsDir, 'profiles.yml'), profilesYml);

    // Generate staging models for each source
    const modelsDir = path.join(transformationsDir, 'models');
    const stagingDir = path.join(modelsDir, 'staging');
    
    if (!fs.existsSync(stagingDir)) {
      fs.mkdirSync(stagingDir, { recursive: true });
    }

    airbyteConfig.sources.forEach(source => {
      if (source.name.includes('Stripe')) {
        const stripeStaging = `
-- Staging model for Stripe customers
{{ config(materialized='view') }}

SELECT
  id,
  email,
  name,
  description,
  created,
  metadata,
  CURRENT_TIMESTAMP as synced_at
FROM {{ source('stripe', 'customers') }}
`;
        fs.writeFileSync(path.join(stagingDir, 'stg_stripe_customers.sql'), stripeStaging);
      }
    });

    // Generate marts directory and models
    const martsDir = path.join(modelsDir, 'marts');
    if (!fs.existsSync(martsDir)) {
      fs.mkdirSync(martsDir, { recursive: true });
    }

    const customerAnalytics = `
-- Customer analytics mart
{{ config(materialized='table') }}

WITH customer_metrics AS (
  SELECT
    c.id as customer_id,
    c.email,
    c.name,
    c.created as customer_created_at,
    COUNT(ch.id) as total_charges,
    SUM(ch.amount) / 100.0 as total_revenue,
    AVG(ch.amount) / 100.0 as avg_order_value,
    MAX(ch.created) as last_purchase_date,
    EXTRACT(DAYS FROM CURRENT_DATE - MAX(ch.created)::date) as days_since_last_purchase
  FROM {{ ref('stg_stripe_customers') }} c
  LEFT JOIN {{ source('stripe', 'charges') }} ch ON c.id = ch.customer
  WHERE ch.status = 'succeeded'
  GROUP BY c.id, c.email, c.name, c.created
)

SELECT
  *,
  CASE 
    WHEN days_since_last_purchase <= 30 THEN 'Active'
    WHEN days_since_last_purchase <= 90 THEN 'At Risk'
    ELSE 'Churned'
  END as customer_segment
FROM customer_metrics
`;

    fs.writeFileSync(path.join(martsDir, 'customer_analytics.sql'), customerAnalytics);
  }

  private async generateMonitoring(airbyteConfig: AirbyteConfig): Promise<void> {
    const monitoringDir = path.join(this.outputDir, 'airbyte', 'monitoring');

    // Generate monitoring service
    const monitoringService = `
import { supabaseAdmin } from '../../lib/supabase'
import { DataSyncService } from '../../lib/services/DataSyncService'

export class AirbyteMonitoringService {
  static async checkConnectionHealth(): Promise<void> {
    const connections = ${JSON.stringify(airbyteConfig.connections.map(c => ({ id: c.sourceId, name: c.name })), null, 2)}
    
    for (const connection of connections) {
      try {
        const status = await DataSyncService.getSyncStatus(connection.id)
        
        // Log health status
        await this.logHealthStatus(connection.id, connection.name, status)
        
        // Check for failed syncs
        if (status.jobs && status.jobs.length > 0) {
          const latestJob = status.jobs[0]
          if (latestJob.status === 'failed') {
            await this.alertFailedSync(connection.id, connection.name, latestJob)
          }
        }
        
      } catch (error) {
        console.error(\`Health check failed for \${connection.name}:\`, error)
        await this.alertConnectionError(connection.id, connection.name, error)
      }
    }
  }

  static async logHealthStatus(connectionId: string, connectionName: string, status: any): Promise<void> {
    try {
      await supabaseAdmin
        .from('airbyte_health_logs')
        .insert({
          connection_id: connectionId,
          connection_name: connectionName,
          status: status.status || 'unknown',
          job_count: status.jobs?.length || 0,
          last_success: status.jobs?.find((j: any) => j.status === 'succeeded')?.createdAt,
          metadata: status,
          checked_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging health status:', error)
    }
  }

  static async alertFailedSync(connectionId: string, connectionName: string, failedJob: any): Promise<void> {
    console.error(\`ALERT: Sync failed for \${connectionName}\`, failedJob)
    
    // Insert alert record
    try {
      await supabaseAdmin
        .from('alerts')
        .insert({
          type: 'sync_failure',
          severity: 'high',
          title: \`Sync Failed: \${connectionName}\`,
          message: \`Connection \${connectionName} failed to sync. Job ID: \${failedJob.id}\`,
          metadata: {
            connection_id: connectionId,
            job_id: failedJob.id,
            error: failedJob.failureReason
          },
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  static async alertConnectionError(connectionId: string, connectionName: string, error: any): Promise<void> {
    console.error(\`ALERT: Connection error for \${connectionName}\`, error)
    
    try {
      await supabaseAdmin
        .from('alerts')
        .insert({
          type: 'connection_error',
          severity: 'critical',
          title: \`Connection Error: \${connectionName}\`,
          message: \`Unable to connect to \${connectionName}. Error: \${error.message}\`,
          metadata: {
            connection_id: connectionId,
            error: error.message,
            stack: error.stack
          },
          created_at: new Date().toISOString()
        })
    } catch (insertError) {
      console.error('Error creating connection error alert:', insertError)
    }
  }

  static async generateHealthReport(): Promise<any> {
    try {
      const { data: healthLogs, error } = await supabaseAdmin
        .from('airbyte_health_logs')
        .select('*')
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('checked_at', { ascending: false })

      if (error) throw error

      const report = {
        totalConnections: healthLogs?.length || 0,
        healthyConnections: healthLogs?.filter(log => log.status === 'active').length || 0,
        failedConnections: healthLogs?.filter(log => log.status === 'failed').length || 0,
        lastCheck: new Date().toISOString(),
        details: healthLogs || []
      }

      return report
    } catch (error) {
      console.error('Error generating health report:', error)
      throw error
    }
  }
}

// Schedule health checks every 5 minutes
if (typeof window === 'undefined') {
  setInterval(async () => {
    try {
      await AirbyteMonitoringService.checkConnectionHealth()
    } catch (error) {
      console.error('Scheduled health check failed:', error)
    }
  }, 5 * 60 * 1000)
}
`;

    fs.writeFileSync(path.join(monitoringDir, 'AirbyteMonitoringService.ts'), monitoringService);

    // Generate health check migration
    const migrationsDir = path.join(this.outputDir, 'supabase', 'migrations');
    const timestamp = new Date(Date.now() + 25000).toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    
    const healthLogsMigration = `
-- Create airbyte health logs table
CREATE TABLE IF NOT EXISTS airbyte_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id TEXT NOT NULL,
  connection_name TEXT NOT NULL,
  status TEXT NOT NULL,
  job_count INTEGER DEFAULT 0,
  last_success TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS airbyte_health_logs_connection_id_idx ON airbyte_health_logs(connection_id);
CREATE INDEX IF NOT EXISTS airbyte_health_logs_checked_at_idx ON airbyte_health_logs(checked_at);
CREATE INDEX IF NOT EXISTS airbyte_health_logs_status_idx ON airbyte_health_logs(status);

-- Enable RLS
ALTER TABLE airbyte_health_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system access
CREATE POLICY "airbyte_health_logs_system_access" ON airbyte_health_logs
  USING (true);
`;

    fs.writeFileSync(
      path.join(migrationsDir, `${timestamp}_airbyte_health_logs.sql`),
      healthLogsMigration
    );
  }
}