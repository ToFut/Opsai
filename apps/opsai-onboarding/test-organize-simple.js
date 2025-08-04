#!/usr/bin/env node

async function testOrganizeDatabase() {
  console.log('🧪 Testing Database Organization with Temp Storage\n');
  
  try {
    const response = await fetch('http://localhost:7250/api/organize-database', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ tenantId: 'default' })
    });
    
    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', text);
    
    if (response.ok) {
      const result = JSON.parse(text);
      console.log('\n✅ Database organization successful!');
      console.log('Schema ID:', result.schemaId);
      console.log('Message:', result.message);
      
      // Check if schema file was created
      const fs = require('fs');
      const path = require('path');
      const schemaFiles = fs.readdirSync('.temp-storage/').filter(f => f.startsWith('schema_'));
      
      if (schemaFiles.length > 0) {
        console.log('\n📋 Generated schema files:');
        schemaFiles.forEach(file => {
          const content = JSON.parse(fs.readFileSync(path.join('.temp-storage', file), 'utf-8'));
          console.log(`  - ${file}`);
          console.log(`    Providers: ${content.providers?.join(', ')}`);
          console.log(`    Tables: ${Object.keys(content.entities || {}).length}`);
        });
      }
    } else {
      console.log('❌ Database organization failed');
      
      // Try to parse error details
      try {
        const error = JSON.parse(text);
        console.log('Error:', error.error);
      } catch (e) {
        console.log('Raw error:', text);
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testOrganizeDatabase().catch(console.error);