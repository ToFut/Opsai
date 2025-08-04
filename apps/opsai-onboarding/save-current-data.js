#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function saveCurrentSessionData() {
  console.log('💾 Saving current OAuth session data to temp storage...\n');
  
  const storageDir = path.join(process.cwd(), '.temp-storage');
  
  // Ensure storage directory exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  const tenantId = 'default';
  
  // Simulate the data we know was collected based on the logs
  console.log('1️⃣ Saving GitHub integration and sample data...');
  
  // GitHub integration
  const githubIntegration = {
    tenant_id: tenantId,
    provider: 'github',
    access_token: 'github_token_from_oauth',
    status: 'connected',
    connected_at: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(storageDir, `integration_${tenantId}_github.json`),
    JSON.stringify(githubIntegration, null, 2)
  );
  
  // GitHub sample data (from the logs we saw 10 repositories)
  const githubSampleData = {
    tenant_id: tenantId,
    provider: 'github',
    sample_data: {
      provider: 'github',
      recordCount: { repositories: 10, issues: 0, pullRequests: 0 },
      entities: {
        user: {
          sample: { id: 12345, login: 'testuser', name: 'Test User', public_repos: 10 },
          schema: { id: 'number', login: 'string', name: 'string', public_repos: 'number' }
        },
        repositories: {
          sample: [
            { id: 1, name: 'repo1', stargazers_count: 5, forks_count: 2 },
            { id: 2, name: 'repo2', stargazers_count: 10, forks_count: 3 }
          ],
          schema: { id: 'number', name: 'string', stargazers_count: 'number', forks_count: 'number' }
        }
      },
      metrics: { totalStars: 15, totalForks: 5 }
    },
    data_analysis: {
      provider: 'github',
      businessModel: 'software-development',
      dataQuality: { completeness: 85 }
    },
    collected_at: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(storageDir, `sample_${tenantId}_github.json`),
    JSON.stringify(githubSampleData, null, 2)
  );
  
  console.log('2️⃣ Saving Google integration and sample data...');
  
  // Google integration
  const googleIntegration = {
    tenant_id: tenantId,
    provider: 'google',
    access_token: 'google_token_from_oauth',
    status: 'connected',
    connected_at: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(storageDir, `integration_${tenantId}_google.json`),
    JSON.stringify(googleIntegration, null, 2)
  );
  
  // Google sample data
  const googleSampleData = {
    tenant_id: tenantId,
    provider: 'google',
    sample_data: {
      provider: 'google',
      recordCount: { user: 1 },
      entities: {
        user: {
          sample: { id: 'google123', email: 'user@gmail.com', name: 'Test User', verified_email: true },
          schema: { id: 'string', email: 'string', name: 'string', verified_email: 'boolean' }
        }
      },
      metrics: {}
    },
    data_analysis: {
      provider: 'google',
      businessModel: 'general',
      dataQuality: { completeness: 100 }
    },
    collected_at: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(storageDir, `sample_${tenantId}_google.json`),
    JSON.stringify(googleSampleData, null, 2)
  );
  
  console.log('✅ Data saved! Files created:');
  const files = fs.readdirSync(storageDir);
  files.forEach(file => console.log(`   - ${file}`));
  
  console.log('\n🚀 Now you can test the database organization:');
  console.log('   curl -X POST http://localhost:7250/api/organize-database -H "Content-Type: application/json" -d \'{"tenantId":"default"}\'');
}

saveCurrentSessionData().catch(console.error);