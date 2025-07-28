"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseBackup = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class DatabaseBackup {
    constructor(backupDir = './backups') {
        this.backupDir = backupDir;
        this.ensureBackupDir();
    }
    /**
     * Create backup directory if it doesn't exist
     */
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    /**
     * Backup tenant data
     */
    async backupTenant(tenantId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `tenant_${tenantId}_${timestamp}.sql`;
        const filepath = path.join(this.backupDir, filename);
        try {
            // Use pg_dump to backup the database
            await execAsync(`pg_dump --host=${process.env.DB_HOST} --port=${process.env.DB_PORT} --username=${process.env.DB_USER} --dbname=${process.env.DB_NAME} --file=${filepath}`);
            const stats = fs.statSync(filepath);
            return {
                id: `backup_${Date.now()}`,
                filename,
                size: stats.size,
                createdAt: new Date(),
                status: 'completed'
            };
        }
        catch (error) {
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
    async restoreTenant(_tenantId, backupPath) {
        try {
            // Use psql to restore the database
            await execAsync(`psql --host=${process.env.DB_HOST} --port=${process.env.DB_PORT} --username=${process.env.DB_USER} --dbname=${process.env.DB_NAME} --file=${backupPath}`);
            return true;
        }
        catch (error) {
            console.error('Restore failed:', error);
            return false;
        }
    }
    /**
     * List available backups
     */
    listBackups() {
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
    cleanupOldBackups() {
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
                }
                catch (error) {
                    console.error(`Failed to delete backup ${backup}:`, error);
                }
            });
        }
    }
}
exports.DatabaseBackup = DatabaseBackup;
//# sourceMappingURL=backup.js.map