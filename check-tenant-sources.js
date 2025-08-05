#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkTenantSources() {
  console.log('🔍 CHECKING TENANT_SOURCES FOR REPOSITORY DATA\n');

  try {
    // Get all tenant sources
    const { data: sources, error } = await supabase
      .from('tenant_sources')
      .select('*');

    if (error) {
      console.log('❌ Error fetching tenant sources:', error.message);
      return;
    }

    console.log(`📊 Found ${sources.length} tenant sources\n`);

    // Filter GitHub sources
    const githubSources = sources.filter(source => 
      source.source_type === 'github' || 
      source.name.toLowerCase().includes('github')
    );

    console.log(`🔗 GitHub sources: ${githubSources.length}\n`);

    if (githubSources.length > 0) {
      console.log('📋 GITHUB SOURCE DETAILS:');
      console.log('==========================');
      
      githubSources.forEach((source, index) => {
        console.log(`\n🔍 Source ${index + 1}:`);
        console.log(`  • Name: ${source.name}`);
        console.log(`  • Type: ${source.source_type}`);
        console.log(`  • Status: ${source.status}`);
        console.log(`  • Created: ${source.created_at}`);
        
        if (source.sample_data && Object.keys(source.sample_data).length > 0) {
          console.log(`  • Sample Data Keys: ${Object.keys(source.sample_data).join(', ')}`);
          
          // Check for repository data in sample_data
          const sampleDataStr = JSON.stringify(source.sample_data).toLowerCase();
          const repoKeywords = [
            'repo', 'repository', 'name', 'full_name', 'description', 'html_url',
            'clone_url', 'language', 'stargazers', 'forks', 'issues', 'size',
            'private', 'fork', 'archived', 'license', 'topics', 'branch'
          ];
          
          const foundKeywords = repoKeywords.filter(keyword => 
            sampleDataStr.includes(keyword)
          );
          
          if (foundKeywords.length > 0) {
            console.log(`  ✅ Repository data found: ${foundKeywords.join(', ')}`);
          } else {
            console.log(`  ❌ No repository-specific data found`);
          }
        } else {
          console.log(`  • Sample Data: None`);
        }
      });

      // Show detailed sample data for first GitHub source
      if (githubSources[0].sample_data) {
        console.log('\n📝 DETAILED SAMPLE DATA ANALYSIS:');
        console.log('==================================');
        
        const sampleData = githubSources[0].sample_data;
        console.log('\n🔍 Sample data structure:');
        
        Object.keys(sampleData).forEach(key => {
          const value = sampleData[key];
          const valueType = typeof value;
          
          if (valueType === 'object' && value !== null) {
            console.log(`  📁 ${key}: ${valueType} with ${Object.keys(value).length} properties`);
            
            // Show first few properties
            Object.keys(value).slice(0, 5).forEach(subKey => {
              const subValue = value[subKey];
              const subValueType = typeof subValue;
              let preview = subValue;
              
              if (subValueType === 'string' && subValue.length > 50) {
                preview = subValue.substring(0, 50) + '...';
              }
              
              console.log(`    • ${subKey}: ${subValueType} = ${preview}`);
            });
            
            if (Object.keys(value).length > 5) {
              console.log(`    ... and ${Object.keys(value).length - 5} more properties`);
            }
          } else {
            let preview = value;
            if (valueType === 'string' && value.length > 100) {
              preview = value.substring(0, 100) + '...';
            }
            console.log(`  • ${key}: ${valueType} = ${preview}`);
          }
        });
      }

    } else {
      console.log('❌ No GitHub sources found');
      
      // Show all source types
      const sourceTypes = [...new Set(sources.map(s => s.source_type))];
      console.log('\n📊 Available source types:');
      sourceTypes.forEach(type => {
        const count = sources.filter(s => s.source_type === type).length;
        console.log(`  • ${type}: ${count} sources`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTenantSources(); 