import * as path from 'path';
import * as fs from 'fs';
import { EnhancedConfigParser } from './scripts/cli/generators/EnhancedConfigParser';
import { GeneratorCoordinator } from './scripts/cli/generators/GeneratorCoordinator';

async function testFullGenerationPipeline(): Promise<void> {
  console.log('🚀 Testing Full OPSAI Generation Pipeline');
  console.log('='.repeat(60));

  try {
    // Step 1: Parse the comprehensive YAML configuration
    console.log('📖 Step 1: Parsing comprehensive YAML configuration...');
    const configPath = path.join(__dirname, 'next-gen-business-app.yaml');
    const configParser = new EnhancedConfigParser();
    const config = await configParser.parseConfig(configPath);
    
    console.log(`✅ Configuration parsed successfully`);
    console.log(`   • App: ${config.app?.name || 'NextGen Business Platform'}`);
    console.log(`   • Entities: ${config.database?.entities?.length || 0}`);
    console.log(`   • Integrations: ${config.apis?.integrations?.length || 0}`);
    console.log(`   • Workflows: ${config.workflows?.length || 0}`);

    // Step 2: Generate the complete application
    console.log('\n🏗️  Step 2: Generating complete application...');
    const outputDir = '/tmp/next-gen-test-app-full';
    
    // Clean output directory if it exists
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Use the GeneratorCoordinator for full generation
    const coordinator = new GeneratorCoordinator(config, outputDir);
    await coordinator.generateApplication();

    console.log('✅ Application generation completed successfully!');

    // Step 3: Verify generated files
    console.log('\n🔍 Step 3: Verifying generated files...');
    const criticalFiles = [
      'package.json',
      'prisma/schema.prisma',
      'supabase/config.toml',
      'supabase/migrations/',
      'lib/supabase.ts',
      'lib/analytics/AnalyticsService.ts',
      'lib/analytics/AuditService.ts',
      'workflows/',
      'activities/workflow-activities.ts',
      'activities/worker.ts',
      'lib/workflow/WorkflowClient.ts',
      'temporal/docker-compose.yml',
      'airbyte/docker-compose.yml',
      'lib/services/DataSyncService.ts',
      '.env.local',
      'README.md'
    ];

    let generatedCount = 0;
    let totalFiles = criticalFiles.length;

    for (const file of criticalFiles) {
      const filePath = path.join(outputDir, file);
      const exists = fs.existsSync(filePath);
      console.log(`${exists ? '✅' : '❌'} ${file}`);
      if (exists) generatedCount++;
    }

    // Step 4: Analyze package.json
    console.log('\n📦 Step 4: Analyzing generated package.json...');
    const packageJsonPath = path.join(outputDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`✅ Package: ${packageJson.name}@${packageJson.version}`);
      console.log(`   • Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
      console.log(`   • Dev Dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);
      console.log(`   • Scripts: ${Object.keys(packageJson.scripts || {}).length}`);
      
      // Check for key dependencies
      const keyDeps = [
        '@supabase/supabase-js',
        '@temporalio/client',
        '@temporalio/worker',
        '@temporalio/workflow',
        '@prisma/client'
      ];
      
      console.log('   • Key Dependencies:');
      keyDeps.forEach(dep => {
        const hasIt = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
        console.log(`     ${hasIt ? '✅' : '❌'} ${dep}`);
      });
    }

    // Step 5: Check database schema
    console.log('\n🗄️  Step 5: Analyzing generated database schema...');
    const schemaPath = path.join(outputDir, 'prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const models = schemaContent.match(/model\s+\w+\s*{/g) || [];
      console.log(`✅ Database schema generated with ${models.length} models`);
      
      // Check for analytics models
      const analyticsModels = ['AnalyticsEvent', 'BusinessMetric', 'AuditLog', 'DataQualityCheck'];
      console.log('   • Analytics Models:');
      analyticsModels.forEach(model => {
        const hasModel = schemaContent.includes(`model ${model}`);
        console.log(`     ${hasModel ? '✅' : '❌'} ${model}`);
      });
    }

    // Step 6: Check workflow files
    console.log('\n⚙️  Step 6: Analyzing generated workflows...');
    const workflowsDir = path.join(outputDir, 'workflows');
    if (fs.existsSync(workflowsDir)) {
      const workflowFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.ts'));
      console.log(`✅ Generated ${workflowFiles.length} workflow files`);
      workflowFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
    }

    // Step 7: Final summary
    console.log('\n📊 Generation Test Summary');
    console.log('='.repeat(40));
    console.log(`✅ Files Generated: ${generatedCount}/${totalFiles} (${Math.round(generatedCount/totalFiles*100)}%)`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log(`🚀 App Name: ${config.app?.name || 'NextGen Business Platform'}`);
    
    if (generatedCount === totalFiles) {
      console.log('\n🎉 ALL CRITICAL FILES GENERATED SUCCESSFULLY!');
      console.log('\n🚀 To test the generated application:');
      console.log(`   cd ${outputDir}`);
      console.log('   npm install');
      console.log('   npm run supabase:start');
      console.log('   npm run temporal:start');
      console.log('   npm run airbyte:start');
      console.log('   npm run db:setup');
      console.log('   npm run dev');
    } else {
      console.log(`\n⚠️  ${totalFiles - generatedCount} files were not generated. Check logs above.`);
    }

    console.log('\n✅ Full generation pipeline test completed!');

  } catch (error) {
    console.error('❌ Generation pipeline test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testFullGenerationPipeline();