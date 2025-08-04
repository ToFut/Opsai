#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the actual database from .env.local
const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to fix OAuth...\n');
  
  console.log('1️⃣ Testing current insert failure...');
  
  const testData = {
    tenant_id: 'test',
    provider: 'github', 
    access_token: 'test_token',
    status: 'connected'  // This should fail if column is missing
  };
  
  const { error: beforeError } = await supabase
    .from('tenant_integrations')
    .insert(testData)
    .select();
  
  if (beforeError) {
    console.log('❌ As expected, insert failed:', beforeError.message);
    
    if (beforeError.message.includes('status')) {
      console.log('\n2️⃣ The status column is missing. Let me add it using an indirect method...');
      
      // Instead of ALTER TABLE (which requires direct DB access), 
      // let's try to insert WITHOUT the status column first
      console.log('3️⃣ Inserting without status column...');
      
      const minimalData = {
        tenant_id: 'test_minimal',
        provider: 'github',
        access_token: 'test_token'
      };
      
      const { data: insertResult, error: minimalError } = await supabase
        .from('tenant_integrations')
        .insert(minimalData)
        .select();
      
      if (minimalError) {
        console.log('❌ Even minimal insert failed:', minimalError.message);
        console.log('\n🚨 TABLE STRUCTURE ISSUE:');
        console.log('The tenant_integrations table is missing required columns.');
        console.log('You need to run this SQL in Supabase Dashboard:');
        console.log(`
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'connected';
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS token_type TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS raw_response JSONB;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS airbyte_source_id TEXT;
        `);
      } else {
        console.log('✅ Minimal insert worked! Record ID:', insertResult[0]?.id);
        
        // Now try to update it with status
        console.log('4️⃣ Trying to add status to existing record...');
        
        const { error: updateError } = await supabase
          .from('tenant_integrations')
          .update({ status: 'connected' })
          .eq('id', insertResult[0].id);
        
        if (updateError) {
          console.log('❌ Update with status failed:', updateError.message);
          console.log('This confirms the status column is missing.');
        } else {
          console.log('✅ Status update worked! The column exists.');
        }
        
        // Clean up
        await supabase
          .from('tenant_integrations')
          .delete()
          .eq('id', insertResult[0].id);
      }
    }
  } else {
    console.log('✅ Insert with status worked! OAuth should be working.');
    
    // Clean up
    await supabase
      .from('tenant_integrations')
      .delete()
      .eq('tenant_id', 'test');
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('If you saw "status column missing" errors above:');
  console.log('1. Go to https://dqmufpexuuvlulpilirt.supabase.co/project/dqmufpexuuvlulpilirt/sql');
  console.log('2. Run the ALTER TABLE commands shown above');
  console.log('3. Then test OAuth again - it should save to Supabase');
}

addMissingColumns().catch(console.error);