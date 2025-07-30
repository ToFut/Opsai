import cron from 'node-cron';
import { dataSyncService } from './sync-service';

// Schedule data synchronization every 15 minutes
export function startDataSyncCron(): void {
  console.log('⏰ Starting data sync cron jobs...');
  
  // Sync all integrations every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 Running scheduled data sync...');
    try {
      await dataSyncService.syncAllData();
    } catch (error) {
      console.error('Scheduled sync failed:', error);
    }
  });
  
  // Initial sync on startup
  setTimeout(async () => {
    console.log('🚀 Running initial data sync...');
    try {
      await dataSyncService.syncAllData();
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
  }, 5000); // Wait 5 seconds for server to be ready
  
  console.log('✅ Data sync cron jobs started');
}

// Export manual sync function
export async function runManualSync(): Promise<void> {
  console.log('🔄 Running manual data sync...');
  await dataSyncService.syncAllData();
}