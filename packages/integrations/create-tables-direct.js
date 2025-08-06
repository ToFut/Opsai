const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('Creating tables in Supabase...\n');

  // Since we can't execute raw SQL directly, let's try creating via insert
  // First, let's try to access the table to force creation
  
  try {
    // Test if table exists by querying
    const { data: testData, error: testError } = await supabase
      .from('oauth_credentials')
      .select('*')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.log('❌ Table does not exist. Please create it using Supabase dashboard:');
      console.log('\n1. Go to: https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the content from create-tables.sql');
      console.log('5. Run the query');
      console.log('\nSQL file location: packages/integrations/create-tables.sql');
      
      // Output the SQL for easy copy-paste
      console.log('\n--- SQL TO RUN ---\n');
      const fs = require('fs');
      const sql = fs.readFileSync('create-tables.sql', 'utf8');
      console.log(sql);
      
    } else if (!testError) {
      console.log('✅ oauth_credentials table already exists!');
      
      // Try inserting a test record
      const { data, error } = await supabase
        .from('oauth_credentials')
        .upsert({
          user_id: 'test-setup',
          provider: 'test',
          access_token: 'test_token_' + Date.now(),
          metadata: { test: true },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        })
        .select();

      if (error) {
        console.error('Insert test failed:', error);
      } else {
        console.log('✅ Test record inserted successfully:', data);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

createTables();