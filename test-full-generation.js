#!/usr/bin/env node

const { GenerateCommand } = require('./scripts/cli/commands/generate.ts');
const path = require('path');

async function testFullGeneration() {
  console.log('🚀 Testing Full OPSAI Generation Pipeline');
  console.log('=' .repeat(60));

  const generateCommand = new GenerateCommand();
  
  const options = {
    config: path.join(__dirname, 'next-gen-business-app.yaml'),
    output: '/tmp/next-gen-test-app',
    testIntegrations: false // Skip integration tests for now
  };

  try {
    await generateCommand.execute('vertical', 'next-gen-business-platform', options);
    
    console.log('\n🎉 Generation test completed successfully!');
    console.log('📁 Generated app location:', options.output);
    
    // Verify key files were generated
    const fs = require('fs');
    const verificationFiles = [
      'package.json',
      'prisma/schema.prisma',
      'supabase/config.toml',
      'workflows/',
      'activities/workflow-activities.ts',
      'lib/analytics/AnalyticsService.ts',
      'airbyte/docker-compose.yml',
      'temporal/docker-compose.yml'
    ];
    
    console.log('\n📋 Verifying generated files...');
    let allFilesGenerated = true;
    
    for (const file of verificationFiles) {
      const filePath = path.join(options.output, file);
      const exists = fs.existsSync(filePath);
      console.log(`${exists ? '✅' : '❌'} ${file}`);
      if (!exists) allFilesGenerated = false;
    }
    
    if (allFilesGenerated) {
      console.log('\n🎯 All critical files generated successfully!');
      console.log('\n🚀 Next steps to test the generated app:');
      console.log(`   cd ${options.output}`);
      console.log('   npm install');
      console.log('   npm run supabase:start');
      console.log('   npm run temporal:start');
      console.log('   npm run airbyte:start');
      console.log('   npm run db:setup');
      console.log('   npm run dev');
    } else {
      console.log('\n⚠️  Some files were not generated. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Generation test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFullGeneration();