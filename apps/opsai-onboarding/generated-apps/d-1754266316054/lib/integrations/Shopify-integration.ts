import { AirbyteClient } from '@/lib/airbyte-client'

interface ShopifyData {
  products: any[]
  orders: any[]
  customers: any[]
  inventory: any[]
}

export class ShopifyIntegration {
  private airbyte: AirbyteClient
  private sourceId: string = '73368a09-8c3e-467d-b30c-0617f2b50dd2'
  
  constructor() {
    this.airbyte = new AirbyteClient()
  }
  
  // Get real Shopify data via Airbyte
  async getProducts(): Promise<any[]> {
    try {
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        await this.airbyte.triggerSync(connection.connectionId)
        return await this.getDataFromDestination('shopify_products')
      }
      return []
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error)
      return []
    }
  }
  
  async getOrders(): Promise<any[]> {
    try {
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        return await this.getDataFromDestination('shopify_orders')
      }
      return []
    } catch (error) {
      console.error('Failed to fetch Shopify orders:', error)
      return []
    }
  }
  
  async getCustomers(): Promise<any[]> {
    try {
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        return await this.getDataFromDestination('shopify_customers')
      }
      return []
    } catch (error) {
      console.error('Failed to fetch Shopify customers:', error)
      return []
    }
  }
  
  async getAllData(): Promise<ShopifyData> {
    const [products, orders, customers] = await Promise.all([
      this.getProducts(),
      this.getOrders(),
      this.getCustomers()
    ])
    
    return {
      products,
      orders,
      customers,
      inventory: [] // Will be populated by Airbyte sync
    }
  }
  
  private async getDataFromDestination(tableName: string): Promise<any[]> {
    const response = await fetch('/api/airbyte/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: tableName, source: 'shopify' })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.records || []
    }
    
    return []
  }
  
  async syncNow(): Promise<boolean> {
    try {
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        await this.airbyte.triggerSync(connection.connectionId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to trigger Shopify sync:', error)
      return false
    }
  }
}

export default ShopifyIntegration