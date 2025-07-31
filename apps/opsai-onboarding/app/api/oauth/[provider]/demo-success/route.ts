import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params
  const { searchParams } = request.nextUrl
  const sessionId = searchParams.get('session_id')
  const state = searchParams.get('state')

  if (!sessionId || !provider) {
    return NextResponse.redirect(
      new URL('/?error=missing_params', request.url)
    )
  }

  try {
    // Simulate successful OAuth flow for demo
    const providerDisplayNames: Record<string, string> = {
      'quickbooks': 'QuickBooks Business',
      'google-workspace': 'Google Workspace Pro',
      'salesforce': 'Salesforce Enterprise',
      'square': 'Square Restaurant',
      'stripe': 'Stripe Payments',
      'shopify': 'Shopify Store',
      'netsuite': 'NetSuite ERP',
      'sap': 'SAP Business One',
      'oracle': 'Oracle Cloud',
      'workday': 'Workday HCM',
      'slack': 'Slack Workspace',
      'zoom': 'Zoom Pro',
      'notion': 'Notion Team',
      'asana': 'Asana Projects',
      'trello': 'Trello Boards',
      'jira': 'Jira Software',
      'monday': 'Monday.com',
      'hubspot': 'HubSpot CRM',
      'mailchimp': 'Mailchimp Marketing',
      'zendesk': 'Zendesk Support',
      'calendly': 'Calendly Scheduling',
      'canva': 'Canva Pro',
      'opentable': 'OpenTable Manager',
      'doordash': 'DoorDash Business',
      'uber-eats': 'Uber Eats Restaurant',
      'resy': 'Resy Network',
      'toast': 'Toast POS',
      'restaurant365': 'Restaurant365 Suite'
    }

    const mockAccountInfo = {
      name: providerDisplayNames[provider] || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Account`,
      email: `demo@${provider}.com`,
      id: `demo_${provider}_${Date.now()}`
    }

    // For demo purposes, redirect to OAuth success page that will handle popup communication
    return NextResponse.redirect(
      new URL(
        `/oauth-success?success=true&provider=${provider}&account=${encodeURIComponent(mockAccountInfo.name)}`,
        request.url
      )
    )
  } catch (error) {
    console.error(`Demo OAuth flow failed for ${provider}:`, error)
    return NextResponse.redirect(
      new URL(`/?error=demo_oauth_failed&provider=${provider}`, request.url)
    )
  }
}