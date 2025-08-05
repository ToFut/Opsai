#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkSampleData() {
  console.log('🔍 CHECKING SAMPLE DATA FOR REPOSITORY INFORMATION\n');

  try {
    // Get all sample data
    const { data: sampleData, error } = await supabase
      .from('sample_data')
      .select('*');

    if (error) {
      console.log('❌ Error fetching sample data:', error.message);
      return;
    }

    console.log(`📊 Found ${sampleData.length} sample data records\n`);

    // Filter GitHub data
    const githubData = sampleData.filter(item => 
      item.provider === 'github' || 
      item.data?.provider === 'github' ||
      JSON.stringify(item).toLowerCase().includes('github')
    );

    console.log(`🔗 GitHub records: ${githubData.length}\n`);

    if (githubData.length > 0) {
      console.log('📋 GITHUB DATA STRUCTURE:');
      console.log('=========================');
      
      const sampleGitHub = githubData[0];
      console.log('\n🔍 Sample GitHub record fields:');
      
      Object.keys(sampleGitHub).forEach(key => {
        const value = sampleGitHub[key];
        const valueType = typeof value;
        let valuePreview = value;
        
        if (valueType === 'string' && value.length > 100) {
          valuePreview = value.substring(0, 100) + '...';
        } else if (valueType === 'object') {
          valuePreview = JSON.stringify(value).substring(0, 100) + '...';
        }
        
        console.log(`  • ${key}: ${valueType} = ${valuePreview}`);
      });

      // Check for repository-specific data
      console.log('\n🔍 REPOSITORY DATA ANALYSIS:');
      console.log('============================');
      
      const repoKeywords = [
        'repo', 'repository', 'name', 'full_name', 'description', 'html_url',
        'clone_url', 'language', 'stargazers', 'forks', 'issues', 'size',
        'private', 'fork', 'archived', 'license', 'topics', 'branch'
      ];

      let hasRepoData = false;
      
      githubData.forEach((record, index) => {
        const recordStr = JSON.stringify(record).toLowerCase();
        const foundKeywords = repoKeywords.filter(keyword => 
          recordStr.includes(keyword)
        );
        
        if (foundKeywords.length > 0) {
          hasRepoData = true;
          console.log(`\n📁 Record ${index + 1} contains repository data:`);
          foundKeywords.forEach(keyword => {
            console.log(`  ✅ ${keyword}`);
          });
        }
      });

      if (!hasRepoData) {
        console.log('  ❌ No repository-specific data found');
      }

      // Show actual repository data if available
      console.log('\n📝 ACTUAL REPOSITORY DATA EXAMPLES:');
      console.log('===================================');
      
      githubData.slice(0, 3).forEach((record, index) => {
        console.log(`\n🔍 Record ${index + 1}:`);
        
        if (record.data && typeof record.data === 'object') {
          // Look for repository information in the data field
          const dataStr = JSON.stringify(record.data);
          
          if (dataStr.includes('name') || dataStr.includes('repo')) {
            console.log('  📋 Repository details found in data field:');
            Object.keys(record.data).forEach(key => {
              const value = record.data[key];
              if (typeof value === 'string' && value.length < 100) {
                console.log(`    • ${key}: ${value}`);
              } else if (typeof value === 'number' || typeof value === 'boolean') {
                console.log(`    • ${key}: ${value}`);
              }
            });
          }
        }
      });

    } else {
      console.log('❌ No GitHub data found in sample_data table');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSampleData(); 