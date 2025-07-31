"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthManager = exports.OAuthManager = void 0;
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class OAuthManager {
    constructor() {
        this.configs = new Map();
        this.tokens = new Map();
        this.stateStore = new Map();
        this.setupRefreshTimer();
    }
    // Register OAuth provider configuration
    registerProvider(config) {
        this.configs.set(config.provider, config);
        console.log(`📝 Registered OAuth provider: ${config.provider}`);
    }
    // Generate OAuth authorization URL
    getAuthorizationUrl(provider, customState) {
        const config = this.configs.get(provider);
        if (!config) {
            throw new Error(`OAuth provider not configured: ${provider}`);
        }
        const state = customState || crypto_1.default.randomBytes(16).toString('hex');
        this.stateStore.set(state, provider);
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            state,
            scope: config.scope?.join(' ') || ''
        });
        return `${config.authorizationUrl}?${params.toString()}`;
    }
    // Exchange authorization code for tokens
    async exchangeCodeForToken(provider, code, state) {
        const config = this.configs.get(provider);
        if (!config) {
            throw new Error(`OAuth provider not configured: ${provider}`);
        }
        // Verify state
        const storedProvider = this.stateStore.get(state);
        if (storedProvider !== provider) {
            throw new Error('Invalid state parameter');
        }
        this.stateStore.delete(state);
        try {
            const response = await axios_1.default.post(config.tokenUrl, {
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri,
                client_id: config.clientId,
                client_secret: config.clientSecret
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const token = {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                tokenType: response.data.token_type || 'Bearer',
                scope: response.data.scope,
                expiresAt: response.data.expires_in
                    ? new Date(Date.now() + response.data.expires_in * 1000)
                    : undefined
            };
            this.tokens.set(provider, token);
            return token;
        }
        catch (error) {
            console.error(`OAuth token exchange failed for ${provider}:`, error.response?.data);
            throw new Error(`Failed to exchange code for token: ${error.message}`);
        }
    }
    // Refresh access token
    async refreshToken(provider) {
        const config = this.configs.get(provider);
        const currentToken = this.tokens.get(provider);
        if (!config || !currentToken?.refreshToken) {
            throw new Error(`Cannot refresh token for ${provider}`);
        }
        try {
            const response = await axios_1.default.post(config.tokenUrl, {
                grant_type: 'refresh_token',
                refresh_token: currentToken.refreshToken,
                client_id: config.clientId,
                client_secret: config.clientSecret
            });
            const token = {
                ...currentToken,
                accessToken: response.data.access_token,
                expiresAt: response.data.expires_in
                    ? new Date(Date.now() + response.data.expires_in * 1000)
                    : undefined
            };
            this.tokens.set(provider, token);
            return token;
        }
        catch (error) {
            console.error(`Token refresh failed for ${provider}:`, error.response?.data);
            throw new Error(`Failed to refresh token: ${error.message}`);
        }
    }
    // Get current access token
    getAccessToken(provider) {
        const token = this.tokens.get(provider);
        if (!token)
            return null;
        // Check if token is expired
        if (token.expiresAt && token.expiresAt < new Date()) {
            if (this.configs.get(provider)?.autoRefresh) {
                this.refreshToken(provider).catch(console.error);
            }
            return null;
        }
        return token.accessToken;
    }
    // Create Express router for OAuth callbacks
    createOAuthRouter() {
        const router = (0, express_1.Router)();
        // Generic OAuth callback handler
        router.get('/callback/:provider', async (req, res) => {
            const { provider } = req.params;
            const { code, state, error } = req.query;
            if (error) {
                return res.status(400).json({ error: error });
            }
            try {
                const token = await this.exchangeCodeForToken(provider, code, state);
                // Store token securely (in production, use encrypted storage)
                res.json({
                    success: true,
                    message: `Successfully authenticated with ${provider}`,
                    tokenType: token.tokenType,
                    expiresAt: token.expiresAt
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Authentication failed',
                    details: error.message
                });
            }
        });
        // Initiate OAuth flow
        router.get('/connect/:provider', (req, res) => {
            const { provider } = req.params;
            try {
                const authUrl = this.getAuthorizationUrl(provider);
                res.redirect(authUrl);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        return router;
    }
    // Auto-refresh tokens before expiry
    setupRefreshTimer() {
        setInterval(async () => {
            for (const [provider, token] of this.tokens.entries()) {
                const config = this.configs.get(provider);
                if (!config?.autoRefresh || !token.expiresAt || !token.refreshToken) {
                    continue;
                }
                // Refresh if token expires in next 5 minutes
                const expiresIn = token.expiresAt.getTime() - Date.now();
                if (expiresIn < 5 * 60 * 1000) {
                    try {
                        await this.refreshToken(provider);
                        console.log(`🔄 Refreshed token for ${provider}`);
                    }
                    catch (error) {
                        console.error(`Failed to refresh token for ${provider}:`, error);
                    }
                }
            }
        }, 60 * 1000); // Check every minute
    }
}
exports.OAuthManager = OAuthManager;
// Singleton instance
exports.oauthManager = new OAuthManager();
//# sourceMappingURL=oauth-manager.js.map