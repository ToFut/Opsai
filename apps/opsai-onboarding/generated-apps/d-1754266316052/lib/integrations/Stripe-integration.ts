import { AirbyteClient } from '@/lib/airbyte-client'

interface StripeData {
  customers: any[]
  payments: any[]
  subscriptions: any[]
  charges: any[]
}

export class StripeIntegration {
  private airbyte: AirbyteClient
  private sourceId: string = '95c2880d-903a-4e15-b9a4-af77e59a2484'
  
  constructor() {
    this.airbyte = new AirbyteClient()
  }
  
  // Get real Stripe data via Airbyte
  async getCustomers(): Promise<any[]> {
    try {
      // Trigger sync and get data from Airbyte destination
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        await this.airbyte.triggerSync(connection.connectionId)
        return await this.getDataFromDestination('stripe_customers')
      }
      return []
    } catch (error) {
      console.error('Failed to fetch Stripe customers:', error)
      return []
    }
  }
  
  async getPayments(): Promise<any[]> {
    try {
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        return await this.getDataFromDestination('stripe_payment_intents')
      }
      return []
    } catch (error) {
      console.error('Failed to fetch Stripe payments:', error)
      return []
    }
  }
  
  async getSubscriptions(): Promise<any[]> {
    try {
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        return await this.getDataFromDestination('stripe_subscriptions')
      }
      return []
    } catch (error) {
      console.error('Failed to fetch Stripe subscriptions:', error)
      return []
    }
  }
  
  async getAllData(): Promise<StripeData> {
    const [customers, payments, subscriptions] = await Promise.all([
      this.getCustomers(),
      this.getPayments(),
      this.getSubscriptions()
    ])
    
    return {
      customers,
      payments,
      subscriptions,
      charges: [] // Will be populated by Airbyte sync
    }
  }
  
  private async getDataFromDestination(tableName: string): Promise<any[]> {
    // Query Supabase destination for synced data
    const response = await fetch('/api/airbyte/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: tableName, source: 'stripe' })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.records || []
    }
    
    return []
  }
  
  // Real-time sync trigger
  async syncNow(): Promise<boolean> {
    try {
      const connection = await this.airbyte.getConnectionBySourceId(this.sourceId)
      if (connection) {
        await this.airbyte.triggerSync(connection.connectionId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to trigger Stripe sync:', error)
      return false
    }
  }
}

export default StripeIntegration