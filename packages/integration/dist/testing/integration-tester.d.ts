/**
 * CORE Platform Integration Tester
 * Built-in testing for all integration authentication and data flow
 */
import { IntegrationConfig, ServiceConfig } from '../../../shared/src/config/service-config';
export interface IntegrationTestResult {
    integration: string;
    success: boolean;
    tests: {
        authentication: TestResult;
        connectivity: TestResult;
        dataFetch?: TestResult;
        rateLimiting?: TestResult;
    };
    duration: number;
    error?: string;
}
export interface TestResult {
    success: boolean;
    duration: number;
    error?: string;
    details?: any;
}
export interface IntegrationTestReport {
    timestamp: string;
    totalIntegrations: number;
    successfulIntegrations: number;
    results: IntegrationTestResult[];
    recommendations: string[];
}
export declare class IntegrationTester {
    private serviceResolver;
    constructor(serviceConfig: ServiceConfig);
    /**
     * Test all integrations for a vertical application
     */
    testAllIntegrations(integrations: IntegrationConfig[]): Promise<IntegrationTestReport>;
    /**
     * Test a single integration comprehensively
     */
    testIntegration(integration: IntegrationConfig): Promise<IntegrationTestResult>;
    private testAuthentication;
    private testConnectivity;
    private testDataFetching;
    private testRateLimiting;
    private createTestClient;
    private performAuthenticationTest;
    private hasDataEndpoints;
    private getTestEndpoints;
    private isOverallSuccess;
    private generateRecommendations;
    /**
     * Perform OAuth2 client credentials token exchange
     */
    private performOAuth2TokenExchange;
    /**
     * Generate environment variables needed for integration testing
     */
    getRequiredEnvironmentVariables(integrations: IntegrationConfig[]): string[];
}
//# sourceMappingURL=integration-tester.d.ts.map