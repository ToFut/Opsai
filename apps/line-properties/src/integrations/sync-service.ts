import { PrismaClient } from '@prisma/client';
import { IntegrationService, createAirbyteConnector } from '@opsai/integration';
import { guestyApiClient } from './guesty_api';
import { emailServiceClient } from './email_service';

const prisma = new PrismaClient();

export class DataSyncService {
  private integrationService: IntegrationService;
  
  constructor() {
    this.integrationService = new IntegrationService({
      tenantId: process.env.TENANT_ID || 'default-tenant',
      logger: console
    });
  }

  async syncAllData(): Promise<void> {
    console.log('🔄 Starting data synchronization...');
    
    try {
      await this.syncGuestyApiData();
      await this.syncEmailServiceData();
      
      console.log('✅ All data synchronized successfully');
    } catch (error) {
      console.error('❌ Data synchronization failed:', error);
      throw error;
    }
  }


  async syncGuestyApiData(): Promise<void> {
    console.log('🔄 Syncing guesty_api data...');
    
    try {
      // Sync get_listings data
      try {
        const getListingsData = await guestyApiClient.getListings();
        
        if (Array.isArray(getListingsData)) {
          await this.upsertData('property', getListingsData, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + getListingsData.length + ' get_listings records');
        } else if (getListingsData?.data && Array.isArray(getListingsData.data)) {
          await this.upsertData('property', getListingsData.data, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + getListingsData.data.length + ' get_listings records');
        } else {
          console.warn('Unexpected data format from get_listings:', getListingsData);
        }
      } catch (error) {
        console.error('Failed to sync get_listings:', error);
        
        // Try Airbyte fallback
        try {
          const airbyteConnector = createAirbyteConnector({
            sourceType: 'rest-api',
            config: {
              baseUrl: guestyApiClient.config.baseUrl,
              endpoints: ['/listings']
            },
            tenantId: process.env.TENANT_ID || "default-tenant"
          });
          
          const fallbackData = await airbyteConnector.execute('sync', {
            endpoint: '/listings',
            method: 'GET'
          });
          
          if (fallbackData?.records) {
            await this.upsertData('property', fallbackData.records, process.env.TENANT_ID || "default-tenant");
            console.log('✅ Synced ' + fallbackData.records.length + ' get_listings records via Airbyte fallback');
          }
        } catch (fallbackError) {
          console.error('Airbyte fallback also failed:', fallbackError);
        }
      }

      // Sync create_reservation data
      try {
        const createReservationData = await guestyApiClient.createReservation();
        
        if (Array.isArray(createReservationData)) {
          await this.upsertData('reservation', createReservationData, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + createReservationData.length + ' create_reservation records');
        } else if (createReservationData?.data && Array.isArray(createReservationData.data)) {
          await this.upsertData('reservation', createReservationData.data, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + createReservationData.data.length + ' create_reservation records');
        } else {
          console.warn('Unexpected data format from create_reservation:', createReservationData);
        }
      } catch (error) {
        console.error('Failed to sync create_reservation:', error);
        
        // Try Airbyte fallback
        try {
          const airbyteConnector = createAirbyteConnector({
            sourceType: 'rest-api',
            config: {
              baseUrl: guestyApiClient.config.baseUrl,
              endpoints: ['/reservations']
            },
            tenantId: process.env.TENANT_ID || "default-tenant"
          });
          
          const fallbackData = await airbyteConnector.execute('sync', {
            endpoint: '/reservations',
            method: 'POST'
          });
          
          if (fallbackData?.records) {
            await this.upsertData('reservation', fallbackData.records, process.env.TENANT_ID || "default-tenant");
            console.log('✅ Synced ' + fallbackData.records.length + ' create_reservation records via Airbyte fallback');
          }
        } catch (fallbackError) {
          console.error('Airbyte fallback also failed:', fallbackError);
        }
      }

      // Sync refresh_token data
      try {
        const refreshTokenData = await guestyApiClient.refreshToken();
        
        if (Array.isArray(refreshTokenData)) {
          await this.upsertData('property', refreshTokenData, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + refreshTokenData.length + ' refresh_token records');
        } else if (refreshTokenData?.data && Array.isArray(refreshTokenData.data)) {
          await this.upsertData('property', refreshTokenData.data, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + refreshTokenData.data.length + ' refresh_token records');
        } else {
          console.warn('Unexpected data format from refresh_token:', refreshTokenData);
        }
      } catch (error) {
        console.error('Failed to sync refresh_token:', error);
        
        // Try Airbyte fallback
        try {
          const airbyteConnector = createAirbyteConnector({
            sourceType: 'rest-api',
            config: {
              baseUrl: guestyApiClient.config.baseUrl,
              endpoints: ['/oauth2/token']
            },
            tenantId: process.env.TENANT_ID || "default-tenant"
          });
          
          const fallbackData = await airbyteConnector.execute('sync', {
            endpoint: '/oauth2/token',
            method: 'POST'
          });
          
          if (fallbackData?.records) {
            await this.upsertData('property', fallbackData.records, process.env.TENANT_ID || "default-tenant");
            console.log('✅ Synced ' + fallbackData.records.length + ' refresh_token records via Airbyte fallback');
          }
        } catch (fallbackError) {
          console.error('Airbyte fallback also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('guesty_api sync failed:', error);
      throw error;
    }
  }


  async syncEmailServiceData(): Promise<void> {
    console.log('🔄 Syncing email_service data...');
    
    try {
      // Sync send_email data
      try {
        const sendEmailData = await emailServiceClient.sendEmail();
        
        if (Array.isArray(sendEmailData)) {
          await this.upsertData('property', sendEmailData, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + sendEmailData.length + ' send_email records');
        } else if (sendEmailData?.data && Array.isArray(sendEmailData.data)) {
          await this.upsertData('property', sendEmailData.data, process.env.TENANT_ID || "default-tenant");
          console.log('✅ Synced ' + sendEmailData.data.length + ' send_email records');
        } else {
          console.warn('Unexpected data format from send_email:', sendEmailData);
        }
      } catch (error) {
        console.error('Failed to sync send_email:', error);
        
        // Try Airbyte fallback
        try {
          const airbyteConnector = createAirbyteConnector({
            sourceType: 'rest-api',
            config: {
              baseUrl: emailServiceClient.config.baseUrl,
              endpoints: ['/emails']
            },
            tenantId: process.env.TENANT_ID || "default-tenant"
          });
          
          const fallbackData = await airbyteConnector.execute('sync', {
            endpoint: '/emails',
            method: 'POST'
          });
          
          if (fallbackData?.records) {
            await this.upsertData('property', fallbackData.records, process.env.TENANT_ID || "default-tenant");
            console.log('✅ Synced ' + fallbackData.records.length + ' send_email records via Airbyte fallback');
          }
        } catch (fallbackError) {
          console.error('Airbyte fallback also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('email_service sync failed:', error);
      throw error;
    }
  }

  private async upsertData(tableName: string, data: any[], tenantId: string): Promise<void> {
    for (const item of data) {
      try {
        // Add tenant isolation
        const itemWithTenant = { ...item, tenantId };
        
        // Use upsert to handle both create and update
        await (prisma as any)[tableName].upsert({
          where: { id: item.id || 'external-' + Date.now() + '-' + Math.random() },
          update: itemWithTenant,
          create: {
            id: item.id || 'external-' + Date.now() + '-' + Math.random(),
            ...itemWithTenant
          }
        });
      } catch (error) {
        console.warn('Failed to upsert ' + tableName + ' item:', error);
      }
    }
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();