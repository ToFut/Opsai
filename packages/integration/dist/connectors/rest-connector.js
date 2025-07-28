"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESTConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("./base-connector");
const errors_1 = require("../errors");
class RESTConnector extends base_connector_1.BaseConnector {
    constructor(config) {
        super(config);
        this.rateLimiter = new Map();
        const axiosConfig = {
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'OPSAI-Integration/1.0',
                ...(config.headers || {})
            }
        };
        if (config.baseUrl) {
            axiosConfig.baseURL = config.baseUrl;
        }
        this.axiosInstance = axios_1.default.create(axiosConfig);
        this.authentication = config.authentication;
        this.setupInterceptors();
    }
    async initialize() {
        // Apply authentication
        await this.applyAuthentication();
        // Test the connection
        const isConnected = await this.testConnection();
        if (!isConnected) {
            throw new errors_1.IntegrationError('Failed to initialize REST connector');
        }
    }
    async testConnection() {
        try {
            // Use health check endpoint if configured
            const healthEndpoint = this.config.healthCheckEndpoint || '/';
            const response = await this.axiosInstance.get(healthEndpoint);
            return response.status >= 200 && response.status < 300;
        }
        catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
    async executeRequest(endpoint, method, data, options) {
        // Check rate limits
        if (!this.checkRateLimit(endpoint)) {
            throw new errors_1.IntegrationError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
        }
        try {
            const config = {
                method: method.toUpperCase(),
                url: endpoint,
                ...options
            };
            // Add data based on method
            if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                config.data = data;
            }
            else if (method.toUpperCase() === 'GET' && data) {
                config.params = data;
            }
            const response = await this.axiosInstance.request(config);
            // Update rate limit counters
            this.updateRateLimit(endpoint);
            return {
                success: true,
                data: response.data,
                status: response.status,
                headers: response.headers
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                return this.handleAxiosError(error);
            }
            throw new errors_1.IntegrationError('Request failed', 'REQUEST_FAILED', error);
        }
    }
    async executeEndpoint(endpointConfig, data) {
        // Validate request data against schema if provided
        if (endpointConfig.requestSchema) {
            // TODO: Add JSON schema validation
        }
        // Build the request
        const response = await this.executeRequest(endpointConfig.path, endpointConfig.method, data, {
            ...(endpointConfig.headers && { headers: endpointConfig.headers }),
            ...(endpointConfig.timeout && { timeout: endpointConfig.timeout })
        });
        // Validate response against schema if provided
        if (endpointConfig.responseSchema && response.success) {
            // TODO: Add JSON schema validation
        }
        return response;
    }
    setupInterceptors() {
        // Request interceptor for logging and modification
        this.axiosInstance.interceptors.request.use((config) => {
            console.log(`[REST] ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('[REST] Request error:', error);
            return Promise.reject(error);
        });
        // Response interceptor for logging and error handling
        this.axiosInstance.interceptors.response.use((response) => {
            console.log(`[REST] Response ${response.status} from ${response.config.url}`);
            return response;
        }, (error) => {
            if (error.response) {
                console.error(`[REST] Response error ${error.response.status} from ${error.config.url}`);
            }
            return Promise.reject(error);
        });
    }
    async applyAuthentication() {
        if (!this.authentication)
            return;
        switch (this.authentication.type) {
            case 'api_key':
                if (this.authentication.header) {
                    this.axiosInstance.defaults.headers.common[this.authentication.header] =
                        this.authentication.value || process.env[this.authentication.secretName || ''];
                }
                break;
            case 'bearer':
                this.axiosInstance.defaults.headers.common['Authorization'] =
                    `Bearer ${this.authentication.token || process.env[this.authentication.secretName || '']}`;
                break;
            case 'basic':
                const username = this.authentication.username || process.env[this.authentication.usernameSecret || ''];
                const password = this.authentication.password || process.env[this.authentication.passwordSecret || ''];
                const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
                this.axiosInstance.defaults.headers.common['Authorization'] = `Basic ${basicAuth}`;
                break;
            case 'oauth2':
                // OAuth2 requires token management
                await this.refreshOAuth2Token();
                break;
            case 'custom':
                // Apply custom headers
                if (this.authentication.headers) {
                    Object.assign(this.axiosInstance.defaults.headers.common, this.authentication.headers);
                }
                break;
        }
    }
    async refreshOAuth2Token() {
        if (!this.authentication || this.authentication.type !== 'oauth2')
            return;
        try {
            const tokenResponse = await axios_1.default.post(this.authentication.tokenUrl, {
                grant_type: 'client_credentials',
                client_id: this.authentication.clientId || process.env[this.authentication.clientIdSecret],
                client_secret: this.authentication.clientSecret || process.env[this.authentication.clientSecretSecret],
                scope: this.authentication.scope
            });
            const accessToken = tokenResponse.data.access_token;
            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            // Schedule token refresh before expiry
            if (tokenResponse.data.expires_in) {
                setTimeout(() => {
                    this.refreshOAuth2Token();
                }, (tokenResponse.data.expires_in - 60) * 1000); // Refresh 1 minute before expiry
            }
        }
        catch (error) {
            throw new errors_1.IntegrationError('Failed to refresh OAuth2 token', 'AUTH_FAILED', error);
        }
    }
    checkRateLimit(endpoint) {
        if (!this.config.rateLimits)
            return true;
        const limit = this.config.rateLimits.requestsPerMinute;
        if (!limit)
            return true;
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window
        const endpointLimit = this.rateLimiter.get(endpoint);
        if (!endpointLimit || endpointLimit.resetTime < now) {
            this.rateLimiter.set(endpoint, { count: 0, resetTime: now + 60000 });
            return true;
        }
        return endpointLimit.count < limit;
    }
    updateRateLimit(endpoint) {
        const endpointLimit = this.rateLimiter.get(endpoint);
        if (endpointLimit) {
            endpointLimit.count++;
        }
    }
    handleAxiosError(error) {
        const response = error.response;
        if (!response) {
            return {
                success: false,
                error: 'Network error',
                code: 'NETWORK_ERROR',
                details: error.message
            };
        }
        // Handle specific HTTP status codes
        switch (response.status) {
            case 401:
                return {
                    success: false,
                    error: 'Authentication failed',
                    code: 'AUTH_FAILED',
                    status: response.status,
                    details: response.data
                };
            case 403:
                return {
                    success: false,
                    error: 'Access forbidden',
                    code: 'FORBIDDEN',
                    status: response.status,
                    details: response.data
                };
            case 404:
                return {
                    success: false,
                    error: 'Resource not found',
                    code: 'NOT_FOUND',
                    status: response.status,
                    details: response.data
                };
            case 429:
                return {
                    success: false,
                    error: 'Rate limit exceeded',
                    code: 'RATE_LIMIT',
                    status: response.status,
                    details: response.data,
                    retryAfter: response.headers['retry-after']
                };
            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    success: false,
                    error: 'Server error',
                    code: 'SERVER_ERROR',
                    status: response.status,
                    details: response.data
                };
            default:
                return {
                    success: false,
                    error: 'Request failed',
                    code: 'REQUEST_FAILED',
                    status: response.status,
                    details: response.data
                };
        }
    }
    async dispose() {
        // Clean up any resources
        this.rateLimiter.clear();
    }
}
exports.RESTConnector = RESTConnector;
//# sourceMappingURL=rest-connector.js.map