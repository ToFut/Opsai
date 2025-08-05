import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { tenantId } = await request.json()
    
    // Get the Google access token from storage
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('access_token')
      .eq('tenant_id', tenantId)
      .eq('provider', 'google')
      .single()
    
    if (!integration?.access_token) {
      return NextResponse.json({ error: 'Google not connected' }, { status: 400 })
    }
    
    // Fetch Google Analytics accounts
    const accountsResponse = await fetch(
      'https://analyticsadmin.googleapis.com/v1alpha/accounts',
      {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!accountsResponse.ok) {
      // Try GA4 Data API as fallback
      return await getGA4Properties(integration.access_token)
    }
    
    const accountsData = await accountsResponse.json()
    const properties = []
    
    // Get properties for each account
    for (const account of accountsData.accounts || []) {
      const propsResponse = await fetch(
        `https://analyticsadmin.googleapis.com/v1alpha/properties?filter=parent:${account.name}`,
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Accept': 'application/json'
          }
        }
      )
      
      if (propsResponse.ok) {
        const propsData = await propsResponse.json()
        
        for (const property of propsData.properties || []) {
          // Get data streams
          const streamsResponse = await fetch(
            `https://analyticsadmin.googleapis.com/v1alpha/${property.name}/dataStreams`,
            {
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Accept': 'application/json'
              }
            }
          )
          
          if (streamsResponse.ok) {
            const streamsData = await streamsResponse.json()
            const webStream = streamsData.dataStreams?.find((s: any) => s.type === 'WEB_DATA_STREAM')
            
            properties.push({
              propertyId: property.name.split('/').pop(),
              displayName: property.displayName,
              measurementId: webStream?.webStreamData?.measurementId,
              accountName: account.displayName,
              propertyName: property.displayName
            })
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      properties
    })
    
  } catch (error) {
    console.error('Failed to fetch GA properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google Analytics properties' },
      { status: 500 }
    )
  }
}

// Fallback method using reporting API
async function getGA4Properties(accessToken: string) {
  try {
    // Try to get user info first
    const userResponse = await fetch(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )
    
    if (userResponse.ok) {
      // Return instructions for manual entry
      return NextResponse.json({
        success: true,
        properties: [],
        requiresManualEntry: true,
        instructions: "Please go to Google Analytics > Admin > Property Settings to find your Property ID"
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unable to fetch properties'
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to access Google Analytics'
    }, { status: 500 })
  }
}