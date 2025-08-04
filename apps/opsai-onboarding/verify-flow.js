#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function verifyFlow() {
  console.log('🔍 Verifying OAuth → Sample Data → DB Organization Flow\n');
  
  // Check if temp storage directory exists
  const storageDir = path.join(process.cwd(), '.temp-storage');
  
  if (fs.existsSync(storageDir)) {
    console.log('✅ Temp storage directory exists');
    
    const files = fs.readdirSync(storageDir);
    console.log(`📁 Files in temp storage: ${files.length}`);
    
    // Group files by type
    const integrations = files.filter(f => f.startsWith('integration_'));
    const samples = files.filter(f => f.startsWith('sample_'));
    const schemas = files.filter(f => f.startsWith('schema_'));
    const dynamic = files.filter(f => f.startsWith('dynamic_'));
    
    console.log('\n📊 Storage Summary:');
    console.log(`  - Integrations: ${integrations.length}`);
    console.log(`  - Sample Data: ${samples.length}`);
    console.log(`  - Schemas: ${schemas.length}`);
    console.log(`  - Dynamic Data: ${dynamic.length}`);
    
    // Show sample data details
    if (samples.length > 0) {
      console.log('\n📋 Sample Data Details:');
      samples.forEach(file => {
        const content = JSON.parse(fs.readFileSync(path.join(storageDir, file), 'utf-8'));
        console.log(`  - ${content.provider}:`);
        console.log(`    Collected: ${new Date(content.collected_at).toLocaleString()}`);
        if (content.sample_data?.recordCount) {
          console.log(`    Records:`, content.sample_data.recordCount);
        }
        if (content.sample_data?.metrics) {
          console.log(`    Metrics:`, content.sample_data.metrics);
        }
      });
    }
    
    // Show schema details
    if (schemas.length > 0) {
      console.log('\n🗄️ Generated Schema:');
      const schema = JSON.parse(fs.readFileSync(path.join(storageDir, schemas[0]), 'utf-8'));
      console.log(`  Providers: ${schema.providers.join(', ')}`);
      console.log(`  Tables: ${Object.keys(schema.entities).join(', ')}`);
      console.log(`  Relationships: ${schema.relationships?.length || 0}`);
    }
    
  } else {
    console.log('❌ No temp storage directory found');
    console.log('   The flow hasn\'t been tested yet');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Go to http://localhost:7250/onboarding-v3');
  console.log('2. Connect providers (GitHub, Google, etc.)');
  console.log('3. Click "Next" to organize database');
  console.log('4. Check .temp-storage/ directory for results');
  
  console.log('\n🚀 To setup Supabase tables:');
  console.log('1. Go to https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor');
  console.log('2. Run the SQL from setup-oauth-tables.sql');
  console.log('3. The flow will automatically use Supabase instead of temp storage');
}

verifyFlow().catch(console.error);