import { SyncJob } from '../types';
export declare class SyncService {
    /**
     * Start a sync job
     */
    startSync(integrationId: string): Promise<SyncJob>;
    /**
     * Stop a sync job
     */
    stopSync(jobId: string): Promise<void>;
    /**
     * Get sync status
     */
    getSyncStatus(jobId: string): Promise<SyncJob | null>;
}
//# sourceMappingURL=sync-service.d.ts.map