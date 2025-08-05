#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkRepoDetails() {
  console.log('🔍 CHECKING GITHUB REPOSITORY DETAILS COLLECTION\n');

  try {
    // Check user_repos table for repository details
    const { data: repos, error: reposError } = await supabase
      .from('user_repos')
      .select('*')
      .limit(5);

    if (reposError) {
      console.log('❌ Error fetching repos:', reposError.message);
      return;
    }

    console.log(`📊 Found ${repos.length} repository records\n`);

    if (repos.length > 0) {
      console.log('📋 SAMPLE REPOSITORY DATA STRUCTURE:');
      console.log('=====================================');
      
      const sampleRepo = repos[0];
      console.log('\n🔍 Repository Fields Collected:');
      
      Object.keys(sampleRepo).forEach(key => {
        const value = sampleRepo[key];
        const valueType = typeof value;
        const valuePreview = valueType === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        
        console.log(`  • ${key}: ${valueType} = ${valuePreview}`);
      });

      console.log('\n📝 DETAILED REPOSITORY INFORMATION:');
      console.log('====================================');
      
      // Show specific important fields
      const importantFields = [
        'id', 'name', 'full_name', 'description', 'html_url', 'clone_url',
        'language', 'stargazers_count', 'forks_count', 'open_issues_count',
        'size', 'default_branch', 'created_at', 'updated_at', 'pushed_at',
        'private', 'fork', 'archived', 'disabled', 'license', 'topics'
      ];

      importantFields.forEach(field => {
        if (sampleRepo[field] !== undefined) {
          console.log(`  ✅ ${field}: ${sampleRepo[field]}`);
        } else {
          console.log(`  ❌ ${field}: Not collected`);
        }
      });

      // Check for additional metadata
      console.log('\n🔍 ADDITIONAL METADATA:');
      console.log('======================');
      
      const additionalFields = Object.keys(sampleRepo).filter(key => 
        !importantFields.includes(key)
      );

      if (additionalFields.length > 0) {
        additionalFields.forEach(field => {
          console.log(`  • ${field}: ${typeof sampleRepo[field]}`);
        });
      } else {
        console.log('  No additional fields found');
      }
    }

    // Check if we have issues and pull requests data
    console.log('\n🔍 RELATED DATA COLLECTION:');
    console.log('============================');
    
    const { data: issues, error: issuesError } = await supabase
      .from('user_issues')
      .select('count')
      .limit(1);

    const { data: prs, error: prsError } = await supabase
      .from('user_pull_requests')
      .select('count')
      .limit(1);

    console.log(`  📋 Issues: ${issuesError ? 'Error' : 'Available'}`);
    console.log(`  🔀 Pull Requests: ${prsError ? 'Error' : 'Available'}`);

    // Check total repository count
    const { count: totalRepos } = await supabase
      .from('user_repos')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 TOTAL REPOSITORIES COLLECTED: ${totalRepos}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRepoDetails(); 