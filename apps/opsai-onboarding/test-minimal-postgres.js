#!/usr/bin/env node

// Test minimal Postgres destination creation
async function testMinimalPostgres() {
  console.log('🧪 Testing minimal Postgres destination...\n');
  
  // Get fresh token first
  const clientId = '4af7a574-b155-47ee-8dce-2cd2c519a34a';
  const clientSecret = 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7';
  
  const tokenResponse = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid email profile'
    })
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;
  
  console.log('✅ Got fresh token');
  
  // Test different variations to find the correct one
  const variations = [
    {
      name: 'Option 1: destinationType postgres',
      config: {
        name: 'test_postgres_1',
        workspaceId: '293ab9ea-b538-4a5d-940d-7eacaffda8f5',
        destinationType: 'postgres',
        configuration: {
          host: 'aws-0-us-west-1.pooler.supabase.com',
          port: 5432,
          database: 'postgres',
          username: 'postgres.dqmufpexuuvlulpilirt',
          password: 'UbGy4kW9RFJ2LFDV'
        }
      }
    },
    {
      name: 'Option 2: definitionId postgres',
      config: {
        name: 'test_postgres_2',
        workspaceId: '293ab9ea-b538-4a5d-940d-7eacaffda8f5',
        definitionId: '25c5221d-dce2-4163-ade9-739ef790f503',
        configuration: {
          host: 'aws-0-us-west-1.pooler.supabase.com',
          port: 5432,
          database: 'postgres',
          username: 'postgres.dqmufpexuuvlulpilirt',
          password: 'UbGy4kW9RFJ2LFDV'
        }
      }
    },
    {
      name: 'Option 3: SSL require as string',
      config: {
        name: 'test_postgres_3',
        workspaceId: '293ab9ea-b538-4a5d-940d-7eacaffda8f5',
        destinationType: 'postgres',
        configuration: {
          host: 'aws-0-us-west-1.pooler.supabase.com',
          port: 5432,
          database: 'postgres',
          username: 'postgres.dqmufpexuuvlulpilirt',
          password: 'UbGy4kW9RFJ2LFDV',
          ssl: true
        }
      }
    }
  ];
  
  for (const variation of variations) {
    console.log(`\n${variation.name}:`);
    console.log('📋 Request body:', JSON.stringify(variation.config, null, 2));
    
    try {
      const response = await fetch('https://api.airbyte.com/v1/destinations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(variation.config)
      });
      
      if (response.ok) {
        const destination = await response.json();
        console.log('✅ SUCCESS!');
        console.log(`   Destination ID: ${destination.destinationId}`);
        
        // Clean up
        try {
          await fetch(`https://api.airbyte.com/v1/destinations/${destination.destinationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('🧹 Cleaned up');
        } catch (e) {}
        
        return; // Stop on first success
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed (${response.status}):`, errorText);
      }
      
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
  
  console.log('\n💡 None of the variations worked. The Postgres destination might need different fields.');
}

testMinimalPostgres().catch(console.error);