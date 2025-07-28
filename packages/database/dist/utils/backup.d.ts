import { BackupResult } from '@opsai/shared';
export declare class DatabaseBackup {
    private backupDir;
    constructor(backupDir?: string);
    /**
     * Create backup directory if it doesn't exist
     */
    private ensureBackupDir;
    /**
     * Backup tenant data
     */
    backupTenant(tenantId: string): Promise<BackupResult>;
    /**
     * Restore tenant data
     */
    restoreTenant(_tenantId: string, backupPath: string): Promise<boolean>;
    /**
     * List available backups
     */
    listBackups(): string[];
    /**
     * Clean up old backups (keep last 10)
     */
    cleanupOldBackups(): void;
}
//# sourceMappingURL=backup.d.ts.map