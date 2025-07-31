#!/usr/bin/env node

/**
 * End-to-End Test for OPSAI Super Foundation
 * Tests the complete YAML-to-Application generation pipeline
 */

const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

// Test YAML configurations
const testYamls = {
  ecommerce: `vertical:
  name: "E-commerce"
  description: "Online retail platform"
  industry: "retail"

business:
  name: "TechStore"
  description: "Online electronics store"
  domain: "techstore.com"

database:
  models:
    - name: "Product"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "price"
          type: "number"
          required: true
        - name: "description"
          type: "string"
        - name: "category"
          type: "string"
          required: true
        - name: "stock"
          type: "integer"
          required: true
        - name: "imageUrl"
          type: "string"

    - name: "Order"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "customerId"
          type: "string"
          required: true
        - name: "status"
          type: "string"
          required: true
        - name: "total"
          type: "number"
          required: true
        - name: "createdAt"
          type: "datetime"
          required: true

    - name: "Customer"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "email"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "phone"
          type: "string"

ui:
  theme:
    primary: "#3B82F6"
    secondary: "#6B7280"
  dashboard:
    widgets:
      - type: "chart"
        title: "Sales Overview"
        data: "orders.total"
      - type: "table"
        title: "Recent Orders"
        data: "orders"
      - type: "metric"
        title: "Total Revenue"
        data: "orders.total"

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true

features:
  authentication: true
  multiTenancy: false
  fileUpload: true
  realTimeUpdates: true
  analytics: true
  notifications: true`,

  crm: `vertical:
  name: "CRM"
  description: "Customer Relationship Management"
  industry: "business"

business:
  name: "SalesPro"
  description: "Sales and customer management platform"
  domain: "salespro.com"

database:
  models:
    - name: "Contact"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "firstName"
          type: "string"
          required: true
        - name: "lastName"
          type: "string"
          required: true
        - name: "email"
          type: "string"
          required: true
        - name: "phone"
          type: "string"
        - name: "company"
          type: "string"

    - name: "Lead"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "contactId"
          type: "string"
          required: true
        - name: "source"
          type: "string"
          required: true
        - name: "status"
          type: "string"
          required: true
        - name: "value"
          type: "number"

    - name: "Deal"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "leadId"
          type: "string"
          required: true
        - name: "amount"
          type: "number"
          required: true
        - name: "stage"
          type: "string"
          required: true
        - name: "closeDate"
          type: "date"

ui:
  theme:
    primary: "#10B981"
    secondary: "#6B7280"
  dashboard:
    widgets:
      - type: "chart"
        title: "Sales Pipeline"
        data: "deals.stage"
      - type: "table"
        title: "Recent Leads"
        data: "leads"
      - type: "metric"
        title: "Total Pipeline Value"
        data: "deals.amount"

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true

features:
  authentication: true
  multiTenancy: true
  fileUpload: false
  realTimeUpdates: true
  analytics: true
  notifications: true`,

  restaurant: `vertical:
  name: "Restaurant"
  description: "Restaurant Management System"
  industry: "hospitality"

business:
  name: "TastyBites"
  description: "Restaurant management and ordering system"
  domain: "tastybites.com"

database:
  models:
    - name: "MenuItem"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "description"
          type: "string"
        - name: "price"
          type: "number"
          required: true
        - name: "category"
          type: "string"
          required: true
        - name: "imageUrl"
          type: "string"
        - name: "available"
          type: "boolean"
          required: true

    - name: "Order"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "customerName"
          type: "string"
          required: true
        - name: "items"
          type: "json"
          required: true
        - name: "total"
          type: "number"
          required: true
        - name: "status"
          type: "string"
          required: true
        - name: "createdAt"
          type: "datetime"
          required: true

    - name: "Reservation"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "customerName"
          type: "string"
          required: true
        - name: "email"
          type: "string"
          required: true
        - name: "phone"
          type: "string"
          required: true
        - name: "date"
          type: "date"
          required: true
        - name: "time"
          type: "string"
          required: true
        - name: "guests"
          type: "integer"
          required: true

ui:
  theme:
    primary: "#F59E0B"
    secondary: "#6B7280"
  dashboard:
    widgets:
      - type: "chart"
        title: "Daily Orders"
        data: "orders.createdAt"
      - type: "table"
        title: "Today's Reservations"
        data: "reservations"
      - type: "metric"
        title: "Total Revenue"
        data: "orders.total"

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true

features:
  authentication: true
  multiTenancy: false
  fileUpload: true
  realTimeUpdates: true
  analytics: true
  notifications: true`
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  }
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
}

function recordTest(name, success, details = '') {
  testResults.total++
  if (success) {
    testResults.passed++
    log(`✅ PASS: ${name}`, 'success')
  } else {
    testResults.failed++
    log(`❌ FAIL: ${name}`, 'error')
  }
  testResults.details.push({ name, success, details })
}

// Test functions
async function testYamlValidation() {
  log('🧪 Testing YAML Validation...', 'info')
  
  try {
    // Test valid YAML
    for (const [name, yaml] of Object.entries(testYamls)) {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yamlConfig: yaml, appName: `test-${name}` })
      })
      
      const result = await response.json()
      recordTest(`YAML Validation - ${name}`, response.ok, result.message || result.error)
    }
    
    // Test invalid YAML
    const invalidYaml = `invalid: yaml: content: here`
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yamlConfig: invalidYaml, appName: 'test-invalid' })
    })
    
    const result = await response.json()
    recordTest('YAML Validation - Invalid YAML', !response.ok, 'Should reject invalid YAML')
    
  } catch (error) {
    recordTest('YAML Validation', false, error.message)
  }
}

async function testAppGeneration() {
  log('🏗️ Testing Application Generation...', 'info')
  
  try {
    // Test app generation for each template
    for (const [name, yaml] of Object.entries(testYamls)) {
      const appName = `test-${name}-${Date.now()}`
      
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yamlConfig: yaml, appName })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Check if app directory was created
        const appDir = path.join(process.cwd(), 'generated-apps', `${appName}-${result.timestamp || Date.now()}`)
        const dirExists = await fs.access(appDir).then(() => true).catch(() => false)
        
        recordTest(`App Generation - ${name}`, dirExists, `App directory created: ${appDir}`)
        
        // Check for essential files
        if (dirExists) {
          const essentialFiles = ['package.json', 'README.md', 'prisma/schema.prisma']
          let filesExist = 0
          
          for (const file of essentialFiles) {
            const filePath = path.join(appDir, file)
            const exists = await fs.access(filePath).then(() => true).catch(() => false)
            if (exists) filesExist++
          }
          
          recordTest(`App Files - ${name}`, filesExist === essentialFiles.length, 
            `${filesExist}/${essentialFiles.length} essential files created`)
        }
      } else {
        recordTest(`App Generation - ${name}`, false, result.error)
      }
    }
    
  } catch (error) {
    recordTest('App Generation', false, error.message)
  }
}

async function testDatabaseSchemaGeneration() {
  log('🗄️ Testing Database Schema Generation...', 'info')
  
  try {
    const yaml = testYamls.ecommerce
    const appName = `test-schema-${Date.now()}`
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yamlConfig: yaml, appName })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      const appDir = path.join(process.cwd(), 'generated-apps', `${appName}-${result.timestamp || Date.now()}`)
      const schemaPath = path.join(appDir, 'prisma', 'schema.prisma')
      
      try {
        const schemaContent = await fs.readFile(schemaPath, 'utf8')
        
        // Check for expected models
        const expectedModels = ['Product', 'Order', 'Customer']
        let modelsFound = 0
        
        for (const model of expectedModels) {
          if (schemaContent.includes(`model ${model}`)) {
            modelsFound++
          }
        }
        
        recordTest('Database Schema Generation', modelsFound === expectedModels.length,
          `${modelsFound}/${expectedModels.length} models found in schema`)
        
        // Check for proper field types
        const hasStringFields = schemaContent.includes('String')
        const hasNumberFields = schemaContent.includes('Float') || schemaContent.includes('Int')
        const hasDateTimeFields = schemaContent.includes('DateTime')
        
        recordTest('Schema Field Types', hasStringFields && hasNumberFields && hasDateTimeFields,
          'Schema contains proper field type mappings')
        
      } catch (error) {
        recordTest('Database Schema Generation', false, `Schema file not found: ${error.message}`)
      }
    } else {
      recordTest('Database Schema Generation', false, result.error)
    }
    
  } catch (error) {
    recordTest('Database Schema Generation', false, error.message)
  }
}

async function testApiRouteGeneration() {
  log('🔌 Testing API Route Generation...', 'info')
  
  try {
    const yaml = testYamls.crm
    const appName = `test-api-${Date.now()}`
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yamlConfig: yaml, appName })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      const appDir = path.join(process.cwd(), 'generated-apps', `${appName}-${result.timestamp || Date.now()}`)
      const apiDir = path.join(appDir, 'app', 'api')
      
      try {
        const apiFiles = await fs.readdir(apiDir, { recursive: true })
        
        // Check for expected API routes
        const expectedRoutes = ['contacts', 'leads', 'deals']
        let routesFound = 0
        
        for (const route of expectedRoutes) {
          const routeExists = apiFiles.some(file => file.includes(route))
          if (routeExists) routesFound++
        }
        
        recordTest('API Route Generation', routesFound === expectedRoutes.length,
          `${routesFound}/${expectedRoutes.length} API routes generated`)
        
      } catch (error) {
        recordTest('API Route Generation', false, `API directory not found: ${error.message}`)
      }
    } else {
      recordTest('API Route Generation', false, result.error)
    }
    
  } catch (error) {
    recordTest('API Route Generation', false, error.message)
  }
}

async function testUiComponentGeneration() {
  log('🎨 Testing UI Component Generation...', 'info')
  
  try {
    const yaml = testYamls.restaurant
    const appName = `test-ui-${Date.now()}`
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yamlConfig: yaml, appName })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      const appDir = path.join(process.cwd(), 'generated-apps', `${appName}-${result.timestamp || Date.now()}`)
      const componentsDir = path.join(appDir, 'components')
      
      try {
        const componentFiles = await fs.readdir(componentsDir)
        
        // Check for expected components
        const expectedComponents = ['Sidebar.tsx', 'StatsOverview.tsx', 'RecentActivity.tsx']
        let componentsFound = 0
        
        for (const component of expectedComponents) {
          if (componentFiles.includes(component)) {
            componentsFound++
          }
        }
        
        recordTest('UI Component Generation', componentsFound === expectedComponents.length,
          `${componentsFound}/${expectedComponents.length} UI components generated`)
        
        // Check for business-specific components
        const businessComponents = ['SalesOverview.tsx', 'InventoryStatus.tsx']
        let businessComponentsFound = 0
        
        for (const component of businessComponents) {
          if (componentFiles.includes(component)) {
            businessComponentsFound++
          }
        }
        
        recordTest('Business-Specific Components', businessComponentsFound > 0,
          `${businessComponentsFound} business-specific components generated`)
        
      } catch (error) {
        recordTest('UI Component Generation', false, `Components directory not found: ${error.message}`)
      }
    } else {
      recordTest('UI Component Generation', false, result.error)
    }
    
  } catch (error) {
    recordTest('UI Component Generation', false, error.message)
  }
}

async function testDeploymentConfigGeneration() {
  log('🚀 Testing Deployment Config Generation...', 'info')
  
  try {
    const yaml = testYamls.ecommerce
    const appName = `test-deploy-${Date.now()}`
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yamlConfig: yaml, appName })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      const appDir = path.join(process.cwd(), 'generated-apps', `${appName}-${result.timestamp || Date.now()}`)
      
      // Check for deployment files
      const deploymentFiles = ['Dockerfile', 'docker-compose.yml', '.env.example']
      let filesFound = 0
      
      for (const file of deploymentFiles) {
        const filePath = path.join(appDir, file)
        const exists = await fs.access(filePath).then(() => true).catch(() => false)
        if (exists) filesFound++
      }
      
      recordTest('Deployment Config Generation', filesFound === deploymentFiles.length,
        `${filesFound}/${deploymentFiles.length} deployment files generated`)
      
      // Check for CI/CD files
      const cicdDir = path.join(appDir, '.github', 'workflows')
      const cicdExists = await fs.access(cicdDir).then(() => true).catch(() => false)
      
      recordTest('CI/CD Generation', cicdExists, 'CI/CD workflow files generated')
      
    } else {
      recordTest('Deployment Config Generation', false, result.error)
    }
    
  } catch (error) {
    recordTest('Deployment Config Generation', false, error.message)
  }
}

async function testTemplateSystem() {
  log('📋 Testing Template System...', 'info')
  
  try {
    // Test that all built-in templates are available
    const templates = ['ecommerce-basic', 'crm-basic', 'restaurant-basic', 'saas-basic']
    
    // This would test the template system if we had a template endpoint
    // For now, we'll test that our YAML processor can handle different business types
    
    let templatesWork = 0
    
    for (const [name, yaml] of Object.entries(testYamls)) {
      try {
        const response = await fetch('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ yamlConfig: yaml, appName: `template-test-${name}` })
        })
        
        if (response.ok) {
          templatesWork++
        }
      } catch (error) {
        // Template failed
      }
    }
    
    recordTest('Template System', templatesWork === Object.keys(testYamls).length,
      `${templatesWork}/${Object.keys(testYamls).length} templates work correctly`)
    
  } catch (error) {
    recordTest('Template System', false, error.message)
  }
}

async function testErrorHandling() {
  log('⚠️ Testing Error Handling...', 'info')
  
  try {
    // Test missing required fields
    const invalidYaml = `business:
  name: "Test"
  description: "Test app"`
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yamlConfig: invalidYaml, appName: 'test-error' })
    })
    
    const result = await response.json()
    
    recordTest('Error Handling - Invalid Schema', !response.ok, 
      response.ok ? 'Should reject invalid schema' : 'Correctly rejected invalid schema')
    
    // Test malformed YAML
    const malformedYaml = `business:
  name: "Test"
  description: "Test app
  # Missing closing quote`
    
    const response2 = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yamlConfig: malformedYaml, appName: 'test-malformed' })
    })
    
    const result2 = await response2.json()
    
    recordTest('Error Handling - Malformed YAML', !response2.ok,
      response2.ok ? 'Should reject malformed YAML' : 'Correctly rejected malformed YAML')
    
  } catch (error) {
    recordTest('Error Handling', false, error.message)
  }
}

async function testPerformance() {
  log('⚡ Testing Performance...', 'info')
  
  try {
    const startTime = Date.now()
    
    // Generate multiple apps concurrently
    const promises = Object.entries(testYamls).map(([name, yaml]) => {
      return fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yamlConfig: yaml, appName: `perf-test-${name}` })
      })
    })
    
    const responses = await Promise.all(promises)
    const endTime = Date.now()
    
    const successCount = responses.filter(r => r.ok).length
    const totalTime = endTime - startTime
    
    recordTest('Performance - Concurrent Generation', successCount === Object.keys(testYamls).length,
      `${successCount}/${Object.keys(testYamls).length} apps generated in ${totalTime}ms`)
    
    // Performance threshold: should generate apps in under 30 seconds
    const performanceThreshold = 30000 // 30 seconds
    recordTest('Performance - Time Threshold', totalTime < performanceThreshold,
      `Generation completed in ${totalTime}ms (threshold: ${performanceThreshold}ms)`)
    
  } catch (error) {
    recordTest('Performance', false, error.message)
  }
}

// Main test runner
async function runEndToEndTests() {
  log('🚀 Starting OPSAI Super Foundation End-to-End Tests', 'info')
  log('=' * 60, 'info')
  
  // Check if the API server is running
  try {
    const response = await fetch('http://localhost:3000/api/generate', { method: 'GET' })
    if (!response.ok) {
      throw new Error('API server not responding')
    }
  } catch (error) {
    log('❌ API server is not running. Please start the development server first:', 'error')
    log('   npm run dev', 'warning')
    process.exit(1)
  }
  
  // Run all tests
  await testYamlValidation()
  await testAppGeneration()
  await testDatabaseSchemaGeneration()
  await testApiRouteGeneration()
  await testUiComponentGeneration()
  await testDeploymentConfigGeneration()
  await testTemplateSystem()
  await testErrorHandling()
  await testPerformance()
  
  // Print results
  log('=' * 60, 'info')
  log('📊 Test Results Summary:', 'info')
  log(`Total Tests: ${testResults.total}`, 'info')
  log(`Passed: ${testResults.passed}`, 'success')
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success')
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info')
  
  // Print detailed results
  log('\n📋 Detailed Results:', 'info')
  testResults.details.forEach(test => {
    const status = test.success ? '✅' : '❌'
    log(`${status} ${test.name}: ${test.details}`, test.success ? 'success' : 'error')
  })
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    log('\n❌ Some tests failed. Please check the details above.', 'error')
    process.exit(1)
  } else {
    log('\n🎉 All tests passed! OPSAI Super Foundation is working correctly.', 'success')
    process.exit(0)
  }
}

// Run the tests
runEndToEndTests().catch(error => {
  log(`❌ Test runner failed: ${error.message}`, 'error')
  process.exit(1)
}) 