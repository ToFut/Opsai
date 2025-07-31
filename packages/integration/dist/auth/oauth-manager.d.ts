import { Router } from 'express';
export interface OAuthConfig {
    provider: string;
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    redirectUri: string;
    scope?: string[];
    autoRefresh?: boolean;
}
export interface OAuthToken {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    tokenType: string;
    scope?: string;
}
export declare class OAuthManager {
    private configs;
    private tokens;
    private stateStore;
    constructor();
    registerProvider(config: OAuthConfig): void;
    getAuthorizationUrl(provider: string, customState?: string): string;
    exchangeCodeForToken(provider: string, code: string, state: string): Promise<OAuthToken>;
    refreshToken(provider: string): Promise<OAuthToken>;
    getAccessToken(provider: string): string | null;
    createOAuthRouter(): Router;
    private setupRefreshTimer;
}
export declare const oauthManager: OAuthManager;
//# sourceMappingURL=oauth-manager.d.ts.map