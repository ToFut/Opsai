#!/usr/bin/env node

/**
 * Test script for Airbyte Auto-Connector creation
 * 
 * This demonstrates how to automatically create connectors for various APIs
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

// Test configurations for different API types
const TEST_APIS = {
  // Example 1: Simple API with API Key
  jsonPlaceholder: {
    apiUrl: 'https://jsonplaceholder.typicode.com',
    apiName: 'JSONPlaceholder Test API',
    authType: 'api_key',
    authConfig: {
      apiKeyConfig: {
        headerName: 'X-API-Key',
        location: 'header'
      }
    },
    endpoints: [
      { name: 'users', path: '/users', method: 'GET' },
      { name: 'posts', path: '/posts', method: 'GET' },
      { name: 'comments', path: '/comments', method: 'GET' }
    ]
  },

  // Example 2: GitHub API with Bearer token
  github: {
    apiUrl: 'https://api.github.com',
    apiName: 'GitHub API',
    authType: 'bearer',
    authConfig: {},
    endpoints: [
      { name: 'user_repos', path: '/user/repos', method: 'GET' },
      { name: 'user_info', path: '/user', method: 'GET' },
      { name: 'user_orgs', path: '/user/orgs', method: 'GET' }
    ]
  },

  // Example 3: OpenAPI auto-discovery
  petstore: {
    apiUrl: 'https://petstore.swagger.io/v2',
    apiName: 'Swagger Petstore',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    autoDiscover: true
  }
}

async function testAutoConnector(apiKey, config) {
  console.log(`\n🔧 Testing auto-connector for: ${config.apiName || apiKey}`)
  console.log('=' .repeat(50))

  try {
    const response = await fetch(`${BASE_URL}/api/airbyte/connectors/auto-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'test-tenant-123',
        ...config
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Success! Connector created:')
      console.log(`   - Connector ID: ${data.connectorId}`)
      console.log(`   - Name: ${data.connector.name}`)
      console.log(`   - Auth Type: ${data.connector.authType}`)
      console.log(`   - Endpoints: ${data.connector.endpoints.length}`)
      
      if (data.connector.endpoints.length > 0) {
        console.log('\n📋 Discovered Endpoints:')
        data.connector.endpoints.forEach(ep => {
          console.log(`   - ${ep.method} ${ep.path} (${ep.name})`)
        })
      }

      if (data.nextSteps) {
        console.log('\n📌 Next Steps:')
        data.nextSteps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step}`)
        })
      }

      // Save manifest if available
      if (data.connector.manifest) {
        const fs = require('fs')
        const yaml = require('js-yaml')
        const manifestYaml = yaml.dump(data.connector.manifest)
        const filename = `${apiKey}-connector-manifest.yaml`
        fs.writeFileSync(filename, manifestYaml)
        console.log(`\n💾 Manifest saved to: ${filename}`)
      }

    } else {
      console.error('❌ Error:', data.error)
      if (data.details) {
        console.error('   Details:', data.details)
      }
      if (data.suggestion) {
        console.error('   Suggestion:', data.suggestion)
      }
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

async function testTemplateConnector(sourceType) {
  console.log(`\n🚀 Testing template connector: ${sourceType}`)
  console.log('=' .repeat(50))

  try {
    const response = await fetch(`${BASE_URL}/api/airbyte/sources/auto-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'test-tenant-123',
        sourceType: sourceType,
        connectionName: `${sourceType}-test-${Date.now()}`
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log('✅ Success! Source created:')
      console.log(`   - Source ID: ${data.source.sourceId}`)
      console.log(`   - Name: ${data.source.name}`)
      console.log(`   - Type: ${data.source.type}`)
      console.log(`   - Status: ${data.source.status}`)
    } else if (data.requiresSetup || data.requiresOAuth) {
      console.log('⚠️  Additional setup required:')
      if (data.setupInstructions) {
        data.setupInstructions.forEach(instruction => {
          console.log(`   ${instruction}`)
        })
      }
      if (data.configTemplate) {
        console.log('\n📋 Configuration Template:')
        console.log(JSON.stringify(data.configTemplate, null, 2))
      }
    } else {
      console.error('❌ Error:', data.error)
      if (data.details) {
        console.error('   Details:', data.details)
      }
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

async function listTemplates() {
  console.log('\n📚 Available Connector Templates')
  console.log('=' .repeat(50))

  try {
    const response = await fetch(`${BASE_URL}/api/airbyte/sources/auto-setup`)
    const data = await response.json()

    if (response.ok) {
      console.log(`Total templates available: ${data.count}\n`)
      
      Object.entries(data.categories).forEach(([category, connectors]) => {
        console.log(`${category.toUpperCase()}:`)
        connectors.forEach(connector => {
          const template = data.connectors.find(c => c.sourceType === connector)
          if (template) {
            console.log(`  - ${template.name} ${template.requiresOAuth ? '(OAuth)' : '(API Key)'}`)
            console.log(`    Docs: ${template.documentationUrl}`)
          }
        })
        console.log()
      })
    }
  } catch (error) {
    console.error('❌ Failed to fetch templates:', error.message)
  }
}

// Main execution
async function main() {
  console.log('🤖 Airbyte Auto-Connector Test Suite')
  console.log('=====================================')

  // Check if Airbyte is configured
  if (!process.env.AIRBYTE_API_KEY || !process.env.AIRBYTE_WORKSPACE_ID) {
    console.log('\n⚠️  WARNING: Airbyte environment variables not configured')
    console.log('Please set AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID')
    console.log('\nContinuing with demo mode...\n')
  }

  // List available templates
  await listTemplates()

  // Test template connectors
  console.log('\n\n🧪 TESTING TEMPLATE CONNECTORS')
  console.log('================================')
  await testTemplateConnector('stripe')
  await testTemplateConnector('shopify')

  // Test custom API connectors
  console.log('\n\n🧪 TESTING CUSTOM API CONNECTORS')
  console.log('==================================')
  
  for (const [key, config] of Object.entries(TEST_APIS)) {
    await testAutoConnector(key, config)
  }

  console.log('\n\n✅ Test suite completed!')
  console.log('\nTo use these connectors:')
  console.log('1. Configure Airbyte credentials in your .env file')
  console.log('2. Upload generated YAML manifests to Airbyte')
  console.log('3. Create source instances with proper authentication')
  console.log('4. Set up destinations and sync schedules')
}

// Run tests
main().catch(console.error)