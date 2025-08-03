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
  },
  // Security & Compliance Tools
  'nudge-security': {
    provider: 'nudge-security',
    clientId: process.env.NUDGE_SECURITY_CLIENT_ID || 'demo_nudge_client_id',
    clientSecret: process.env.NUDGE_SECURITY_CLIENT_SECRET || 'demo_nudge_client_secret',
    authorizationUrl: 'https://api.nudgesecurity.com/oauth/authorize',
    tokenUrl: 'https://api.nudgesecurity.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/nudge-security/callback`,
    scope: ['read:apps', 'read:users', 'read:security'],
    autoRefresh: true
  },
  okta: {
    provider: 'okta',
    clientId: process.env.OKTA_CLIENT_ID || 'demo_okta_client_id',
    clientSecret: process.env.OKTA_CLIENT_SECRET || 'demo_okta_client_secret',
    authorizationUrl: 'https://your-domain.okta.com/oauth2/v1/authorize',
    tokenUrl: 'https://your-domain.okta.com/oauth2/v1/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/okta/callback`,
    scope: ['openid', 'profile', 'email'],
    autoRefresh: true
  },
  auth0: {
    provider: 'auth0',
    clientId: process.env.AUTH0_CLIENT_ID || 'demo_auth0_client_id',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || 'demo_auth0_client_secret',
    authorizationUrl: 'https://your-domain.auth0.com/authorize',
    tokenUrl: 'https://your-domain.auth0.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/auth0/callback`,
    scope: ['openid', 'profile', 'email'],
    autoRefresh: true
  },
  // Database Connectors (Airbyte Supported)
  postgresql: {
    provider: 'postgresql',
    clientId: process.env.POSTGRESQL_CLIENT_ID || 'demo_postgresql_client_id',
    clientSecret: process.env.POSTGRESQL_CLIENT_SECRET || 'demo_postgresql_client_secret',
    authorizationUrl: 'https://api.postgresql.com/oauth/authorize',
    tokenUrl: 'https://api.postgresql.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/postgresql/callback`,
    scope: ['read', 'write'],
    autoRefresh: true
  },
  mysql: {
    provider: 'mysql',
    clientId: process.env.MYSQL_CLIENT_ID || 'demo_mysql_client_id',
    clientSecret: process.env.MYSQL_CLIENT_SECRET || 'demo_mysql_client_secret',
    authorizationUrl: 'https://api.mysql.com/oauth/authorize',
    tokenUrl: 'https://api.mysql.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/mysql/callback`,
    scope: ['read', 'write'],
    autoRefresh: true
  },
  snowflake: {
    provider: 'snowflake',
    clientId: process.env.SNOWFLAKE_CLIENT_ID || 'demo_snowflake_client_id',
    clientSecret: process.env.SNOWFLAKE_CLIENT_SECRET || 'demo_snowflake_client_secret',
    authorizationUrl: 'https://account.snowflakecomputing.com/oauth/authorize',
    tokenUrl: 'https://account.snowflakecomputing.com/oauth/token-request',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/snowflake/callback`,
    scope: ['refresh_token', 'session:role:accountadmin'],
    autoRefresh: true
  },
  redshift: {
    provider: 'redshift',
    clientId: process.env.REDSHIFT_CLIENT_ID || 'demo_redshift_client_id',
    clientSecret: process.env.REDSHIFT_CLIENT_SECRET || 'demo_redshift_client_secret',
    authorizationUrl: 'https://redshift.amazonaws.com/oauth/authorize',
    tokenUrl: 'https://redshift.amazonaws.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/redshift/callback`,
    scope: ['read', 'write'],
    autoRefresh: true
  },
  bigquery: {
    provider: 'bigquery',
    clientId: process.env.BIGQUERY_CLIENT_ID || 'demo_bigquery_client_id',
    clientSecret: process.env.BIGQUERY_CLIENT_SECRET || 'demo_bigquery_client_secret',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/bigquery/callback`,
    scope: ['https://www.googleapis.com/auth/bigquery'],
    autoRefresh: true
  },
  // E-commerce Platforms
  magento: {
    provider: 'magento',
    clientId: process.env.MAGENTO_CLIENT_ID || 'demo_magento_client_id',
    clientSecret: process.env.MAGENTO_CLIENT_SECRET || 'demo_magento_client_secret',
    authorizationUrl: 'https://your-store.com/oauth/authorize',
    tokenUrl: 'https://your-store.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/magento/callback`,
    scope: ['admin'],
    autoRefresh: true
  },
  woocommerce: {
    provider: 'woocommerce',
    clientId: process.env.WOOCOMMERCE_CLIENT_ID || 'demo_woocommerce_client_id',
    clientSecret: process.env.WOOCOMMERCE_CLIENT_SECRET || 'demo_woocommerce_client_secret',
    authorizationUrl: 'https://your-store.com/wc-auth/v1/authorize',
    tokenUrl: 'https://your-store.com/wc-auth/v1/access_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/woocommerce/callback`,
    scope: ['read_write'],
    autoRefresh: true
  },
  prestashop: {
    provider: 'prestashop',
    clientId: process.env.PRESTASHOP_CLIENT_ID || 'demo_prestashop_client_id',
    clientSecret: process.env.PRESTASHOP_CLIENT_SECRET || 'demo_prestashop_client_secret',
    authorizationUrl: 'https://your-store.com/oauth/authorize',
    tokenUrl: 'https://your-store.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/prestashop/callback`,
    scope: ['read', 'write'],
    autoRefresh: true
  },
  // Marketing & Analytics
  facebook: {
    provider: 'facebook',
    clientId: process.env.FACEBOOK_CLIENT_ID || 'demo_facebook_client_id',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'demo_facebook_client_secret',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/facebook/callback`,
    scope: ['ads_read', 'business_management', 'pages_read_engagement'],
    autoRefresh: true
  },
  instagram: {
    provider: 'instagram',
    clientId: process.env.INSTAGRAM_CLIENT_ID || 'demo_instagram_client_id',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || 'demo_instagram_client_secret',
    authorizationUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/instagram/callback`,
    scope: ['user_profile', 'user_media'],
    autoRefresh: true
  },
  linkedin: {
    provider: 'linkedin',
    clientId: process.env.LINKEDIN_CLIENT_ID || 'demo_linkedin_client_id',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'demo_linkedin_client_secret',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/linkedin/callback`,
    scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    autoRefresh: true
  },
  twitter: {
    provider: 'twitter',
    clientId: process.env.TWITTER_CLIENT_ID || 'demo_twitter_client_id',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || 'demo_twitter_client_secret',
    authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/twitter/callback`,
    scope: ['tweet.read', 'users.read', 'offline.access'],
    autoRefresh: true
  },
  tiktok: {
    provider: 'tiktok',
    clientId: process.env.TIKTOK_CLIENT_ID || 'demo_tiktok_client_id',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || 'demo_tiktok_client_secret',
    authorizationUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/tiktok/callback`,
    scope: ['user.info.basic', 'video.list'],
    autoRefresh: true
  },
  // Communication Tools
  discord: {
    provider: 'discord',
    clientId: process.env.DISCORD_CLIENT_ID || 'demo_discord_client_id',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || 'demo_discord_client_secret',
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/discord/callback`,
    scope: ['identify', 'guilds'],
    autoRefresh: true
  },
  telegram: {
    provider: 'telegram',
    clientId: process.env.TELEGRAM_CLIENT_ID || 'demo_telegram_client_id',
    clientSecret: process.env.TELEGRAM_CLIENT_SECRET || 'demo_telegram_client_secret',
    authorizationUrl: 'https://oauth.telegram.org/auth',
    tokenUrl: 'https://oauth.telegram.org/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/telegram/callback`,
    scope: ['bot'],
    autoRefresh: true
  },
  whatsapp: {
    provider: 'whatsapp',
    clientId: process.env.WHATSAPP_CLIENT_ID || 'demo_whatsapp_client_id',
    clientSecret: process.env.WHATSAPP_CLIENT_SECRET || 'demo_whatsapp_client_secret',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/whatsapp/callback`,
    scope: ['whatsapp_business_messaging'],
    autoRefresh: true
  },
  // File Storage & Cloud Services
  dropbox: {
    provider: 'dropbox',
    clientId: process.env.DROPBOX_CLIENT_ID || 'demo_dropbox_client_id',
    clientSecret: process.env.DROPBOX_CLIENT_SECRET || 'demo_dropbox_client_secret',
    authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/dropbox/callback`,
    scope: ['files.metadata.read', 'files.content.read'],
    autoRefresh: true
  },
  box: {
    provider: 'box',
    clientId: process.env.BOX_CLIENT_ID || 'demo_box_client_id',
    clientSecret: process.env.BOX_CLIENT_SECRET || 'demo_box_client_secret',
    authorizationUrl: 'https://account.box.com/api/oauth2/authorize',
    tokenUrl: 'https://api.box.com/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/box/callback`,
    scope: ['root_readwrite'],
    autoRefresh: true
  },
  onedrive: {
    provider: 'onedrive',
    clientId: process.env.ONEDRIVE_CLIENT_ID || 'demo_onedrive_client_id',
    clientSecret: process.env.ONEDRIVE_CLIENT_SECRET || 'demo_onedrive_client_secret',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/onedrive/callback`,
    scope: ['Files.ReadWrite'],
    autoRefresh: true
  },
  // HR & Recruiting
  bamboohr: {
    provider: 'bamboohr',
    clientId: process.env.BAMBOOHR_CLIENT_ID || 'demo_bamboohr_client_id',
    clientSecret: process.env.BAMBOOHR_CLIENT_SECRET || 'demo_bamboohr_client_secret',
    authorizationUrl: 'https://api.bamboohr.com/api/gateway.php/your-domain/v1/oauth2/authorize',
    tokenUrl: 'https://api.bamboohr.com/api/gateway.php/your-domain/v1/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/bamboohr/callback`,
    scope: ['read', 'write'],
    autoRefresh: true
  },
  greenhouse: {
    provider: 'greenhouse',
    clientId: process.env.GREENHOUSE_CLIENT_ID || 'demo_greenhouse_client_id',
    clientSecret: process.env.GREENHOUSE_CLIENT_SECRET || 'demo_greenhouse_client_secret',
    authorizationUrl: 'https://app.greenhouse.io/oauth/authorize',
    tokenUrl: 'https://app.greenhouse.io/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/greenhouse/callback`,
    scope: ['candidates.read', 'jobs.read'],
    autoRefresh: true
  },
  lever: {
    provider: 'lever',
    clientId: process.env.LEVER_CLIENT_ID || 'demo_lever_client_id',
    clientSecret: process.env.LEVER_CLIENT_SECRET || 'demo_lever_client_secret',
    authorizationUrl: 'https://auth.lever.co/authorize',
    tokenUrl: 'https://auth.lever.co/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/lever/callback`,
    scope: ['candidates:read', 'postings:read'],
    autoRefresh: true
  },
  // Developer Tools
  github: {
    provider: 'github',
    clientId: process.env.GITHUB_CLIENT_ID || 'demo_github_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo_github_client_secret',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/github/callback`,
    scope: ['repo', 'user'],
    autoRefresh: false
  },
  gitlab: {
    provider: 'gitlab',
    clientId: process.env.GITLAB_CLIENT_ID || 'demo_gitlab_client_id',
    clientSecret: process.env.GITLAB_CLIENT_SECRET || 'demo_gitlab_client_secret',
    authorizationUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/gitlab/callback`,
    scope: ['read_repository', 'read_user'],
    autoRefresh: true
  },
  bitbucket: {
    provider: 'bitbucket',
    clientId: process.env.BITBUCKET_CLIENT_ID || 'demo_bitbucket_client_id',
    clientSecret: process.env.BITBUCKET_CLIENT_SECRET || 'demo_bitbucket_client_secret',
    authorizationUrl: 'https://bitbucket.org/site/oauth2/authorize',
    tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/bitbucket/callback`,
    scope: ['repositories'],
    autoRefresh: true
  },
  // E-commerce & Payment Additional
  amazon: {
    provider: 'amazon',
    clientId: process.env.AMAZON_CLIENT_ID || 'demo_amazon_client_id',
    clientSecret: process.env.AMAZON_CLIENT_SECRET || 'demo_amazon_client_secret',
    authorizationUrl: 'https://www.amazon.com/ap/oa',
    tokenUrl: 'https://api.amazon.com/auth/o2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/amazon/callback`,
    scope: ['profile'],
    autoRefresh: true
  },
  paypal: {
    provider: 'paypal',
    clientId: process.env.PAYPAL_CLIENT_ID || 'demo_paypal_client_id',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'demo_paypal_client_secret',
    authorizationUrl: 'https://www.paypal.com/signin/authorize',
    tokenUrl: 'https://api.paypal.com/v1/oauth2/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/paypal/callback`,
    scope: ['openid'],
    autoRefresh: true
  },
  klarna: {
    provider: 'klarna',
    clientId: process.env.KLARNA_CLIENT_ID || 'demo_klarna_client_id',
    clientSecret: process.env.KLARNA_CLIENT_SECRET || 'demo_klarna_client_secret',
    authorizationUrl: 'https://api.klarna.com/oauth/authorize',
    tokenUrl: 'https://api.klarna.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/klarna/callback`,
    scope: ['payments'],
    autoRefresh: true
  },
  // Additional Business Tools
  typeform: {
    provider: 'typeform',
    clientId: process.env.TYPEFORM_CLIENT_ID || 'demo_typeform_client_id',
    clientSecret: process.env.TYPEFORM_CLIENT_SECRET || 'demo_typeform_client_secret',
    authorizationUrl: 'https://api.typeform.com/oauth/authorize',
    tokenUrl: 'https://api.typeform.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/typeform/callback`,
    scope: ['forms:read', 'responses:read'],
    autoRefresh: true
  },
  surveymonkey: {
    provider: 'surveymonkey',
    clientId: process.env.SURVEYMONKEY_CLIENT_ID || 'demo_surveymonkey_client_id',
    clientSecret: process.env.SURVEYMONKEY_CLIENT_SECRET || 'demo_surveymonkey_client_secret',
    authorizationUrl: 'https://api.surveymonkey.com/oauth/authorize',
    tokenUrl: 'https://api.surveymonkey.com/oauth/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/surveymonkey/callback`,
    scope: ['surveys_read', 'responses_read'],
    autoRefresh: true
  },
  airtable: {
    provider: 'airtable',
    clientId: process.env.AIRTABLE_CLIENT_ID || 'demo_airtable_client_id',
    clientSecret: process.env.AIRTABLE_CLIENT_SECRET || 'demo_airtable_client_secret',
    authorizationUrl: 'https://airtable.com/oauth2/v1/authorize',
    tokenUrl: 'https://airtable.com/oauth2/v1/token',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/oauth/airtable/callback`,
    scope: ['data.records:read', 'data.records:write'],
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
  // Core Business & Finance
  quickbooks: 'QuickBooks',
  square: 'Square',
  stripe: 'Stripe',
  shopify: 'Shopify',
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  xero: 'Xero',
  paypal: 'PayPal',
  klarna: 'Klarna',
  amazon: 'Amazon',

  // Security & Compliance
  'nudge-security': 'Nudge Security',
  okta: 'Okta',
  auth0: 'Auth0',

  // Google & Microsoft Ecosystem
  'google-workspace': 'Google Workspace',
  'microsoft-365': 'Microsoft 365',
  bigquery: 'Google BigQuery',
  onedrive: 'OneDrive',

  // Database Connectors (Airbyte Supported)
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  snowflake: 'Snowflake',
  redshift: 'Amazon Redshift',

  // E-commerce Platforms
  magento: 'Magento',
  woocommerce: 'WooCommerce',
  prestashop: 'PrestaShop',

  // Marketing & Social Media
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
  mailchimp: 'Mailchimp',

  // Communication Tools
  slack: 'Slack',
  discord: 'Discord',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp Business',
  twilio: 'Twilio',
  zoom: 'Zoom',

  // File Storage & Cloud
  dropbox: 'Dropbox',
  box: 'Box',

  // HR & Recruiting
  bamboohr: 'BambooHR',
  greenhouse: 'Greenhouse',
  lever: 'Lever',

  // Developer Tools
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',

  // Survey & Forms
  typeform: 'Typeform',
  surveymonkey: 'SurveyMonkey',
  airtable: 'Airtable',

  // Support & Customer Service
  zendesk: 'Zendesk',
  calendly: 'Calendly',
  canva: 'Canva',

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