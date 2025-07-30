import { EnhancedConfigParser } from '../generators/EnhancedConfigParser';
import { IntegrationTester } from '../../../packages/integration/src/testing/integration-tester';
import { ServiceResolver } from '../../../packages/shared/src/services/service-resolver';

export class TestIntegrationsCommand {
  async execute(configPath: string, options: any): Promise<void> {
    console.log('🧪 CORE Integration Testing');
    console.log('═'.repeat(50));

    try {
      // Parse configuration
      console.log('📖 Loading configuration...');
      const configParser = new EnhancedConfigParser();
      const config = await configParser.parseConfig(configPath);

      if (!config.services.integrations || config.services.integrations.length === 0) {
        console.log('ℹ️  No integrations found in configuration');
        return;
      }

      console.log(`🔍 Found ${config.services.integrations.length} integration(s) to test`);
      config.services.integrations.forEach(integration => {
        console.log(`   • ${integration.name} (${integration.baseUrl})`);
      });

      // Check environment variables (only if credentials aren't in config)
      console.log('\n⚙️  Checking environment variables...');
      const tester = new IntegrationTester(config.services);
      
      // Check if integrations have credentials in config
      const integrationsWithConfigCredentials = config.services.integrations.filter(
        integration => integration.credentials && Object.keys(integration.credentials).length > 0
      );
      
      if (integrationsWithConfigCredentials.length === config.services.integrations.length) {
        console.log('✅ All integrations have credentials in configuration file');
      } else {
        const requiredVars = tester.getRequiredEnvironmentVariables(config.services.integrations);
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
          console.log('❌ Missing required environment variables:');
          missingVars.forEach(varName => {
            console.log(`   • ${varName}`);
          });
          
          if (!options.skipEnvCheck) {
            console.log('\n💡 Set these environment variables or use --skip-env-check to continue anyway');
            process.exit(1);
          } else {
            console.log('⚠️  Continuing with missing variables (--skip-env-check used)');
          }
        } else {
          console.log('✅ All required environment variables are set');
        }
      }

      // Run integration tests
      console.log('\n🚀 Starting integration tests...');
      const report = await tester.testAllIntegrations(config.services.integrations);

      // Display results
      this.displayResults(report);

      // Save report if requested
      if (options.output) {
        const fs = await import('fs');
        fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
        console.log(`📄 Report saved to: ${options.output}`);
      }

      // Exit with appropriate code
      const exitCode = report.successfulIntegrations === report.totalIntegrations ? 0 : 1;
      
      if (exitCode === 0) {
        console.log('\n🎉 All integrations are working correctly!');
      } else {
        console.log('\n❌ Some integrations have issues. Check the details above.');
      }

      if (!options.continueOnFailure && exitCode !== 0) {
        process.exit(exitCode);
      }

    } catch (error) {
      console.error('💥 Integration testing failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private displayResults(report: IntegrationTestReport): void {
    console.log('\n📊 INTEGRATION TEST RESULTS');
    console.log('═'.repeat(50));
    
    const successRate = ((report.successfulIntegrations / report.totalIntegrations) * 100).toFixed(1);
    console.log(`Overall Success Rate: ${successRate}% (${report.successfulIntegrations}/${report.totalIntegrations})`);
    console.log(`Test Duration: ${new Date(report.timestamp).toLocaleTimeString()}`);
    
    console.log('\n📋 Detailed Results:');
    console.log('─'.repeat(30));
    
    report.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`\n${status} ${result.integration} (${result.duration}ms)`);
      
      // Show test details
      Object.entries(result.tests).forEach(([testName, testResult]) => {
        if (testResult) {
          const testStatus = testResult.success ? '✅' : '❌';
          console.log(`   ${testStatus} ${testName}: ${testResult.duration}ms`);
          
          if (!testResult.success && testResult.error) {
            console.log(`      Error: ${testResult.error}`);
          }
          
          if (testResult.details) {
            const details = typeof testResult.details === 'object' 
              ? JSON.stringify(testResult.details, null, 2).split('\n').map(line => `      ${line}`).join('\n')
              : `      ${testResult.details}`;
            console.log(details);
          }
        }
      });
      
      if (result.error) {
        console.log(`   ⚠️  ${result.error}`);
      }
    });
    
    // Show recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('─'.repeat(20));
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }
  }
}

interface IntegrationTestReport {
  timestamp: string;
  totalIntegrations: number;
  successfulIntegrations: number;
  results: any[];
  recommendations: string[];
}