const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🗄️ Setting up database tables...\n');

  try {
    // Create oauth_credentials table
    const { error: tableError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS oauth_credentials (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          provider VARCHAR(50) NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          expires_at TIMESTAMP,
          scope TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, provider)
        );
      `
    });

    if (tableError) {
      console.log('Note: Table might already exist, continuing...');
    } else {
      console.log('✅ Created oauth_credentials table');
    }

    // Create airbyte_connections table
    const { error: connError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS airbyte_connections (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          provider VARCHAR(50) NOT NULL,
          connection_id VARCHAR(255),
          source_id VARCHAR(255),
          destination_id VARCHAR(255),
          status VARCHAR(50),
          schedule JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, provider)
        );
      `
    });

    if (!connError) {
      console.log('✅ Created airbyte_connections table');
    }

    // Test by inserting a demo record
    const { data, error: insertError } = await supabase
      .from('oauth_credentials')
      .upsert({
        user_id: 'demo-user',
        provider: 'demo',
        access_token: 'demo_token',
        metadata: { test: true },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (insertError) {
      console.log('⚠️ Could not insert test record:', insertError.message);
    } else {
      console.log('✅ Database setup complete! Test record inserted.');
    }

    // Verify tables exist
    const { data: testData, error: testError } = await supabase
      .from('oauth_credentials')
      .select('*')
      .limit(1);

    if (!testError) {
      console.log('✅ Verified: oauth_credentials table is accessible');
      console.log('📊 Sample data:', testData);
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();