// Simple OAuth Manager implementation for demo purposes
class OAuthManager {
  private configs: Map<string, any> = new Map()
  
  registerProvider(config: any) {
    this.configs.set(config.provider, config)
  }
  
  getAuthorizationUrl(provider: string, sessionId: string, baseUrl: string = 'http://localhost:3010'): string {
    const config = this.configs.get(provider)
    if (!config) throw new Error(`Provider ${provider} not configured`)
    
    // For demo purposes, if using demo credentials, redirect to a mock success page
    if (config.clientId.startsWith('demo_')) {
      return `${baseUrl}/api/oauth/${provider}/demo-success?session_id=${sessionId}&state=${sessionId}`
    }
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope?.join(' ') || '',
      state: sessionId,
      response_type: 'code'
    })
    
    return `${config.authorizationUrl}?${params.toString()}`
  }
  
  async exchangeCodeForToken(provider: string, code: string, state: string) {
    // Mock implementation for demo
    return {
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: new Date(Date.now() + 3600000),
      tokenType: 'Bearer',
      scope: 'read write'
    }
  }
}

// Initialize OAuth manager
export const oauthManager = new OAuthManager()

// Register all OAuth providers with their configurations
const providers = {
  quickbooks: {
    provider: 'quickbooks',
    clientId: process.env.QUICKBOOKS_CLIENT_ID || 'demo_quickbooks_client_id',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || 'demo_quickbooks_client_secret',
    authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/quickbooks/callback`,
    scope: ['com.intuit.quickbooks.accounting'],
    autoRefresh: true
  },
  square: {
    provider: 'square',
    clientId: process.env.SQUARE_CLIENT_ID || 'demo_square_client_id',
    clientSecret: process.env.SQUARE_CLIENT_SECRET || 'demo_square_client_secret',
    authorizationUrl: 'https://connect.squareup.com/oauth2/authorize',
    tokenUrl: 'https://connect.squareup.com/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/square/callback`,
    scope: ['MERCHANT_PROFILE_READ', 'PAYMENTS_READ', 'ITEMS_READ', 'ORDERS_READ'],
    autoRefresh: true
  },
  stripe: {
    provider: 'stripe',
    clientId: process.env.STRIPE_CLIENT_ID || 'demo_stripe_client_id',
    clientSecret: process.env.STRIPE_CLIENT_SECRET || 'demo_stripe_client_secret',
    authorizationUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/stripe/callback`,
    scope: ['read_write'],
    autoRefresh: false
  },
  shopify: {
    provider: 'shopify',
    clientId: process.env.SHOPIFY_CLIENT_ID || 'demo_shopify_client_id',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || 'demo_shopify_client_secret',
    authorizationUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/shopify/callback`,
    scope: ['read_products', 'read_orders', 'read_customers', 'read_inventory'],
    autoRefresh: false
  },
  hubspot: {
    provider: 'hubspot',
    clientId: process.env.HUBSPOT_CLIENT_ID || 'demo_hubspot_client_id',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || 'demo_hubspot_client_secret',
    authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/hubspot/callback`,
    scope: ['crm.objects.contacts.read', 'crm.objects.companies.read', 'crm.objects.deals.read'],
    autoRefresh: true
  },
  salesforce: {
    provider: 'salesforce',
    clientId: process.env.SALESFORCE_CLIENT_ID || 'demo_salesforce_client_id',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || 'demo_salesforce_client_secret',
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/salesforce/callback`,
    scope: ['api', 'refresh_token'],
    autoRefresh: true
  },
  xero: {
    provider: 'xero',
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    authorizationUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/xero/callback`,
    scope: ['accounting.transactions.read', 'accounting.contacts.read', 'accounting.settings.read'],
    autoRefresh: true
  },
  'google-workspace': {
    provider: 'google-workspace',
    clientId: process.env.GOOGLE_CLIENT_ID || 'demo_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo_google_client_secret',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/google-workspace/callback`,
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.file'
    ],
    autoRefresh: true
  },
  'microsoft-365': {
    provider: 'microsoft-365',
    clientId: process.env.MICROSOFT_CLIENT_ID || 'demo_microsoft_client_id',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'demo_microsoft_client_secret',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/microsoft-365/callback`,
    scope: ['User.Read', 'Mail.Read', 'Calendars.Read'],
    autoRefresh: true
  },
  slack: {
    provider: 'slack',
    clientId: process.env.SLACK_CLIENT_ID!,
    clientSecret: process.env.SLACK_CLIENT_SECRET!,
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/slack/callback`,
    scope: ['channels:read', 'chat:write', 'users:read'],
    autoRefresh: false
  },
  twilio: {
    provider: 'twilio',
    clientId: process.env.TWILIO_ACCOUNT_SID!,
    clientSecret: process.env.TWILIO_AUTH_TOKEN!,
    authorizationUrl: '', // Twilio uses API keys, not OAuth
    tokenUrl: '',
    redirectUri: '',
    scope: [],
    autoRefresh: false
  },
  mailchimp: {
    provider: 'mailchimp',
    clientId: process.env.MAILCHIMP_CLIENT_ID!,
    clientSecret: process.env.MAILCHIMP_CLIENT_SECRET!,
    authorizationUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/mailchimp/callback`,
    scope: [],
    autoRefresh: true
  },
  zendesk: {
    provider: 'zendesk',
    clientId: process.env.ZENDESK_CLIENT_ID!,
    clientSecret: process.env.ZENDESK_CLIENT_SECRET!,
    authorizationUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
    tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/zendesk/callback`,
    scope: ['read', 'write'],
    autoRefresh: true
  },
  calendly: {
    provider: 'calendly',
    clientId: process.env.CALENDLY_CLIENT_ID || 'demo_calendly_client_id',
    clientSecret: process.env.CALENDLY_CLIENT_SECRET || 'demo_calendly_client_secret',
    authorizationUrl: 'https://auth.calendly.com/oauth/authorize',
    tokenUrl: 'https://auth.calendly.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/calendly/callback`,
    scope: ['user:read', 'event_types:read'],
    autoRefresh: true
  },
  canva: {
    provider: 'canva',
    clientId: process.env.CANVA_CLIENT_ID || 'demo_canva_client_id',
    clientSecret: process.env.CANVA_CLIENT_SECRET || 'demo_canva_client_secret',
    authorizationUrl: 'https://www.canva.com/api/oauth/authorize',
    tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/canva/callback`,
    scope: ['design:read', 'design:write'],
    autoRefresh: true
  },
  zoom: {
    provider: 'zoom',
    clientId: process.env.ZOOM_CLIENT_ID || 'demo_zoom_client_id',
    clientSecret: process.env.ZOOM_CLIENT_SECRET || 'demo_zoom_client_secret',
    authorizationUrl: 'https://zoom.us/oauth/authorize',
    tokenUrl: 'https://zoom.us/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/zoom/callback`,
    scope: ['user:read', 'meeting:read'],
    autoRefresh: true
  },
  // Restaurant/Food Service Providers
  doordash: {
    provider: 'doordash',
    clientId: process.env.DOORDASH_CLIENT_ID || 'demo_doordash_client_id',
    clientSecret: process.env.DOORDASH_CLIENT_SECRET || 'demo_doordash_client_secret',
    authorizationUrl: 'https://identity.doordash.com/connect/authorize',
    tokenUrl: 'https://identity.doordash.com/connect/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/doordash/callback`,
    scope: ['merchant:read', 'delivery:read'],
    autoRefresh: true
  },
  'uber-eats': {
    provider: 'uber-eats',
    clientId: process.env.UBER_EATS_CLIENT_ID || 'demo_uber_eats_client_id',
    clientSecret: process.env.UBER_EATS_CLIENT_SECRET || 'demo_uber_eats_client_secret',
    authorizationUrl: 'https://login.uber.com/oauth/v2/authorize',
    tokenUrl: 'https://login.uber.com/oauth/v2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/uber-eats/callback`,
    scope: ['eats.store', 'eats.orders'],
    autoRefresh: true
  },
  opentable: {
    provider: 'opentable',
    clientId: process.env.OPENTABLE_CLIENT_ID || 'demo_opentable_client_id',
    clientSecret: process.env.OPENTABLE_CLIENT_SECRET || 'demo_opentable_client_secret',
    authorizationUrl: 'https://oauth.opentable.com/api/v1/oauth2/authorize',
    tokenUrl: 'https://oauth.opentable.com/api/v1/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/opentable/callback`,
    scope: ['reservations:read', 'restaurants:read'],
    autoRefresh: true
  },
  resy: {
    provider: 'resy',
    clientId: process.env.RESY_CLIENT_ID || 'demo_resy_client_id',
    clientSecret: process.env.RESY_CLIENT_SECRET || 'demo_resy_client_secret',
    authorizationUrl: 'https://api.resy.com/oauth/authorize',
    tokenUrl: 'https://api.resy.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/resy/callback`,
    scope: ['reservations:read', 'venues:read'],
    autoRefresh: true
  },
  toast: {
    provider: 'toast',
    clientId: process.env.TOAST_CLIENT_ID || 'demo_toast_client_id',
    clientSecret: process.env.TOAST_CLIENT_SECRET || 'demo_toast_client_secret',
    authorizationUrl: 'https://ws-api.toasttab.com/oauth2/authorize',
    tokenUrl: 'https://ws-api.toasttab.com/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/toast/callback`,
    scope: ['pos:read', 'orders:read'],
    autoRefresh: true
  },
  restaurant365: {
    provider: 'restaurant365',
    clientId: process.env.RESTAURANT365_CLIENT_ID || 'demo_restaurant365_client_id',
    clientSecret: process.env.RESTAURANT365_CLIENT_SECRET || 'demo_restaurant365_client_secret',
    authorizationUrl: 'https://api.restaurant365.com/oauth/authorize',
    tokenUrl: 'https://api.restaurant365.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/restaurant365/callback`,
    scope: ['accounting:read', 'inventory:read'],
    autoRefresh: true
  },
  // Enterprise ERP Systems
  netsuite: {
    provider: 'netsuite',
    clientId: process.env.NETSUITE_CLIENT_ID || 'demo_netsuite_client_id',
    clientSecret: process.env.NETSUITE_CLIENT_SECRET || 'demo_netsuite_client_secret',
    authorizationUrl: 'https://system.netsuite.com/pages/customerlogin.jsp',
    tokenUrl: 'https://system.netsuite.com/rest/roles',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/netsuite/callback`,
    scope: ['rest_webservices', 'restlets'],
    autoRefresh: true
  },
  sap: {
    provider: 'sap',
    clientId: process.env.SAP_CLIENT_ID || 'demo_sap_client_id',
    clientSecret: process.env.SAP_CLIENT_SECRET || 'demo_sap_client_secret',
    authorizationUrl: 'https://api.sap.com/oauth/authorize',
    tokenUrl: 'https://api.sap.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/sap/callback`,
    scope: ['finance:read', 'hr:read'],
    autoRefresh: true
  },
  oracle: {
    provider: 'oracle',
    clientId: process.env.ORACLE_CLIENT_ID || 'demo_oracle_client_id',
    clientSecret: process.env.ORACLE_CLIENT_SECRET || 'demo_oracle_client_secret',
    authorizationUrl: 'https://idcs-oda.identity.oraclecloud.com/oauth2/v1/authorize',
    tokenUrl: 'https://idcs-oda.identity.oraclecloud.com/oauth2/v1/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/oracle/callback`,
    scope: ['urn:opc:idm:__myscopes__'],
    autoRefresh: true
  },
  workday: {
    provider: 'workday',
    clientId: process.env.WORKDAY_CLIENT_ID || 'demo_workday_client_id',
    clientSecret: process.env.WORKDAY_CLIENT_SECRET || 'demo_workday_client_secret',
    authorizationUrl: 'https://wd5-impl-services1.workday.com/ccx/oauth2/token',
    tokenUrl: 'https://wd5-impl-services1.workday.com/ccx/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/workday/callback`,
    scope: ['system'],
    autoRefresh: true
  },
  // Additional Common Business Tools
  asana: {
    provider: 'asana',
    clientId: process.env.ASANA_CLIENT_ID || 'demo_asana_client_id',
    clientSecret: process.env.ASANA_CLIENT_SECRET || 'demo_asana_client_secret',
    authorizationUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/asana/callback`,
    scope: ['default'],
    autoRefresh: true
  },
  trello: {
    provider: 'trello',
    clientId: process.env.TRELLO_CLIENT_ID || 'demo_trello_client_id',
    clientSecret: process.env.TRELLO_CLIENT_SECRET || 'demo_trello_client_secret',
    authorizationUrl: 'https://trello.com/1/authorize',
    tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/trello/callback`,
    scope: ['read', 'write'],
    autoRefresh: true
  },
  monday: {
    provider: 'monday',
    clientId: process.env.MONDAY_CLIENT_ID || 'demo_monday_client_id',
    clientSecret: process.env.MONDAY_CLIENT_SECRET || 'demo_monday_client_secret',
    authorizationUrl: 'https://auth.monday.com/oauth2/authorize',
    tokenUrl: 'https://auth.monday.com/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/monday/callback`,
    scope: ['boards:read', 'boards:write'],
    autoRefresh: true
  },
  notion: {
    provider: 'notion',
    clientId: process.env.NOTION_CLIENT_ID || 'demo_notion_client_id',
    clientSecret: process.env.NOTION_CLIENT_SECRET || 'demo_notion_client_secret',
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/notion/callback`,
    scope: ['read', 'update'],
    autoRefresh: true
  },
  jira: {
    provider: 'jira',
    clientId: process.env.JIRA_CLIENT_ID || 'demo_jira_client_id',
    clientSecret: process.env.JIRA_CLIENT_SECRET || 'demo_jira_client_secret',
    authorizationUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/jira/callback`,
    scope: ['read:jira-work', 'read:jira-user'],
    autoRefresh: true
  }
}

// Register all providers
Object.values(providers).forEach(config => {
  if (config.clientId && config.clientSecret) {
    oauthManager.registerProvider(config)
  }
})

// Helper to check which providers are configured
export function getConfiguredProviders(): string[] {
  return Object.entries(providers)
    .filter(([_, config]) => config.clientId && config.clientSecret)
    .map(([provider]) => provider)
}

// Helper to get provider display names
export const providerDisplayNames: Record<string, string> = {
  quickbooks: 'QuickBooks',
  square: 'Square',
  stripe: 'Stripe',
  shopify: 'Shopify',
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  xero: 'Xero',
  'google-workspace': 'Google Workspace',
  'microsoft-365': 'Microsoft 365',
  slack: 'Slack',
  twilio: 'Twilio',
  mailchimp: 'Mailchimp',
  zendesk: 'Zendesk',
  calendly: 'Calendly',
  paypal: 'PayPal',
  woocommerce: 'WooCommerce',
  amazon: 'Amazon',
  intercom: 'Intercom',
  sendgrid: 'SendGrid',
  zoho: 'Zoho CRM',
  canva: 'Canva',
  zoom: 'Zoom',
  // Restaurant/Food Service
  doordash: 'DoorDash',
  'uber-eats': 'Uber Eats',
  opentable: 'OpenTable',
  resy: 'Resy',
  toast: 'Toast POS',
  restaurant365: 'Restaurant365',
  // Enterprise ERP
  netsuite: 'NetSuite ERP',
  sap: 'SAP',
  oracle: 'Oracle',
  workday: 'Workday',
  // Project Management
  asana: 'Asana',
  trello: 'Trello',
  monday: 'Monday.com',
  notion: 'Notion',
  jira: 'Jira'
}