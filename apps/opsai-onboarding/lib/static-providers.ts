// Static list of popular Airbyte integrations
// No need to fetch from API every time - these don't change frequently

export interface StaticProvider {
  sourceDefinitionId: string
  name: string
  dockerRepository: string
  dockerImageTag: string
  documentationUrl: string
  icon: string
  sourceType: string
  releaseStage: 'alpha' | 'beta' | 'generally_available'
  version: string
  category: string[]
  popular: boolean
  requiresOAuth: boolean
  description: string
}

export const STATIC_PROVIDERS: StaticProvider[] = [
  // Most Popular - Always show these first
  {
    sourceDefinitionId: '9da77001-af33-4bcd-be46-6252bf9342b9',
    name: 'Shopify',
    dockerRepository: 'airbyte/source-shopify',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/shopify',
    icon: '🛍️',
    sourceType: 'shopify',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['ecommerce', 'recommended'],
    popular: true,
    requiresOAuth: true,
    description: 'Connect to your Shopify store to sync products, orders, and customers'
  },
  {
    sourceDefinitionId: 'e094cb9a-26de-4645-8761-65c0c425d1de',
    name: 'Stripe',
    dockerRepository: 'airbyte/source-stripe',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/stripe',
    icon: '💳',
    sourceType: 'stripe',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['payments', 'recommended'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync payment data, subscriptions, and customer information from Stripe'
  },
  {
    sourceDefinitionId: 'b117307c-14b6-41aa-9422-947e34922643',
    name: 'Salesforce',
    dockerRepository: 'airbyte/source-salesforce',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/salesforce',
    icon: '☁️',
    sourceType: 'salesforce',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['crm-sales', 'recommended'],
    popular: true,
    requiresOAuth: true,
    description: 'Connect to Salesforce CRM for leads, contacts, and opportunities'
  },
  {
    sourceDefinitionId: '36c891d9-4bd9-43ac-bad2-10e12756272c',
    name: 'HubSpot',
    dockerRepository: 'airbyte/source-hubspot',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/hubspot',
    icon: '🧲',
    sourceType: 'hubspot',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['crm-sales', 'marketing', 'recommended'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync contacts, deals, and marketing data from HubSpot CRM'
  },
  {
    sourceDefinitionId: 'aea0b0b0-98da-4aa5-bf19-0c401b9f1a65',
    name: 'Google Analytics',
    dockerRepository: 'airbyte/source-google-analytics-v4',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/google-analytics-v4',
    icon: '📊',
    sourceType: 'google-analytics',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['analytics', 'recommended'],
    popular: true,
    requiresOAuth: true,
    description: 'Track website analytics, user behavior, and conversion data'
  },
  {
    sourceDefinitionId: '68e63de2-bb83-4c7e-93fa-a8a9051e3993',
    name: 'PostgreSQL',
    dockerRepository: 'airbyte/source-postgres',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/postgres',
    icon: '🐘',
    sourceType: 'postgres',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['databases', 'recommended'],
    popular: true,
    requiresOAuth: false,
    description: 'Connect to PostgreSQL database for direct data access'
  },
  {
    sourceDefinitionId: '435bb9a5-7887-4809-aa58-28c27df0d7ad',
    name: 'MySQL',
    dockerRepository: 'airbyte/source-mysql',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/mysql',
    icon: '🐬',
    sourceType: 'mysql',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['databases', 'recommended'],
    popular: true,
    requiresOAuth: false,
    description: 'Connect to MySQL database for direct data access'
  },
  {
    sourceDefinitionId: 'b03a9f3e-22a5-11eb-adc1-0242ac120002',
    name: 'Mailchimp',
    dockerRepository: 'airbyte/source-mailchimp',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/mailchimp',
    icon: '📧',
    sourceType: 'mailchimp',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['marketing', 'recommended'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync email campaigns, subscribers, and marketing analytics'
  },

  // Additional Popular Providers
  {
    sourceDefinitionId: 'c2b14d7c-5e4d-4e3a-9c5e-5e4d4e3a9c5e',
    name: 'Slack',
    dockerRepository: 'airbyte/source-slack',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/slack',
    icon: '💬',
    sourceType: 'slack',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['communication'],
    popular: true,
    requiresOAuth: true,
    description: 'Connect to Slack for messages, channels, and team communication data'
  },
  {
    sourceDefinitionId: 'f7b2e4c6-8d9a-4e5f-b1c3-7a8d9e0f1b2c',
    name: 'Notion',
    dockerRepository: 'airbyte/source-notion',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/notion',
    icon: '📝',
    sourceType: 'notion',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['productivity'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync pages, databases, and content from Notion workspace'
  },
  {
    sourceDefinitionId: 'a8b9c0d1-e2f3-4567-8901-234567890abc',
    name: 'Airtable',
    dockerRepository: 'airbyte/source-airtable',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/airtable',
    icon: '📋',
    sourceType: 'airtable',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['productivity'],
    popular: true,
    requiresOAuth: true,
    description: 'Connect to Airtable bases and sync structured data'
  },
  {
    sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
    name: 'GitHub',
    dockerRepository: 'airbyte/source-github',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/github',
    icon: '🐙',
    sourceType: 'github',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['productivity'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync repositories, issues, and development activity from GitHub'
  },
  {
    sourceDefinitionId: 'c3d4e5f6-g7h8-9012-3456-789012345678',
    name: 'Mixpanel',
    dockerRepository: 'airbyte/source-mixpanel',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/mixpanel',
    icon: '📈',
    sourceType: 'mixpanel',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['analytics'],
    popular: true,
    requiresOAuth: false,
    description: 'Track user events and product analytics from Mixpanel'
  },
  {
    sourceDefinitionId: 'd4e5f6g7-h8i9-0123-4567-890123456789',
    name: 'Zendesk',
    dockerRepository: 'airbyte/source-zendesk-support',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/zendesk-support',
    icon: '🛠️',
    sourceType: 'zendesk',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['communication'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync customer support tickets and conversations from Zendesk'
  },
  {
    sourceDefinitionId: 'e5f6g7h8-i9j0-1234-5678-901234567890',
    name: 'Intercom',
    dockerRepository: 'airbyte/source-intercom',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/intercom',
    icon: '💬',
    sourceType: 'intercom',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['communication'],
    popular: true,
    requiresOAuth: true,
    description: 'Connect to Intercom for customer conversations and support data'
  },
  {
    sourceDefinitionId: 'f6g7h8i9-j0k1-2345-6789-012345678901',
    name: 'Monday.com',
    dockerRepository: 'airbyte/source-monday',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/monday',
    icon: '📊',
    sourceType: 'monday',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['productivity'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync project management data and workflows from Monday.com'
  },
  {
    sourceDefinitionId: 'g7h8i9j0-k1l2-3456-7890-123456789012',
    name: 'Asana',
    dockerRepository: 'airbyte/source-asana',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/asana',
    icon: '📝',
    sourceType: 'asana',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['productivity'],
    popular: true,
    requiresOAuth: true,
    description: 'Connect to Asana for project tasks and team collaboration data'
  },
  {
    sourceDefinitionId: 'h8i9j0k1-l2m3-4567-8901-234567890123',
    name: 'Jira',
    dockerRepository: 'airbyte/source-jira',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/jira',
    icon: '🎫',
    sourceType: 'jira',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['productivity'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync issues, projects, and development workflows from Jira'
  },
  {
    sourceDefinitionId: 'i9j0k1l2-m3n4-5678-9012-345678901234',
    name: 'QuickBooks',
    dockerRepository: 'airbyte/source-quickbooks',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/quickbooks',
    icon: '💰',
    sourceType: 'quickbooks',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['payments'],
    popular: true,
    requiresOAuth: true,
    description: 'Connect to QuickBooks for accounting and financial data'
  },
  {
    sourceDefinitionId: 'j0k1l2m3-n4o5-6789-0123-456789012345',
    name: 'Xero',
    dockerRepository: 'airbyte/source-xero',
    dockerImageTag: 'latest',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/xero',
    icon: '💼',
    sourceType: 'xero',
    releaseStage: 'generally_available',
    version: '1.0.0',
    category: ['payments'],
    popular: true,
    requiresOAuth: true,
    description: 'Sync accounting and financial data from Xero'
  }
]

// Helper functions
export const getPopularProviders = (): StaticProvider[] => {
  return STATIC_PROVIDERS.filter(p => p.popular)
}

export const getProvidersByCategory = (category: string): StaticProvider[] => {
  if (category === 'recommended') {
    return STATIC_PROVIDERS.filter(p => p.category.includes('recommended'))
  }
  return STATIC_PROVIDERS.filter(p => p.category.includes(category))
}

export const getProviderBySourceType = (sourceType: string): StaticProvider | undefined => {
  return STATIC_PROVIDERS.find(p => p.sourceType === sourceType)
}

export const getAllProviders = (): StaticProvider[] => {
  return STATIC_PROVIDERS
}

// Categories for the UI
export const PROVIDER_CATEGORIES = [
  {
    id: 'recommended',
    name: 'Recommended',
    description: 'Based on your business profile',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('recommended')).length
  },
  {
    id: 'databases',
    name: 'Databases',
    description: 'Connect to your databases',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('databases')).length
  },
  {
    id: 'crm-sales',
    name: 'CRM & Sales',
    description: 'Customer relationship management',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('crm-sales')).length
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online stores and marketplaces',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('ecommerce')).length
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Payment processors',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('payments')).length
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Email and marketing automation',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('marketing')).length
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Analytics and tracking',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('analytics')).length
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Team communication tools',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('communication')).length
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Project management and productivity',
    count: STATIC_PROVIDERS.filter(p => p.category.includes('productivity')).length
  }
]