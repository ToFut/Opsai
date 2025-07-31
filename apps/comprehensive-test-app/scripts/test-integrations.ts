#!/usr/bin/env tsx

/**
 * Integration Test Script
 * Run this script to test all API integrations and data sync
 * 
 * Usage:
 *   npm run test:integrations
 *   or
 *   npx tsx scripts/test-integrations.ts
 */

import { IntegrationTestRunner } from '../tests/integration/test-runner';
import { dataSyncService } from '../src/validation/data-sync-service';
import { syncMonitor } from '../src/validation/sync-monitor';

async function runIntegrationTests() {
  console.log('🚀 Starting comprehensive integration testing...');
  console.log('═'.repeat(60));

  let exitCode = 0;

  try {
    // Step 1: Initialize test runner
    console.log('🔧 Initializing test environment...');
    const testRunner = new IntegrationTestRunner();
    await testRunner.setup();

    // Step 2: Run authentication tests
    console.log('\n🔑 TESTING AUTHENTICATION');
    console.log('─'.repeat(40));
    
    const authResults = await testRunner.runAllTests();
    
    if (authResults.successfulIntegrations < authResults.totalIntegrations) {
      console.log('⚠️  Some authentication tests failed');
      exitCode = 1;
    }

    // Step 3: Run data sync validation
    console.log('\n🔄 TESTING DATA SYNC');
    console.log('─'.repeat(40));
    
    const syncReport = await dataSyncService.validateAllIntegrationSync();
    
    if (!syncReport.overallSuccess) {
      console.log('⚠️  Some data sync tests failed');
      exitCode = 1;
    }

    // Step 4: Test health monitoring
    console.log('\n💓 TESTING HEALTH MONITORING');
    console.log('─'.repeat(40));
    
    await syncMonitor.startMonitoring(1); // 1 minute interval for testing
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    syncMonitor.stopMonitoring();
    
    const currentHealth = syncMonitor.getCurrentHealth();
    if (currentHealth && currentHealth.failedSyncs > 0) {
      console.log('⚠️  Health monitoring detected issues');
    }

    // Step 5: Generate summary report
    console.log('\n📊 FINAL REPORT');
    console.log('═'.repeat(60));
    
    const totalTests = authResults.totalIntegrations + syncReport.results.length;
    const passedTests = authResults.successfulIntegrations + syncReport.results.filter(r => r.success).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests (${successRate}%)`);
    console.log(`🔑 Authentication: ${authResults.successfulIntegrations}/${authResults.totalIntegrations} integrations`);
    console.log(`🔄 Data Sync: ${syncReport.results.filter(r => r.success).length}/${syncReport.results.length} operations`);
    
    if (exitCode === 0) {
      console.log('\n🎉 All integration tests passed!');
      console.log('🚀 Your integrations are ready for production');
    } else {
      console.log('\n❌ Some tests failed');
      console.log('🔧 Please check the detailed logs above');
      console.log('💡 Common issues:');
      console.log('   - Missing environment variables');
      console.log('   - Invalid API credentials');
      console.log('   - Network connectivity issues');
      console.log('   - API endpoint changes');
    }

    // Cleanup
    await testRunner.teardown();

  } catch (error) {
    console.error('💥 Integration testing failed:', error);
    exitCode = 1;
  }

  process.exit(exitCode);
}

// Handle CLI arguments
const args = process.argv.slice(2);
const helpRequested = args.includes('--help') || args.includes('-h');

if (helpRequested) {
  console.log(`
🧪 Integration Test Runner

This script comprehensively tests your API integrations:
• Authentication with each third-party service
• Data fetching from APIs
• Data storage in your database
• Data mapping and validation
• Health monitoring

Environment Variables Required:
• DATABASE_URL - Your database connection
• {INTEGRATION}_API_KEY - API keys for each integration
• {INTEGRATION}_BASE_URL - Base URLs for each API

Examples:
  npm run test:integrations
  npx tsx scripts/test-integrations.ts
  npx tsx scripts/test-integrations.ts --help

Exit Codes:
  0 - All tests passed
  1 - Some tests failed
`);
  process.exit(0);
}

// Run the tests
runIntegrationTests().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});