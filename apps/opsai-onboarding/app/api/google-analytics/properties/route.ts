import { NextRequest, NextResponse } from 'next/server'

// Get Google Analytics properties for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()
    
    // First, get the list of Google Analytics accounts
    const accountsResponse = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accounts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!accountsResponse.ok) {
      // If we can't access GA Admin API, try the legacy approach
      return await getLegacyProperties(accessToken)
    }
    
    const accountsData = await accountsResponse.json()
    const accounts = accountsData.accounts || []
    
    // Get properties for each account
    const allProperties = []
    
    for (const account of accounts) {
      const propertiesResponse = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/${account.name}/properties`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      )
      
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        const properties = propertiesData.properties || []
        
        // Get data streams for each property
        for (const property of properties) {
          const streamsResponse = await fetch(
            `https://analyticsadmin.googleapis.com/v1beta/${property.name}/dataStreams`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
              }
            }
          )
          
          if (streamsResponse.ok) {
            const streamsData = await streamsResponse.json()
            const webStreams = (streamsData.dataStreams || []).filter(
              (stream: any) => stream.type === 'WEB_DATA_STREAM'
            )
            
            allProperties.push({
              accountName: account.displayName,
              propertyId: property.name.split('/').pop(),
              propertyName: property.displayName,
              measurementId: webStreams[0]?.webStreamData?.measurementId || null,
              streamName: webStreams[0]?.displayName || null
            })
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      properties: allProperties
    })
    
  } catch (error) {
    console.error('Failed to fetch GA properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google Analytics properties' },
      { status: 500 }
    )
  }
}

// Fallback: Try to get properties without admin API
async function getLegacyProperties(accessToken: string) {
  try {
    // Try Google Analytics Reporting API v4
    const response = await fetch(
      'https://analyticsreporting.googleapis.com/v4/management/accounts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Cannot access Google Analytics')
    }
    
    const data = await response.json()
    
    // Return simplified property list
    return NextResponse.json({
      success: true,
      properties: [],
      message: 'Please enter your Google Analytics Property ID manually',
      fallbackMode: true
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      properties: [],
      message: 'Please connect with Google first to see your properties',
      requiresAuth: true
    })
  }
}