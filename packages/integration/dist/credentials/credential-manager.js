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
exports.credentialManager = exports.CredentialManager = void 0;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs/promises"));
const client_1 = require("@prisma/client");
class CredentialManager {
    constructor() {
        this.credentialCache = new Map();
        // Use environment variable or generate secure key
        const key = process.env.CREDENTIAL_ENCRYPTION_KEY || this.generateSecureKey();
        this.encryptionKey = Buffer.from(key, 'hex');
        this.prisma = new client_1.PrismaClient();
    }
    // Generate secure encryption key
    generateSecureKey() {
        const key = crypto.randomBytes(32).toString('hex');
        console.warn('⚠️  Generated new encryption key. Save this to CREDENTIAL_ENCRYPTION_KEY env var:');
        console.warn(key);
        return key;
    }
    // Encrypt credentials
    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        const jsonData = JSON.stringify(data);
        let encrypted = cipher.update(jsonData, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    // Decrypt credentials
    decrypt(encrypted, iv, authTag) {
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
    // Store credential securely
    async storeCredential(provider, type, credentials, metadata) {
        const credentialId = `${provider}_${Date.now()}`;
        // Encrypt the credentials
        const { encrypted, iv, authTag } = this.encrypt(credentials);
        // Store in database
        await this.prisma.$executeRaw `
      INSERT INTO credentials (id, provider, type, encrypted_data, iv, auth_tag, metadata)
      VALUES (${credentialId}, ${provider}, ${type}, ${encrypted}, ${iv}, ${authTag}, ${JSON.stringify(metadata || {})})
    `;
        // Cache the decrypted credential
        this.credentialCache.set(credentialId, {
            id: credentialId,
            provider,
            type,
            credentials,
            metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`🔐 Stored ${type} credential for ${provider}`);
        return credentialId;
    }
    // Retrieve credential
    async getCredential(credentialId) {
        // Check cache first
        if (this.credentialCache.has(credentialId)) {
            return this.credentialCache.get(credentialId);
        }
        // Fetch from database
        const result = await this.prisma.$queryRaw `
      SELECT * FROM credentials WHERE id = ${credentialId}
    `;
        if (!result || result.length === 0) {
            return null;
        }
        const encryptedCred = result[0];
        // Decrypt the credentials
        const decryptedData = this.decrypt(encryptedCred.encryptedData, encryptedCred.iv, encryptedCred.authTag);
        const credential = {
            id: encryptedCred.id,
            provider: encryptedCred.provider,
            type: decryptedData.type,
            credentials: decryptedData,
            metadata: encryptedCred.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Cache it
        this.credentialCache.set(credentialId, credential);
        return credential;
    }
    // Get credential by provider
    async getCredentialByProvider(provider) {
        const result = await this.prisma.$queryRaw `
      SELECT * FROM credentials WHERE provider = ${provider} ORDER BY created_at DESC LIMIT 1
    `;
        if (!result || result.length === 0) {
            return null;
        }
        return this.getCredential(result[0].id);
    }
    // Update credential
    async updateCredential(credentialId, updates) {
        const existing = await this.getCredential(credentialId);
        if (!existing) {
            throw new Error(`Credential not found: ${credentialId}`);
        }
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date()
        };
        // Encrypt updated credentials
        const { encrypted, iv, authTag } = this.encrypt(updated.credentials);
        // Update in database
        await this.prisma.$executeRaw `
      UPDATE credentials 
      SET encrypted_data = ${encrypted}, 
          iv = ${iv}, 
          auth_tag = ${authTag},
          metadata = ${JSON.stringify(updated.metadata || {})},
          updated_at = ${updated.updatedAt}
      WHERE id = ${credentialId}
    `;
        // Update cache
        this.credentialCache.set(credentialId, updated);
    }
    // Delete credential
    async deleteCredential(credentialId) {
        await this.prisma.$executeRaw `
      DELETE FROM credentials WHERE id = ${credentialId}
    `;
        this.credentialCache.delete(credentialId);
        console.log(`🗑️  Deleted credential: ${credentialId}`);
    }
    // Validate and refresh OAuth tokens
    async validateOAuthToken(credentialId) {
        const credential = await this.getCredential(credentialId);
        if (!credential || credential.type !== 'oauth') {
            return false;
        }
        // Check expiration
        if (credential.expiresAt && credential.expiresAt < new Date()) {
            // Try to refresh
            if (credential.credentials.refreshToken) {
                try {
                    await this.refreshOAuthToken(credentialId);
                    return true;
                }
                catch (error) {
                    console.error(`Failed to refresh token for ${credential.provider}:`, error);
                    return false;
                }
            }
            return false;
        }
        return true;
    }
    // Refresh OAuth token
    async refreshOAuthToken(credentialId) {
        const credential = await this.getCredential(credentialId);
        if (!credential || credential.type !== 'oauth' || !credential.credentials.refreshToken) {
            throw new Error('Cannot refresh token');
        }
        // This would call the OAuth provider's refresh endpoint
        // Implementation depends on the specific provider
        // For now, placeholder implementation
        console.log(`🔄 Would refresh OAuth token for ${credential.provider}`);
        // Update the credential with new tokens
        // await this.updateCredential(credentialId, { ... });
    }
    // Export credentials (encrypted)
    async exportCredentials(filePath) {
        const allCredentials = await this.prisma.$queryRaw `
      SELECT * FROM credentials
    `;
        const exportData = {
            version: '1.0',
            exported: new Date().toISOString(),
            credentials: allCredentials
        };
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
        console.log(`📦 Exported ${allCredentials.length} credentials to ${filePath}`);
    }
    // Import credentials (encrypted)
    async importCredentials(filePath) {
        const data = await fs.readFile(filePath, 'utf-8');
        const importData = JSON.parse(data);
        for (const cred of importData.credentials) {
            // Check if already exists
            const existing = await this.getCredential(cred.id);
            if (!existing) {
                await this.prisma.$executeRaw `
          INSERT INTO credentials (id, provider, type, encrypted_data, iv, auth_tag, metadata)
          VALUES (${cred.id}, ${cred.provider}, ${cred.type}, ${cred.encryptedData}, ${cred.iv}, ${cred.authTag}, ${JSON.stringify(cred.metadata || {})})
        `;
            }
        }
        console.log(`📥 Imported ${importData.credentials.length} credentials`);
    }
    // Integration helper methods
    async getAPIKey(provider) {
        const credential = await this.getCredentialByProvider(provider);
        if (!credential || credential.type !== 'api_key') {
            return null;
        }
        return credential.credentials.apiKey;
    }
    async getOAuthTokens(provider) {
        const credential = await this.getCredentialByProvider(provider);
        if (!credential || credential.type !== 'oauth') {
            return null;
        }
        // Validate and refresh if needed
        await this.validateOAuthToken(credential.id);
        return {
            accessToken: credential.credentials.accessToken,
            refreshToken: credential.credentials.refreshToken
        };
    }
    async getBasicAuth(provider) {
        const credential = await this.getCredentialByProvider(provider);
        if (!credential || credential.type !== 'basic') {
            return null;
        }
        return {
            username: credential.credentials.username,
            password: credential.credentials.password
        };
    }
}
exports.CredentialManager = CredentialManager;
// Singleton instance
exports.credentialManager = new CredentialManager();
//# sourceMappingURL=credential-manager.js.map