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
      // Core Business & Finance
      'quickbooks': 'QuickBooks Business',
      'square': 'Square Restaurant',
      'stripe': 'Stripe Payments',
      'shopify': 'Shopify Store',
      'paypal': 'PayPal Business',
      'klarna': 'Klarna Payments',
      'amazon': 'Amazon Seller Central',
      
      // Security & Compliance
      'nudge-security': 'Nudge Security Platform',
      'okta': 'Okta Identity',
      'auth0': 'Auth0 Platform',
      
      // Google & Microsoft
      'google-workspace': 'Google Workspace Pro',
      'microsoft-365': 'Microsoft 365 Business',
      'bigquery': 'Google BigQuery',
      'onedrive': 'OneDrive Business',
      
      // Database Connectors
      'postgresql': 'PostgreSQL Database',
      'mysql': 'MySQL Database',
      'snowflake': 'Snowflake Data Cloud',
      'redshift': 'Amazon Redshift',
      
      // E-commerce
      'magento': 'Magento Commerce',
      'woocommerce': 'WooCommerce Store',
      'prestashop': 'PrestaShop',
      
      // Marketing & Social
      'facebook': 'Facebook Business',
      'instagram': 'Instagram Business',
      'linkedin': 'LinkedIn Company',
      'twitter': 'Twitter Business',
      'tiktok': 'TikTok for Business',
      'mailchimp': 'Mailchimp Marketing',
      
      // CRM & Sales
      'hubspot': 'HubSpot CRM',
      'salesforce': 'Salesforce Enterprise',
      
      // Communication
      'slack': 'Slack Workspace',
      'discord': 'Discord Server',
      'zoom': 'Zoom Pro',
      'whatsapp': 'WhatsApp Business',
      
      // File Storage
      'dropbox': 'Dropbox Business',
      'box': 'Box Enterprise',
      
      // HR & Recruiting
      'bamboohr': 'BambooHR',
      'greenhouse': 'Greenhouse Recruiting',
      'lever': 'Lever Recruiting',
      
      // Developer Tools
      'github': 'GitHub Organization',
      'gitlab': 'GitLab',
      'bitbucket': 'Bitbucket',
      
      // Survey & Forms
      'typeform': 'Typeform',
      'surveymonkey': 'SurveyMonkey',
      'airtable': 'Airtable Base',
      
      // Support
      'zendesk': 'Zendesk Support',
      'calendly': 'Calendly Scheduling',
      
      // Project Management
      'asana': 'Asana Projects',
      'trello': 'Trello Boards',
      'monday': 'Monday.com',
      'notion': 'Notion Team',
      'jira': 'Jira Software',
      
      // Enterprise ERP
      'netsuite': 'NetSuite ERP',
      'sap': 'SAP Business One',
      'oracle': 'Oracle Cloud',
      'workday': 'Workday HCM',
      
      // Restaurant/Food Service
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