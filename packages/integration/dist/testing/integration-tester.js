"use strict";
/**
 * CORE Platform Integration Tester
 * Built-in testing for all integration authentication and data flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationTester = void 0;
const service_resolver_1 = require("../../../shared/src/services/service-resolver");
class IntegrationTester {
    constructor(serviceConfig) {
        this.serviceResolver = new service_resolver_1.ServiceResolver(serviceConfig);
    }
    /**
     * Test all integrations for a vertical application
     */
    async testAllIntegrations(integrations) {
        console.log('🧪 CORE: Testing all integrations...');
        const startTime = Date.now();
        const results = [];
        for (const integration of integrations) {
            console.log(`  🔍 Testing ${integration.name}...`);
            const result = await this.testIntegration(integration);
            results.push(result);
        }
        const report = {
            timestamp: new Date().toISOString(),
            totalIntegrations: integrations.length,
            successfulIntegrations: results.filter(r => r.success).length,
            results,
            recommendations: this.generateRecommendations(results)
        };
        const duration = Date.now() - startTime;
        console.log(`✅ CORE: Integration testing completed in ${duration}ms`);
        console.log(`📊 Success rate: ${report.successfulIntegrations}/${report.totalIntegrations} integrations`);
        return report;
    }
    /**
     * Test a single integration comprehensively
     */
    async testIntegration(integration) {
        const startTime = Date.now();
        const result = {
            integration: integration.name,
            success: false,
            tests: {
                authentication: { success: false, duration: 0 },
                connectivity: { success: false, duration: 0 }
            },
            duration: 0
        };
        try {
            // Test 1: Authentication
            console.log(`    🔑 Testing authentication...`);
            result.tests.authentication = await this.testAuthentication(integration);
            if (!result.tests.authentication.success) {
                throw new Error(`Authentication failed: ${result.tests.authentication.error}`);
            }
            // Test 2: Connectivity
            console.log(`    🌐 Testing connectivity...`);
            result.tests.connectivity = await this.testConnectivity(integration);
            if (!result.tests.connectivity.success) {
                throw new Error(`Connectivity failed: ${result.tests.connectivity.error}`);
            }
            // Test 3: Data Fetching (if endpoints available)
            if (this.hasDataEndpoints(integration)) {
                console.log(`    📥 Testing data fetching...`);
                result.tests.dataFetch = await this.testDataFetching(integration);
            }
            // Test 4: Rate Limiting
            console.log(`    ⏱️  Testing rate limiting...`);
            result.tests.rateLimiting = await this.testRateLimiting(integration);
            result.success = this.isOverallSuccess(result.tests);
        }
        catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
            console.log(`    ❌ ${integration.name}: ${result.error}`);
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    async testAuthentication(integration) {
        const startTime = Date.now();
        try {
            // Get credentials from service resolver
            const credentials = this.serviceResolver.resolveIntegrationCredentials(integration.name);
            if (!credentials || Object.keys(credentials).length === 0) {
                return {
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'No credentials available for testing'
                };
            }
            // Create a test client
            const testClient = await this.createTestClient(integration, credentials);
            // Attempt authentication
            const authResult = await this.performAuthenticationTest(testClient, integration);
            return {
                success: authResult.success,
                duration: Date.now() - startTime,
                error: authResult.error,
                details: authResult.details
            };
        }
        catch (error) {
            return {
                success: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async testConnectivity(integration) {
        const startTime = Date.now();
        try {
            const baseUrl = integration.baseUrl;
            if (!baseUrl) {
                return {
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'No base URL configured'
                };
            }
            // Test basic connectivity
            const response = await fetch(baseUrl, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'CORE-Platform-Test/1.0'
                }
            });
            const isReachable = response.status < 500; // Allow 4xx but not 5xx
            return {
                success: isReachable,
                duration: Date.now() - startTime,
                error: isReachable ? undefined : `Server returned ${response.status}`,
                details: {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries())
                }
            };
        }
        catch (error) {
            return {
                success: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async testDataFetching(integration) {
        const startTime = Date.now();
        try {
            const credentials = this.serviceResolver.resolveIntegrationCredentials(integration.name);
            const testClient = await this.createTestClient(integration, credentials);
            // Try common data endpoints
            const testEndpoints = this.getTestEndpoints(integration);
            let successfulFetch = false;
            let lastError;
            for (const endpoint of testEndpoints) {
                try {
                    const data = await testClient.get(endpoint);
                    if (data) {
                        successfulFetch = true;
                        break;
                    }
                }
                catch (error) {
                    lastError = error instanceof Error ? error.message : String(error);
                }
            }
            return {
                success: successfulFetch,
                duration: Date.now() - startTime,
                error: successfulFetch ? undefined : lastError || 'No data endpoints responded',
                details: { testedEndpoints: testEndpoints }
            };
        }
        catch (error) {
            return {
                success: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async testRateLimiting(integration) {
        const startTime = Date.now();
        try {
            // Test that rate limiting is working by making multiple requests
            const credentials = this.serviceResolver.resolveIntegrationCredentials(integration.name);
            const testClient = await this.createTestClient(integration, credentials);
            const requests = Array.from({ length: 5 }, () => testClient.get('/test').catch(() => null));
            const results = await Promise.allSettled(requests);
            const fulfilled = results.filter(r => r.status === 'fulfilled').length;
            // If all requests succeed immediately, rate limiting might not be working
            // If some are delayed/rejected, rate limiting is likely working
            const hasRateLimiting = fulfilled < 5 || (Date.now() - startTime) > 1000;
            return {
                success: true, // Rate limiting test is informational
                duration: Date.now() - startTime,
                details: {
                    requestsMade: 5,
                    requestsSucceeded: fulfilled,
                    rateLimitingDetected: hasRateLimiting
                }
            };
        }
        catch (error) {
            return {
                success: true, // Don't fail overall test for rate limiting issues
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async createTestClient(integration, credentials) {
        // Create a minimal test client for the integration
        const baseConfig = {
            baseURL: integration.baseUrl,
            timeout: 10000,
            headers: {
                'User-Agent': 'CORE-Platform-Test/1.0',
                'Content-Type': 'application/json'
            }
        };
        // Handle OAuth2 token exchange for client credentials flow
        if (credentials.client_id && credentials.client_secret) {
            try {
                console.log(`    🔄 Attempting OAuth2 token exchange for ${integration.name}...`);
                const tokenResponse = await this.performOAuth2TokenExchange(integration, credentials);
                if (tokenResponse?.access_token) {
                    baseConfig.headers['Authorization'] = `Bearer ${tokenResponse.access_token}`;
                    console.log(`    ✅ OAuth2 token obtained successfully`);
                }
                else {
                    console.log(`    ⚠️  OAuth2 token exchange failed, falling back to basic auth`);
                    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
                    baseConfig.headers['Authorization'] = `Basic ${basicAuth}`;
                }
            }
            catch (error) {
                console.log(`    ⚠️  OAuth2 failed: ${error instanceof Error ? error.message : String(error)}, using basic auth`);
                const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
                baseConfig.headers['Authorization'] = `Basic ${basicAuth}`;
            }
        }
        // Add API key authentication
        if (credentials.api_key) {
            if (credentials.api_key.startsWith('resend_api_key')) {
                // For Resend, use the actual environment variable value
                const actualKey = process.env.RESEND_API_KEY || 're_placeholder_key';
                baseConfig.headers['Authorization'] = `Bearer ${actualKey}`;
            }
            else {
                baseConfig.headers['X-API-Key'] = credentials.api_key;
                baseConfig.headers['Authorization'] = `Bearer ${credentials.api_key}`;
            }
        }
        // Return a simple client interface
        return {
            get: async (path) => {
                const response = await fetch(`${integration.baseUrl}${path}`, {
                    method: 'GET',
                    headers: baseConfig.headers
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json().catch(() => response.text());
            },
            healthCheck: async () => {
                const response = await fetch(`${integration.baseUrl}/health`, {
                    method: 'GET',
                    headers: baseConfig.headers
                }).catch(() => fetch(integration.baseUrl, {
                    method: 'HEAD',
                    headers: baseConfig.headers
                }));
                return {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    details: response.ok ? undefined : `HTTP ${response.status}`
                };
            }
        };
    }
    async performAuthenticationTest(client, integration) {
        try {
            // Try health check first
            const healthResult = await client.healthCheck();
            if (healthResult.status === 'healthy') {
                return { success: true, details: healthResult };
            }
            // Try a simple GET request to any endpoint
            const testEndpoints = this.getTestEndpoints(integration);
            for (const endpoint of testEndpoints) {
                try {
                    await client.get(endpoint);
                    return { success: true, details: { endpoint } };
                }
                catch (error) {
                    // Continue to next endpoint
                }
            }
            return {
                success: false,
                error: 'No endpoints responded successfully',
                details: { testedEndpoints: testEndpoints }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    hasDataEndpoints(integration) {
        // Check if integration likely has data endpoints
        return integration.baseUrl !== undefined;
    }
    getTestEndpoints(integration) {
        // Common endpoint patterns to test
        return [
            '/health',
            '/api/health',
            '/status',
            '/ping',
            '/v1/ping',
            '/',
            '/api',
            '/v1'
        ];
    }
    isOverallSuccess(tests) {
        // Authentication and connectivity are required
        if (!tests.authentication.success || !tests.connectivity.success) {
            return false;
        }
        // Other tests are optional but warned about
        return true;
    }
    generateRecommendations(results) {
        const recommendations = [];
        const failedAuth = results.filter(r => !r.tests.authentication.success);
        if (failedAuth.length > 0) {
            recommendations.push(`❌ ${failedAuth.length} integration(s) have authentication issues. Check API credentials.`);
        }
        const failedConnectivity = results.filter(r => !r.tests.connectivity.success);
        if (failedConnectivity.length > 0) {
            recommendations.push(`🌐 ${failedConnectivity.length} integration(s) have connectivity issues. Check URLs and network.`);
        }
        const noDataFetch = results.filter(r => r.tests.dataFetch && !r.tests.dataFetch.success);
        if (noDataFetch.length > 0) {
            recommendations.push(`📥 ${noDataFetch.length} integration(s) cannot fetch data. Verify endpoint permissions.`);
        }
        const slowIntegrations = results.filter(r => r.duration > 10000);
        if (slowIntegrations.length > 0) {
            recommendations.push(`⏱️  ${slowIntegrations.length} integration(s) are slow (>10s). Consider timeout adjustments.`);
        }
        if (recommendations.length === 0) {
            recommendations.push('✅ All integrations are working correctly!');
        }
        return recommendations;
    }
    /**
     * Perform OAuth2 client credentials token exchange
     */
    async performOAuth2TokenExchange(integration, credentials) {
        const tokenUrl = integration.baseUrl?.includes('guesty')
            ? 'https://open-api.guesty.com/oauth2/token'
            : `${integration.baseUrl}/oauth2/token`;
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: credentials.client_id,
            client_secret: credentials.client_secret,
            scope: 'open-api'
        });
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'CORE-Platform-Test/1.0'
            },
            body: body.toString()
        });
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`OAuth2 token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    }
    /**
     * Generate environment variables needed for integration testing
     */
    getRequiredEnvironmentVariables(integrations) {
        const envVars = [];
        integrations.forEach(integration => {
            const envPrefix = integration.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            envVars.push(`${envPrefix}_BASE_URL`);
            if (integration.credentials) {
                Object.keys(integration.credentials).forEach(key => {
                    envVars.push(`${envPrefix}_${key.toUpperCase()}`);
                });
            }
        });
        return envVars;
    }
}
exports.IntegrationTester = IntegrationTester;
//# sourceMappingURL=integration-tester.js.map