import { NextRequest, NextResponse } from 'next/server'

// This endpoint initiates OAuth flow for any provider
export async function POST(request: NextRequest) {
  try {
    const { provider, tenantId, shopDomain } = await request.json()

    if (!provider || !tenantId) {
      return NextResponse.json({ error: 'Provider and tenant ID required' }, { status: 400 })
    }

    // Build OAuth URL based on provider
    const authUrls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth`,
      salesforce: `https://login.salesforce.com/services/oauth2/authorize`,
      shopify: `https://${shopDomain || 'shop'}.myshopify.com/admin/oauth/authorize`,
      stripe: `https://connect.stripe.com/oauth/authorize`,
      quickbooks: `https://appcenter.intuit.com/connect/oauth2`,
      hubspot: `https://app.hubspot.com/oauth/authorize`,
      slack: `https://slack.com/oauth/v2/authorize`,
      github: `https://github.com/login/oauth/authorize`,
      notion: `https://api.notion.com/v1/oauth/authorize`,
      zoom: `https://zoom.us/oauth/authorize`,
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`,
      xero: `https://login.xero.com/identity/connect/authorize`,
      square: `https://connect.squareup.com/oauth2/authorize`,
      paypal: `https://www.paypal.com/connect`,
      mailchimp: `https://login.mailchimp.com/oauth2/authorize`
    }

    const authUrl = authUrls[provider]
    if (!authUrl) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
    }

    // Generate state for security
    const state = Buffer.from(JSON.stringify({
      tenantId,
      provider,
      timestamp: Date.now()
    })).toString('base64')

    // Provider-specific scopes
    const scopes: Record<string, string[]> = {
      google: ['email', 'profile', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/drive.readonly'],
      salesforce: ['api', 'refresh_token', 'offline_access'],
      shopify: ['read_products', 'read_orders', 'read_customers', 'read_inventory', 'read_analytics'],
      stripe: ['read_write'],
      quickbooks: ['com.intuit.quickbooks.accounting', 'com.intuit.quickbooks.payment'],
      hubspot: ['crm.objects.contacts.read', 'crm.objects.companies.read', 'forms', 'timeline'],
      slack: ['channels:read', 'chat:write', 'users:read', 'team:read'],
      github: ['repo', 'user', 'read:org'],
      notion: ['read_content', 'read_user'],
      zoom: ['user:read', 'meeting:read', 'recording:read'],
      microsoft: ['User.Read', 'Calendars.Read', 'Mail.Read', 'Files.Read'],
      xero: ['accounting.transactions.read', 'accounting.contacts.read', 'accounting.settings.read'],
      square: ['MERCHANT_PROFILE_READ', 'PAYMENTS_READ', 'CUSTOMERS_READ', 'ITEMS_READ'],
      paypal: ['openid', 'email', 'https://uri.paypal.com/services/paypalattributes'],
      mailchimp: ['read']
    }

    // Build OAuth URL with parameters
    const params = new URLSearchParams({
      client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
      response_type: 'code',
      scope: (scopes[provider] || []).join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    })

    // Provider-specific parameters
    if (provider === 'shopify' && shopDomain) {
      params.set('shop', shopDomain)
    }

    return NextResponse.json({
      authUrl: `${authUrl}?${params.toString()}`,
      state
    })

  } catch (error) {
    console.error('OAuth initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize OAuth flow' },
      { status: 500 }
    )
  }
}