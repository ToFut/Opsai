import axios from 'axios'

export interface AirbyteConnection {
  sourceId: string
  destinationId: string
  syncCatalog: any
  status: 'active' | 'inactive' | 'error'
}

export class AirbyteDiscoveryService {
  private airbyteUrl: string
  private airbyteApiKey: string

  constructor() {
    this.airbyteUrl = process.env.AIRBYTE_API_URL || 'http://localhost:8000/api/v1'
    this.airbyteApiKey = process.env.AIRBYTE_API_KEY!
  }

  async discoverSchema(sourceConfig: any) {
    try {
      // Create a temporary source to discover schema
      const source = await this.createSource(sourceConfig)
      
      // Discover available streams
      const discovery = await axios.post(
        `${this.airbyteUrl}/sources/discover_schema`,
        { sourceId: source.sourceId },
        {
          headers: {
            'Authorization': `Bearer ${this.airbyteApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        catalog: discovery.data.catalog,
        streams: this.parseStreams(discovery.data.catalog)
      }
    } catch (error) {
      console.error('Schema discovery failed:', error)
      throw error
    }
  }

  async sampleData(sourceId: string, streamName: string, limit = 100) {
    try {
      // Use Airbyte's read endpoint to get sample data
      const response = await axios.post(
        `${this.airbyteUrl}/sources/read`,
        {
          sourceId,
          streamName,
          limit
        },
        {
          headers: {
            'Authorization': `Bearer ${this.airbyteApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.records
    } catch (error) {
      console.error('Data sampling failed:', error)
      throw error
    }
  }

  async createConnection(
    tenantId: string,
    sourceConfig: any,
    destinationConfig: any
  ): Promise<AirbyteConnection> {
    // Create source
    const source = await this.createSource({
      ...sourceConfig,
      name: `${tenantId}_${sourceConfig.type}_source`
    })

    // Create destination (usually our PostgreSQL)
    const destination = await this.createDestination({
      ...destinationConfig,
      name: `${tenantId}_postgres_destination`,
      database: `tenant_${tenantId}`
    })

    // Create connection
    const connection = await axios.post(
      `${this.airbyteUrl}/connections/create`,
      {
        sourceId: source.sourceId,
        destinationId: destination.destinationId,
        syncCatalog: source.catalog,
        status: 'active',
        schedule: {
          timeUnit: 'hours',
          units: 1
        },
        namespaceDefinition: 'destination',
        prefix: `${tenantId}_`
      },
      {
        headers: {
          'Authorization': `Bearer ${this.airbyteApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      sourceId: source.sourceId,
      destinationId: destination.destinationId,
      syncCatalog: source.catalog,
      status: 'active'
    }
  }

  private async createSource(config: any) {
    const sourceDefinitions = {
      'salesforce': 'airbyte/source-salesforce',
      'shopify': 'airbyte/source-shopify',
      'stripe': 'airbyte/source-stripe',
      'postgres': 'airbyte/source-postgres',
      'google-sheets': 'airbyte/source-google-sheets',
      'hubspot': 'airbyte/source-hubspot'
    }

    const response = await axios.post(
      `${this.airbyteUrl}/sources/create`,
      {
        sourceDefinitionId: sourceDefinitions[config.type],
        connectionConfiguration: config.connectionConfig,
        name: config.name
      },
      {
        headers: {
          'Authorization': `Bearer ${this.airbyteApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  }

  private async createDestination(config: any) {
    const response = await axios.post(
      `${this.airbyteUrl}/destinations/create`,
      {
        destinationDefinitionId: 'airbyte/destination-postgres',
        connectionConfiguration: {
          host: process.env.DATABASE_HOST,
          port: 5432,
          database: config.database,
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          ssl_mode: { mode: 'require' }
        },
        name: config.name
      },
      {
        headers: {
          'Authorization': `Bearer ${this.airbyteApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  }

  private parseStreams(catalog: any) {
    return catalog.streams.map((stream: any) => ({
      name: stream.name,
      jsonSchema: stream.jsonSchema,
      supportedSyncModes: stream.supportedSyncModes,
      fields: this.extractFields(stream.jsonSchema)
    }))
  }

  private extractFields(jsonSchema: any) {
    const fields: any[] = []
    
    if (jsonSchema.properties) {
      Object.entries(jsonSchema.properties).forEach(([key, value]: [string, any]) => {
        fields.push({
          name: key,
          type: value.type,
          format: value.format,
          required: jsonSchema.required?.includes(key) || false
        })
      })
    }

    return fields
  }
}