"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPActivity = void 0;
const activity_1 = require("@temporalio/activity");
const axios_1 = __importDefault(require("axios"));
const base_activity_1 = require("./base-activity");
const errors_1 = require("../errors");
class HTTPActivity extends base_activity_1.BaseActivity {
    async execute(input) {
        const context = activity_1.Context.current();
        const { url, method, headers = {}, data, params, timeout = 30000, retries = 3, retryDelay = 1000 } = input;
        try {
            console.log(`[HTTP Activity] ${method} ${url}`);
            // Prepare request configuration
            const config = {
                url,
                method,
                headers: {
                    'User-Agent': 'OPSAI-Workflow/1.0',
                    ...headers
                },
                timeout,
                params,
                validateStatus: input.validateStatus || ((status) => status >= 200 && status < 300)
            };
            // Add request body for methods that support it
            if (['POST', 'PUT', 'PATCH'].includes(method) && data) {
                config.data = data;
                // Set content type if not already set
                if (!config.headers['Content-Type']) {
                    config.headers['Content-Type'] = 'application/json';
                }
            }
            // Apply authentication
            if (input.authentication) {
                this.applyAuthentication(config, input.authentication);
            }
            let lastError;
            let response;
            // Retry logic
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    context.heartbeat(`HTTP request attempt ${attempt + 1}`);
                    response = await axios_1.default.request(config);
                    return {
                        success: true,
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        data: response.data,
                        url: response.config.url,
                        method: response.config.method?.toUpperCase(),
                        duration: this.calculateDuration(response)
                    };
                }
                catch (error) {
                    lastError = error;
                    // Don't retry on client errors (4xx) unless it's a rate limit (429)
                    if (axios_1.default.isAxiosError(error) && error.response) {
                        const status = error.response.status;
                        if (status >= 400 && status < 500 && status !== 429) {
                            break; // Don't retry client errors except rate limits
                        }
                    }
                    // Wait before retry (except on last attempt)
                    if (attempt < retries) {
                        console.log(`[HTTP Activity] Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms`);
                        await this.sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
                    }
                }
            }
            // All retries failed, handle the error
            if (axios_1.default.isAxiosError(lastError)) {
                const errorResponse = lastError.response;
                return {
                    success: false,
                    status: errorResponse?.status || 0,
                    statusText: errorResponse?.statusText || 'Network Error',
                    headers: errorResponse?.headers || {},
                    data: errorResponse?.data,
                    error: lastError.message,
                    url: lastError.config?.url,
                    method: lastError.config?.method?.toUpperCase()
                };
            }
            else {
                throw new errors_1.ActivityError(`HTTP request failed after ${retries + 1} attempts: ${lastError.message}`, {
                    url,
                    method,
                    attempts: retries + 1,
                    originalError: lastError
                });
            }
        }
        catch (error) {
            console.error(`[HTTP Activity] Error making ${method} request to ${url}:`, error);
            if (error instanceof errors_1.ActivityError) {
                throw error;
            }
            throw new errors_1.ActivityError(`HTTP activity failed: ${error instanceof Error ? error.message : String(error)}`, {
                url,
                method,
                originalError: error
            });
        }
    }
    /**
     * Apply authentication to request config
     */
    applyAuthentication(config, auth) {
        if (!auth)
            return;
        switch (auth.type) {
            case 'bearer':
                if (auth.token) {
                    config.headers['Authorization'] = `Bearer ${auth.token}`;
                }
                break;
            case 'basic':
                if (auth.username && auth.password) {
                    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
                    config.headers['Authorization'] = `Basic ${credentials}`;
                }
                break;
            case 'api_key':
                if (auth.apiKey) {
                    const headerName = auth.apiKeyHeader || 'X-API-Key';
                    config.headers[headerName] = auth.apiKey;
                }
                break;
        }
    }
    /**
     * Calculate request duration from response
     */
    calculateDuration(response) {
        // This is a simplified calculation
        // In a real implementation, you'd track request start/end times
        return 0;
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.HTTPActivity = HTTPActivity;
//# sourceMappingURL=http-activity.js.map