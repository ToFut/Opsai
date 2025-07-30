import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

interface Credential {
  id: string;
  provider: string;
  type: 'api_key' | 'oauth' | 'basic' | 'custom';
  credentials: Record<string, any>;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface EncryptedCredential {
  id: string;
  provider: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  metadata?: Record<string, any>;
}

export class CredentialManager {
  private encryptionKey: Buffer;
  private prisma: PrismaClient;
  private credentialCache: Map<string, Credential> = new Map();

  constructor() {
    // Use environment variable or generate secure key
    const key = process.env.CREDENTIAL_ENCRYPTION_KEY || this.generateSecureKey();
    this.encryptionKey = Buffer.from(key, 'hex');
    this.prisma = new PrismaClient();
  }

  // Generate secure encryption key
  private generateSecureKey(): string {
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  Generated new encryption key. Save this to CREDENTIAL_ENCRYPTION_KEY env var:');
    console.warn(key);
    return key;
  }

  // Encrypt credentials
  private encrypt(data: any): { encrypted: string; iv: string; authTag: string } {
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
  private decrypt(encrypted: string, iv: string, authTag: string): any {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Store credential securely
  async storeCredential(
    provider: string,
    type: Credential['type'],
    credentials: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    const credentialId = `${provider}_${Date.now()}`;
    
    // Encrypt the credentials
    const { encrypted, iv, authTag } = this.encrypt(credentials);

    // Store in database
    await this.prisma.$executeRaw`
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
  async getCredential(credentialId: string): Promise<Credential | null> {
    // Check cache first
    if (this.credentialCache.has(credentialId)) {
      return this.credentialCache.get(credentialId)!;
    }

    // Fetch from database
    const result = await this.prisma.$queryRaw<EncryptedCredential[]>`
      SELECT * FROM credentials WHERE id = ${credentialId}
    `;

    if (!result || result.length === 0) {
      return null;
    }

    const encryptedCred = result[0];
    
    // Decrypt the credentials
    const decryptedData = this.decrypt(
      encryptedCred.encryptedData,
      encryptedCred.iv,
      encryptedCred.authTag
    );

    const credential: Credential = {
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
  async getCredentialByProvider(provider: string): Promise<Credential | null> {
    const result = await this.prisma.$queryRaw<EncryptedCredential[]>`
      SELECT * FROM credentials WHERE provider = ${provider} ORDER BY created_at DESC LIMIT 1
    `;

    if (!result || result.length === 0) {
      return null;
    }

    return this.getCredential(result[0].id);
  }

  // Update credential
  async updateCredential(
    credentialId: string,
    updates: Partial<Omit<Credential, 'id' | 'provider'>>
  ): Promise<void> {
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
    await this.prisma.$executeRaw`
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
  async deleteCredential(credentialId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM credentials WHERE id = ${credentialId}
    `;

    this.credentialCache.delete(credentialId);
    console.log(`🗑️  Deleted credential: ${credentialId}`);
  }

  // Validate and refresh OAuth tokens
  async validateOAuthToken(credentialId: string): Promise<boolean> {
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
        } catch (error) {
          console.error(`Failed to refresh token for ${credential.provider}:`, error);
          return false;
        }
      }
      return false;
    }

    return true;
  }

  // Refresh OAuth token
  private async refreshOAuthToken(credentialId: string): Promise<void> {
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
  async exportCredentials(filePath: string): Promise<void> {
    const allCredentials = await this.prisma.$queryRaw<EncryptedCredential[]>`
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
  async importCredentials(filePath: string): Promise<void> {
    const data = await fs.readFile(filePath, 'utf-8');
    const importData = JSON.parse(data);

    for (const cred of importData.credentials) {
      // Check if already exists
      const existing = await this.getCredential(cred.id);
      if (!existing) {
        await this.prisma.$executeRaw`
          INSERT INTO credentials (id, provider, type, encrypted_data, iv, auth_tag, metadata)
          VALUES (${cred.id}, ${cred.provider}, ${cred.type}, ${cred.encryptedData}, ${cred.iv}, ${cred.authTag}, ${JSON.stringify(cred.metadata || {})})
        `;
      }
    }

    console.log(`📥 Imported ${importData.credentials.length} credentials`);
  }

  // Integration helper methods
  
  async getAPIKey(provider: string): Promise<string | null> {
    const credential = await this.getCredentialByProvider(provider);
    if (!credential || credential.type !== 'api_key') {
      return null;
    }
    return credential.credentials.apiKey;
  }

  async getOAuthTokens(provider: string): Promise<{
    accessToken: string;
    refreshToken?: string;
  } | null> {
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

  async getBasicAuth(provider: string): Promise<{
    username: string;
    password: string;
  } | null> {
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

// Singleton instance
export const credentialManager = new CredentialManager();