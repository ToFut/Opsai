import { BackupResult } from '@opsai/shared';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export class DatabaseBackup {
  private backupDir: string;

  constructor(backupDir: string = './backups') {
    this.backupDir = backupDir;
    this.ensureBackupDir();
  }

  /**
   * Create backup directory if it doesn't exist
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Backup tenant data
   */
  async backupTenant(tenantId: string): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tenant_${tenantId}_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      // Use pg_dump to backup the database
      await execAsync(
        `pg_dump --host=${process.env.DB_HOST} --port=${process.env.DB_PORT} --username=${process.env.DB_USER} --dbname=${process.env.DB_NAME} --file=${filepath}`
      );

      const stats = fs.statSync(filepath);
      
      return {
        id: `backup_${Date.now()}`,
        filename,
        size: stats.size,
        createdAt: new Date(),
        status: 'completed'
      };
    } catch (error) {
      console.error('Backup failed:', error);
      return {
        id: `backup_${Date.now()}`,
        filename,
        size: 0,
        createdAt: new Date(),
        status: 'failed'
      };
    }
  }

  /**
   * Restore tenant data
   */
  async restoreTenant(_tenantId: string, backupPath: string): Promise<boolean> {
    try {
      // Use psql to restore the database
      await execAsync(
        `psql --host=${process.env.DB_HOST} --port=${process.env.DB_PORT} --username=${process.env.DB_USER} --dbname=${process.env.DB_NAME} --file=${backupPath}`
      );
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  /**
   * List available backups
   */
  listBackups(): string[] {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    return fs.readdirSync(this.backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(this.backupDir, file));
  }

  /**
   * Clean up old backups (keep last 10)
   */
  cleanupOldBackups(): void {
    const backups = this.listBackups();
    
    if (backups.length > 10) {
      // Sort by modification time and remove oldest
      const sortedBackups = backups.sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statA.mtime.getTime() - statB.mtime.getTime();
      });

      const toDelete = sortedBackups.slice(0, backups.length - 10);
      
      toDelete.forEach(backup => {
        try {
          fs.unlinkSync(backup);
          console.log(`Deleted old backup: ${backup}`);
        } catch (error) {
          console.error(`Failed to delete backup ${backup}:`, error);
        }
      });
    }
  }
} 