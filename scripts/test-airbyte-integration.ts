#!/usr/bin/env node
/**
 * Test script for Airbyte integration and schema generation
 * Run with: npx tsx scripts/test-airbyte-integration.ts
 */

import { DynamicSchemaGenerator } from '../packages/schema-generator/src'
import { TenantManager } from '../apps/opsai-onboarding/lib/tenant-manager'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

async function testAirbyteIntegration() {
  console.log('🧪 Testing OpsAI Airbyte Integration...\n')
  
  try {
    // Step 1: Create test tenant
    console.log('1️⃣ Creating test tenant...')
    const tenantId = await TenantManager.createTenant({
      name: 'Test E-commerce Store',
      industry: 'ecommerce',
      type: 'b2c',
      description: 'Test store for integration testing',
      websiteUrl: 'https://test-store.example.com'
    })
    console.log(`   ✅ Tenant created: ${tenantId}`)
    
    // Step 2: Simulate Airbyte data sources
    console.log('\n2️⃣ Simulating Airbyte data sources...')
    const mockDataSources = [
      {
        source: 'shopify',
        type: 'shopify',
        data: {
          customers: [
            {
              id: 'cust_1',
              email: 'john@example.com',
              first_name: 'John',
              last_name: 'Doe',
              total_spent: '1250.50',
              orders_count: 5,
              created_at: '2024-01-15T10:00:00Z',
              tags: ['vip', 'wholesale']
            },
            {
              id: 'cust_2',
              email: 'jane@example.com',
              first_name: 'Jane',
              last_name: 'Smith',
              total_spent: '890.25',
              orders_count: 3,
              created_at: '2024-01-16T10:00:00Z',
              tags: ['retail']
            }
          ],
          orders: [
            {
              id: 'order_1',
              order_number: 1001,
              customer_id: 'cust_1',
              total_price: '250.00',
              financial_status: 'paid',
              fulfillment_status: 'fulfilled',
              created_at: '2024-01-20T15:30:00Z'
            }
          ],
          products: [
            {
              id: 'prod_1',
              title: 'Premium Widget',
              vendor: 'Acme Corp',
              product_type: 'Widget',
              price: '99.99',
              inventory_quantity: 150,
              sku: 'WDG-001'
            }
          ]
        }
      },
      {
        source: 'stripe',
        type: 'stripe',
        data: {
          customers: [
            {
              id: 'cus_123',
              email: 'john@example.com',
              name: 'John Doe',
              currency: 'usd',
              balance: 0,
              created: 1705320000
            }
          ],
          payments: [
            {
              id: 'pi_123',
              amount: 25000, // $250.00
              currency: 'usd',
              customer: 'cus_123',
              status: 'succeeded',
              created: 1705924200
            }
          ],
          subscriptions: [
            {
              id: 'sub_123',
              customer: 'cus_123',
              status: 'active',
              current_period_end: 1708516200,
              items: {
                data: [{
                  price: {
                    id: 'price_123',
                    unit_amount: 4999,
                    recurring: { interval: 'month' }
                  }
                }]
              }
            }
          ]
        }
      }
    ]
    console.log('   ✅ Mock data sources prepared')
    
    // Step 3: Track integrations
    console.log('\n3️⃣ Tracking integrations...')
    await TenantManager.trackIntegration(tenantId, 'shopify', 'connected', {
      shop_name: 'test-store.myshopify.com',
      api_version: '2024-01'
    })
    await TenantManager.trackIntegration(tenantId, 'stripe', 'connected', {
      account_id: 'acct_123',
      livemode: false
    })
    console.log('   ✅ Integrations tracked')
    
    // Step 4: Generate dynamic schema
    console.log('\n4️⃣ Generating dynamic schema...')
    const outputPath = path.join(
      process.cwd(),
      'test-output',
      `tenant-${tenantId}`,
      'prisma',
      'schema.prisma'
    )
    
    const { schema, models, insights } = await DynamicSchemaGenerator.generateFromDataSources(
      mockDataSources,
      {
        databaseProvider: 'postgresql',
        multiTenant: true,
        tenantId,
        outputPath,
        includeSeeds: true
      }
    )
    
    console.log('   ✅ Schema generated successfully!')
    console.log(`   📁 Output path: ${outputPath}`)
    console.log(`   📊 Models created: ${models.map(m => m.name).join(', ')}`)
    
    // Step 5: Display insights
    console.log('\n5️⃣ AI Insights:')
    console.log('   • Business Logic:', insights.businessLogic || ['E-commerce data model detected'])
    console.log('   • Suggested Features:', insights.computedFields || ['customerLifetimeValue', 'inventoryAlerts'])
    console.log('   • Data Quality:', insights.dataQuality || ['Good - consistent naming'])
    
    // Step 6: Show sample schema
    console.log('\n6️⃣ Generated Schema Preview:')
    console.log('```prisma')
    console.log(schema.split('\n').slice(0, 30).join('\n'))
    console.log('... (truncated)')
    console.log('```')
    
    // Step 7: Track generated app
    console.log('\n7️⃣ Tracking generated app...')
    await TenantManager.trackGeneratedApp(tenantId, {
      name: 'test-ecommerce-app',
      type: 'ecommerce',
      features: ['shopify-sync', 'stripe-payments', 'customer-analytics']
    })
    console.log('   ✅ App tracked in database')
    
    console.log('\n✨ Test completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Check generated schema at:', outputPath)
    console.log('   2. View tenant in Supabase dashboard')
    console.log('   3. Run the full onboarding flow at http://localhost:3000')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testAirbyteIntegration().catch(console.error)