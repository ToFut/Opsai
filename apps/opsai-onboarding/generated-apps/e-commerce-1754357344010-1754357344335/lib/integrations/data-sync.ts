import { createAirbyteConnector } from '@opsai/integration'

export class DataSyncService {
  private airbyte = createAirbyteConnector({
    apiKey: process.env.AIRBYTE_API_KEY,
    baseUrl: process.env.AIRBYTE_BASE_URL || 'http://localhost:8000',
    workspaceId: process.env.AIRBYTE_WORKSPACE_ID
  })
  
  async syncDataSource(sourceConfig: any, tenantId: string) {
    try {
      // Create Airbyte source
      const source = await this.airbyte.execute('create_source', {
        name: `${tenantId}-${sourceConfig.name}`,
        sourceType: sourceConfig.type,
        configuration: sourceConfig.config
      })
      
      // Create destination (our database)
      const destination = await this.airbyte.execute('create_destination', {
        name: `${tenantId}-database`,
        destinationType: 'postgres',
        configuration: {
          host: process.env.DATABASE_URL,
          database: `tenant_${tenantId}`,
          schema: 'synced_data'
        }
      })
      
      // Create connection
      const connection = await this.airbyte.execute('create_connection', {
        sourceId: source.sourceId,
        destinationId: destination.destinationId,
        schedule: { timeUnit: 'hours', units: 1 }
      })
      
      // Trigger initial sync
      const syncJob = await this.airbyte.execute('trigger_sync', {
        connectionId: connection.connectionId
      })
      
      // Save sync configuration
      await // prisma.create({
        data: {
          tenantId,
          provider: sourceConfig.type,
          connectionId: connection.connectionId,
          status: 'active',
          config: sourceConfig
        }
      })
      
      return { success: true, syncJobId: syncJob.jobId }
    } catch (error) {
      console.error('Sync failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  async getSyncStatus(jobId: string) {
    return this.airbyte.execute('get_sync_status', { jobId })
  }
}