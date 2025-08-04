#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function testSchemaInsert() {
  console.log('🔍 Testing schema insert that organize-database route does...\n');
  
  const fullTestData = {
    tenant_id: 'test',
    providers: ['github'],
    entities: { test: { fields: { id: 'serial' } } },
    relationships: [{ from: 'a', to: 'b' }],
    indexes: [{ table: 'test', column: 'id' }],
    views: [{ name: 'test_view', definition: 'SELECT * FROM test' }]
  };
  
  console.log('1️⃣ Testing full schema insert...');
  
  const { error: fullError } = await supabase
    .from('tenant_data_schemas')
    .insert(fullTestData);
  
  if (fullError) {
    console.log('❌ Full insert failed:', fullError.message);
    
    // Test with minimal data
    console.log('\n2️⃣ Testing minimal schema insert...');
    
    const { data: minimalData, error: minimalError } = await supabase
      .from('tenant_data_schemas')
      .insert({
        tenant_id: 'test',
        providers: ['github'],
        entities: { test: { fields: { id: 'serial' } } }
      })
      .select();
    
    if (minimalError) {
      console.log('❌ Minimal insert failed:', minimalError.message);
    } else {
      console.log('✅ Minimal insert worked!');
      console.log('   Record ID:', minimalData[0]?.id);
      
      // Clean up
      await supabase
        .from('tenant_data_schemas')
        .delete()
        .eq('id', minimalData[0].id);
    }
  } else {
    console.log('✅ Full schema insert worked!');
  }
  
  console.log('\n💡 SOLUTION:');
  console.log('If full insert failed, the organize-database route needs to be updated');
  console.log('to only insert the columns that exist in tenant_data_schemas table.');
}

testSchemaInsert().catch(console.error);