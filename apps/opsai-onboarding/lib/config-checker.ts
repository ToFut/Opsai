// Configuration checker for external services
export const configChecker = {
  isAirbyteConfigured: () => {
    return !!(process.env.AIRBYTE_API_KEY && process.env.AIRBYTE_WORKSPACE_ID)
  },
  
  isOpenAIConfigured: () => {
    return !!process.env.OPENAI_API_KEY
  },
  
  isSupabaseConfigured: () => {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  },
  
  getOAuthProviders: () => {
    const providers = []
    if (process.env.GOOGLE_CLIENT_ID) providers.push('google-analytics')
    if (process.env.SHOPIFY_CLIENT_ID) providers.push('shopify')
    if (process.env.STRIPE_CLIENT_ID) providers.push('stripe')
    if (process.env.SALESFORCE_CLIENT_ID) providers.push('salesforce')
    if (process.env.HUBSPOT_CLIENT_ID) providers.push('hubspot')
    if (process.env.SLACK_CLIENT_ID) providers.push('slack')
    if (process.env.MAILCHIMP_CLIENT_ID) providers.push('mailchimp')
    if (process.env.QUICKBOOKS_CLIENT_ID) providers.push('quickbooks')
    return providers
  },
  
  getMissingConfig: () => {
    const missing = []
    if (!configChecker.isAirbyteConfigured()) {
      missing.push('Airbyte (AIRBYTE_API_KEY, AIRBYTE_WORKSPACE_ID)')
    }
    if (!configChecker.isOpenAIConfigured()) {
      missing.push('OpenAI (OPENAI_API_KEY)')
    }
    if (!configChecker.isSupabaseConfigured()) {
      missing.push('Supabase (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    }
    return missing
  }
}