#!/usr/bin/env node

async function checkAirbyteConnections() {
  console.log('🔍 Checking Airbyte connections and data sync status...\n');
  
  const airbyteApiKey = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6Z1BPdmhDSC1Ic21OQnhhV3lnLU11dlF6dHJERTBDSEJHZDB2MVh0Vnk0In0.eyJleHAiOjE3NTQzMTI2ODQsImlhdCI6MTc1NDMxMTc4NCwianRpIjoiYTQwY2RlMzktMjJhMi00YjkzLThjYzgtMmQ3ZGZmNWI3M2Y5IiwiaXNzIjoiaHR0cHM6Ly9jbG91ZC5haXJieXRlLmNvbS9hdXRoL3JlYWxtcy9fYWlyYnl0ZS1hcHBsaWNhdGlvbi1jbGllbnRzIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjU3NjRjODkyLTMxM2MtNGJmNS04MzQ2LTU1NGZhYjQ2YTMwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6IjRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtX2FpcmJ5dGUtYXBwbGljYXRpb24tY2xpZW50cyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJjbGllbnRIb3N0IjoiMTcyLjIzLjAuMjM5IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ1c2VyX2lkIjoiNTc2NGM4OTItMzEzYy00YmY1LTgzNDYtNTU0ZmFiNDZhMzBlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LTRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImNsaWVudEFkZHJlc3MiOiIxNzIuMjMuMC4yMzkiLCJjbGllbnRfaWQiOiI0YWY3YTU3NC1iMTU1LTQ3ZWUtOGRjZS0yY2QyYzUxOWEzNGEifQ.OxjdpC6RQG8-nSKujQJ4kKW46W_L33mqzb6XuzmnMTx2l_OSVeFUXGUcTRpk6Qn4n2nQlszLLr9v20erLAzdS353Tbalja48K2jAgz8JWd5JGJVvnZHksDCoKsYxx8YT6bxuZxBXbyqjzeahB73EAP1cFii_GMFydt1vgTeV7-NUW-92ZeiUAxq0vnHrkLzxg1BNqU0T837wBZE9n_ZpN5wazldf646gy52nz5lv7mJt7UZ8629d8bSRxV7_KPOiEeRUMqH6bHTMPqXddV0JGnfZ5v347pXCdKVAMvQ5e7KmTW0_0bBelURAG4ttX7rCbwU1kTMmBJXje0I-jjMGnQ';
  const workspaceId = '293ab9ea-b538-4a5d-940d-7eacaffda8f5';
  
  console.log('1️⃣ Listing all connections in workspace...');
  
  try {
    const connectionsResponse = await fetch('https://api.airbyte.com/v1/connections', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airbyteApiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!connectionsResponse.ok) {
      throw new Error(`HTTP ${connectionsResponse.status}: ${await connectionsResponse.text()}`);
    }
    
    const connections = await connectionsResponse.json();
    
    console.log(`📊 Found ${connections.data?.length || 0} connections`);
    
    if (connections.data?.length > 0) {
      for (const connection of connections.data) {
        console.log(`📡 Connection: ${connection.name}`);
        console.log(`   Status: ${connection.status}`);
        console.log(`   Source: ${connection.sourceId}`);
        console.log(`   Destination: ${connection.destinationId}`);
        console.log(`   Last sync: ${connection.latestSyncJobStatus || 'Never'}`);
        console.log('');
      }
      
      // Check if any connection is syncing to our Supabase
      const supabaseConnections = connections.data.filter(conn => 
        conn.name?.includes('postgres') || 
        conn.name?.includes('supabase') ||
        conn.destinationId?.includes('supabase')
      );
      
      if (supabaseConnections.length > 0) {
        console.log('✅ Found connections to Supabase!');
      } else {
        console.log('❌ No connections found that sync to Supabase');
        console.log('🚨 This is why data is not automatically flowing to Supabase');
      }
      
    } else {
      console.log('❌ No Airbyte connections found');
      console.log('🚨 This explains why data is not syncing to Supabase automatically');
    }
    
  } catch (error) {
    console.log('❌ Failed to check Airbyte connections:', error.message);
  }
  
  console.log('\n2️⃣ Checking sources...');
  
  try {
    const sourcesResponse = await fetch('https://api.airbyte.com/v1/sources', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airbyteApiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!sourcesResponse.ok) {
      throw new Error(`HTTP ${sourcesResponse.status}: ${await sourcesResponse.text()}`);
    }
    
    const sources = await sourcesResponse.json();
    
    console.log(`📊 Found ${sources.data?.length || 0} sources`);
    
    const existingSources = {
      'github': '7c0ee77f-488d-4ff3-b67e-3bcad9151a9b',
      'stripe': '95c2880d-903a-4e15-b9a4-af77e59a2484',
      'shopify': '73368a09-8c3e-467d-b30c-0617f2b50dd2',
      'google': 'f992af97-c80e-4465-85f4-b1b5ed7af58f'
    };
    
    for (const [provider, expectedId] of Object.entries(existingSources)) {
      const source = sources.data?.find(s => s.sourceId === expectedId);
      if (source) {
        console.log(`✅ ${provider}: ${source.name} (${source.sourceId})`);
      } else {
        console.log(`❌ ${provider}: Source ${expectedId} not found`);
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to check sources:', error.message);
  }
  
  console.log('\n💡 SUMMARY:');
  console.log('If no connections are found, Airbyte is NOT automatically syncing');
  console.log('data to Supabase. The OAuth flow needs to create actual connections');
  console.log('that link sources to Supabase destination.');
}

checkAirbyteConnections().catch(console.error);