import { PrismaClient } from '@prisma/client';
export interface BackupResult {
    id: string;
    filename: string;
    size: number;
    createdAt: Date;
    status: 'completed' | 'failed' | 'in_progress';
}
export declare class DatabaseBackup {
    private prisma;
    constructor(prisma: PrismaClient);
    createBackup(): Promise<BackupResult>;
    restoreBackup(backupId: string): Promise<void>;
    listBackups(): Promise<BackupResult[]>;
    deleteBackup(backupId: string): Promise<void>;
}
//# sourceMappingURL=backup.d.ts.map