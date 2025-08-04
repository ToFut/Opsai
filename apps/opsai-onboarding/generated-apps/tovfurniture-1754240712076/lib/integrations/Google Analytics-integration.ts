import { AirbyteClient } from '@/lib/airbyte-client'

interface GoogleAnalyticsData {
  sessions: any[]
  pageviews: any[]
  events: any[]
  conversions: any[]
}

export class GoogleAnalyticsIntegration {
  private airbyte: AirbyteClient
  
  constructor() {
    this.airbyte = new AirbyteClient()
  }
  
  async getSessions(): Promise<any[]> {
    try {
      return await this.getDataFromDestination('ga_sessions')
    } catch (error) {
      console.error('Failed to fetch GA sessions:', error)
      return []
    }
  }
  
  async getPageviews(): Promise<any[]> {
    try {
      return await this.getDataFromDestination('ga_pageviews')
    } catch (error) {
      console.error('Failed to fetch GA pageviews:', error)
      return []
    }
  }
  
  async getAllData(): Promise<GoogleAnalyticsData> {
    const [sessions, pageviews] = await Promise.all([
      this.getSessions(),
      this.getPageviews()
    ])
    
    return {
      sessions,
      pageviews,
      events: [],
      conversions: []
    }
  }
  
  private async getDataFromDestination(tableName: string): Promise<any[]> {
    const response = await fetch('/api/airbyte/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: tableName, source: 'google_analytics' })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.records || []
    }
    
    return []
  }
}

export default GoogleAnalyticsIntegration