import { DataSyncService, SyncReport } from './data-sync-service';
import { integrationService } from '../integrations';

export interface SyncMetrics {
  timestamp: string;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  integrationHealth: Record<string, boolean>;
}

export class SyncMonitor {
  private syncService: DataSyncService;
  private metrics: SyncMetrics[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.syncService = new DataSyncService();
  }

  async startMonitoring(intervalMinutes: number = 15): Promise<void> {
    if (this.isMonitoring) {
      console.log('🔍 Sync monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`🔍 Starting sync monitoring (every ${intervalMinutes} minutes)...`);

    // Initial sync validation
    await this.performSyncCheck();

    // Schedule regular checks
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(intervalId);
        return;
      }

      await this.performSyncCheck();
    }, intervalMs);

    console.log('✅ Sync monitoring started');
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛑 Sync monitoring stopped');
  }

  private async performSyncCheck(): Promise<void> {
    try {
      console.log('🔍 Performing sync health check...');
      
      // Check integration health
      const healthStatus = await integrationService.healthCheck();
      const integrationHealth: Record<string, boolean> = {};
      
      Object.entries(healthStatus).forEach(([name, status]) => {
        integrationHealth[name] = status.status === 'healthy';
      });

      // Run sync validation
      const syncReport = await this.syncService.validateAllIntegrationSync();
      
      // Calculate metrics
      const metrics: SyncMetrics = {
        timestamp: new Date().toISOString(),
        totalSyncs: syncReport.results.length,
        successfulSyncs: syncReport.results.filter(r => r.success).length,
        failedSyncs: syncReport.results.filter(r => !r.success).length,
        averageDuration: this.calculateAverageDuration(syncReport.results),
        integrationHealth
      };

      this.metrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      await this.logMetrics(metrics);
      await this.checkAlerts(metrics);
      
    } catch (error) {
      console.error('❌ Sync monitoring check failed:', error);
    }
  }

  private calculateAverageDuration(results: any[]): number {
    if (results.length === 0) return 0;
    
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
    return Math.round(totalDuration / results.length);
  }

  private async logMetrics(metrics: SyncMetrics): Promise<void> {
    const successRate = (metrics.successfulSyncs / metrics.totalSyncs * 100).toFixed(1);
    
    console.log(`📊 Sync Health Report (${metrics.timestamp}):`);
    console.log(`   Success Rate: ${successRate}% (${metrics.successfulSyncs}/${metrics.totalSyncs})`);
    console.log(`   Average Duration: ${metrics.averageDuration}ms`);
    
    // Log integration health
    Object.entries(metrics.integrationHealth).forEach(([integration, healthy]) => {
      const status = healthy ? '✅' : '❌';
      console.log(`   ${status} ${integration}`);
    });

    // Save metrics to file
    const metricsPath = path.join(__dirname, '..', '..', 'sync-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  private async checkAlerts(metrics: SyncMetrics): Promise<void> {
    const successRate = metrics.successfulSyncs / metrics.totalSyncs;
    
    // Alert if success rate drops below 80%
    if (successRate < 0.8) {
      console.log(`🚨 ALERT: Sync success rate is low (${(successRate * 100).toFixed(1)}%)`);
      
      // Log details of failed syncs
      const lastReport = await this.syncService.validateAllIntegrationSync();
      const failures = lastReport.results.filter(r => !r.success);
      
      failures.forEach(failure => {
        console.log(`   ❌ ${failure.integration}:${failure.entity} - ${failure.errors.join(', ')}`);
      });
    }

    // Alert if any integration is unhealthy
    const unhealthyIntegrations = Object.entries(metrics.integrationHealth)
      .filter(([_, healthy]) => !healthy)
      .map(([name, _]) => name);

    if (unhealthyIntegrations.length > 0) {
      console.log(`🚨 ALERT: Unhealthy integrations: ${unhealthyIntegrations.join(', ')}`);
    }

    // Alert if average duration is too high (> 30 seconds)
    if (metrics.averageDuration > 30000) {
      console.log(`🚨 ALERT: Sync operations are slow (avg: ${metrics.averageDuration}ms)`);
    }
  }

  getMetricsHistory(): SyncMetrics[] {
    return [...this.metrics];
  }

  getCurrentHealth(): SyncMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }
}

// Export singleton
export const syncMonitor = new SyncMonitor();