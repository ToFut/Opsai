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
export declare class CredentialManager {
    private encryptionKey;
    private prisma;
    private credentialCache;
    constructor();
    private generateSecureKey;
    private encrypt;
    private decrypt;
    storeCredential(provider: string, type: Credential['type'], credentials: Record<string, any>, metadata?: Record<string, any>): Promise<string>;
    getCredential(credentialId: string): Promise<Credential | null>;
    getCredentialByProvider(provider: string): Promise<Credential | null>;
    updateCredential(credentialId: string, updates: Partial<Omit<Credential, 'id' | 'provider'>>): Promise<void>;
    deleteCredential(credentialId: string): Promise<void>;
    validateOAuthToken(credentialId: string): Promise<boolean>;
    private refreshOAuthToken;
    exportCredentials(filePath: string): Promise<void>;
    importCredentials(filePath: string): Promise<void>;
    getAPIKey(provider: string): Promise<string | null>;
    getOAuthTokens(provider: string): Promise<{
        accessToken: string;
        refreshToken?: string;
    } | null>;
    getBasicAuth(provider: string): Promise<{
        username: string;
        password: string;
    } | null>;
}
export declare const credentialManager: CredentialManager;
export {};
//# sourceMappingURL=credential-manager.d.ts.map