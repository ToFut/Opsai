const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Try to query a simple table
    const { data, error } = await supabase
      .from('oauth_credentials')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Query error:', error);
      
      // Try to create the table if it doesn't exist
      console.log('\nAttempting to create table...');
      const { data: createData, error: createError } = await supabase
        .from('oauth_credentials')
        .insert({
          user_id: 'test-user',
          provider: 'test',
          access_token: 'test-token',
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('Insert error:', createError);
      } else {
        console.log('Insert successful:', createData);
      }
    } else {
      console.log('Query successful! Data:', data);
    }

  } catch (error) {
    console.error('Connection error:', error);
  }
}

testConnection();