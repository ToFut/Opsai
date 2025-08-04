#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function testSampleDataCollection() {
  console.log('🧪 Testing Sample Data Collection Flow...\n');
  
  // Simulate what happens after OAuth
  const testProvider = 'github';
  const testAccessToken = 'test_token_123';
  const testTenantId = 'default';
  
  console.log('1️⃣ Simulating OAuth callback...');
  
  // Call the sample data API
  console.log('2️⃣ Fetching sample data from provider API...');
  
  try {
    const response = await fetch('http://localhost:7250/api/providers/sample-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: testProvider,
        accessToken: testAccessToken,
        tenantId: testTenantId
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Sample data fetch failed:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Sample data collected:', {
      provider: testProvider,
      recordCount: result.sampleData?.recordCount,
      entities: Object.keys(result.sampleData?.entities || {}),
      analysis: result.analysis?.businessModel
    });
    
    // Check if it can be stored
    console.log('\n3️⃣ Attempting to store in database...');
    
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tables) {
      console.log('📋 Available tables:', tables.map(t => t.table_name).join(', '));
    }
    
    // Try to list any existing data in apps table
    const { data: apps, error: appsError } = await supabase
      .from('apps')
      .select('*')
      .limit(5);
    
    if (!appsError) {
      console.log('\n📱 Sample apps table data:', apps?.length || 0, 'records');
    }
    
    console.log('\n4️⃣ Testing database organization...');
    
    // Call organize database API
    const orgResponse = await fetch('http://localhost:7250/api/organize-database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: testTenantId })
    });
    
    if (!orgResponse.ok) {
      const error = await orgResponse.text();
      console.error('❌ Database organization failed:', error);
    } else {
      const orgResult = await orgResponse.json();
      console.log('✅ Database organized:', orgResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testSampleDataCollection().catch(console.error);