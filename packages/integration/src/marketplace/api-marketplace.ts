export interface APIConnectorTemplate {
  id: string;
  name: string;
  provider: string;
  category: 'crm' | 'ecommerce' | 'hospitality' | 'finance' | 'marketing' | 'analytics' | 'communication';
  description: string;
  logo?: string;
  authentication: {
    type: 'api_key' | 'oauth2' | 'basic' | 'custom';
    oauth?: {
      authUrl: string;
      tokenUrl: string;
      scope: string[];
    };
  };
  baseUrl: string;
  documentation: string;
  features: string[];
  dataTypes: string[];
  syncFrequency?: string;
  setupTime?: string;
  pricing?: 'free' | 'freemium' | 'paid';
  quickSetup?: boolean;
}

export const API_MARKETPLACE: Record<string, APIConnectorTemplate> = {
  // Hospitality & Vacation Rentals
  GUESTY: {
    id: 'guesty',
    name: 'Guesty',
    provider: 'Guesty Inc.',
    category: 'hospitality',
    description: 'Property management platform for short-term rentals',
    authentication: {
      type: 'oauth2',
      oauth: {
        authUrl: 'https://login.guesty.com/oauth2/authorize',
        tokenUrl: 'https://login.guesty.com/oauth2/token',
        scope: ['open-api']
      }
    },
    baseUrl: 'https://open-api.guesty.com/v1',
    documentation: 'https://doc.guesty.com',
    features: ['Property sync', 'Reservation management', 'Guest communication', 'Pricing sync'],
    dataTypes: ['properties', 'reservations', 'guests', 'pricing', 'availability'],
    syncFrequency: 'Real-time webhooks + hourly sync',
    setupTime: '5 minutes',
    pricing: 'paid',
    quickSetup: true
  },

  AIRBNB: {
    id: 'airbnb',
    name: 'Airbnb',
    provider: 'Airbnb',
    category: 'hospitality',
    description: 'Global vacation rental marketplace',
    authentication: {
      type: 'oauth2',
      oauth: {
        authUrl: 'https://www.airbnb.com/oauth2/authorize',
        tokenUrl: 'https://api.airbnb.com/v2/oauth2/token',
        scope: ['listings:read', 'reservations:read', 'messages:read']
      }
    },
    baseUrl: 'https://api.airbnb.com/v2',
    documentation: 'https://developer.airbnb.com',
    features: ['Listing sync', 'Booking sync', 'Calendar sync', 'Messaging'],
    dataTypes: ['listings', 'reservations', 'calendar', 'messages', 'reviews'],
    syncFrequency: 'Webhooks + 6-hour sync',
    setupTime: '10 minutes',
    pricing: 'free',
    quickSetup: true
  },

  BOOKING_COM: {
    id: 'booking_com',
    name: 'Booking.com',
    provider: 'Booking.com',
    category: 'hospitality',
    description: 'Leading accommodation booking platform',
    authentication: {
      type: 'api_key'
    },
    baseUrl: 'https://api.booking.com/v3',
    documentation: 'https://developers.booking.com',
    features: ['Property management', 'Availability sync', 'Rate management', 'Reservations'],
    dataTypes: ['properties', 'availability', 'rates', 'reservations'],
    syncFrequency: 'Real-time',
    setupTime: '15 minutes',
    pricing: 'free'
  },

  // CRM Systems
  SALESFORCE: {
    id: 'salesforce',
    name: 'Salesforce',
    provider: 'Salesforce',
    category: 'crm',
    description: 'Leading CRM platform',
    authentication: {
      type: 'oauth2',
      oauth: {
        authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scope: ['api', 'refresh_token']
      }
    },
    baseUrl: 'https://yourinstance.salesforce.com',
    documentation: 'https://developer.salesforce.com',
    features: ['Contact sync', 'Lead management', 'Opportunity tracking', 'Custom objects'],
    dataTypes: ['contacts', 'leads', 'opportunities', 'accounts', 'custom_objects'],
    syncFrequency: 'Real-time streaming API',
    setupTime: '20 minutes',
    pricing: 'paid',
    quickSetup: true
  },

  HUBSPOT: {
    id: 'hubspot',
    name: 'HubSpot',
    provider: 'HubSpot',
    category: 'crm',
    description: 'Inbound marketing and CRM platform',
    authentication: {
      type: 'oauth2',
      oauth: {
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        scope: ['contacts', 'forms', 'tickets']
      }
    },
    baseUrl: 'https://api.hubapi.com',
    documentation: 'https://developers.hubspot.com',
    features: ['Contact management', 'Form submissions', 'Email tracking', 'Analytics'],
    dataTypes: ['contacts', 'companies', 'deals', 'tickets', 'forms'],
    syncFrequency: 'Webhooks + hourly sync',
    setupTime: '10 minutes',
    pricing: 'freemium',
    quickSetup: true
  },

  // E-commerce
  SHOPIFY: {
    id: 'shopify',
    name: 'Shopify',
    provider: 'Shopify',
    category: 'ecommerce',
    description: 'E-commerce platform',
    authentication: {
      type: 'oauth2',
      oauth: {
        authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
        tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
        scope: ['read_products', 'read_orders', 'read_customers']
      }
    },
    baseUrl: 'https://{shop}.myshopify.com/admin/api/2024-01',
    documentation: 'https://shopify.dev',
    features: ['Product catalog', 'Order management', 'Customer data', 'Inventory'],
    dataTypes: ['products', 'orders', 'customers', 'inventory', 'collections'],
    syncFrequency: 'Webhooks + 30-min sync',
    setupTime: '15 minutes',
    pricing: 'paid',
    quickSetup: true
  },

  STRIPE: {
    id: 'stripe',
    name: 'Stripe',
    provider: 'Stripe',
    category: 'finance',
    description: 'Payment processing platform',
    authentication: {
      type: 'api_key'
    },
    baseUrl: 'https://api.stripe.com/v1',
    documentation: 'https://stripe.com/docs/api',
    features: ['Payment processing', 'Subscription management', 'Invoice generation', 'Reporting'],
    dataTypes: ['payments', 'customers', 'subscriptions', 'invoices', 'products'],
    syncFrequency: 'Real-time webhooks',
    setupTime: '5 minutes',
    pricing: 'paid',
    quickSetup: true
  },

  // Communication
  TWILIO: {
    id: 'twilio',
    name: 'Twilio',
    provider: 'Twilio',
    category: 'communication',
    description: 'Cloud communications platform',
    authentication: {
      type: 'basic'
    },
    baseUrl: 'https://api.twilio.com/2010-04-01',
    documentation: 'https://www.twilio.com/docs',
    features: ['SMS messaging', 'Voice calls', 'WhatsApp', 'Email'],
    dataTypes: ['messages', 'calls', 'conversations', 'phone_numbers'],
    syncFrequency: 'Real-time webhooks',
    setupTime: '10 minutes',
    pricing: 'paid',
    quickSetup: true
  },

  SENDGRID: {
    id: 'sendgrid',
    name: 'SendGrid',
    provider: 'Twilio SendGrid',
    category: 'communication',
    description: 'Email delivery platform',
    authentication: {
      type: 'api_key'
    },
    baseUrl: 'https://api.sendgrid.com/v3',
    documentation: 'https://docs.sendgrid.com',
    features: ['Email sending', 'Templates', 'Analytics', 'Webhooks'],
    dataTypes: ['emails', 'templates', 'contacts', 'statistics'],
    syncFrequency: 'Real-time events',
    setupTime: '5 minutes',
    pricing: 'freemium',
    quickSetup: true
  },

  // Analytics
  GOOGLE_ANALYTICS: {
    id: 'google_analytics',
    name: 'Google Analytics',
    provider: 'Google',
    category: 'analytics',
    description: 'Web analytics service',
    authentication: {
      type: 'oauth2',
      oauth: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: ['https://www.googleapis.com/auth/analytics.readonly']
      }
    },
    baseUrl: 'https://analyticsreporting.googleapis.com/v4',
    documentation: 'https://developers.google.com/analytics',
    features: ['Traffic analytics', 'User behavior', 'Conversion tracking', 'Custom reports'],
    dataTypes: ['sessions', 'users', 'pageviews', 'events', 'conversions'],
    syncFrequency: 'Daily batch',
    setupTime: '20 minutes',
    pricing: 'free',
    quickSetup: false
  }
};

export class APIMarketplace {
  // Get all connectors
  static getAllConnectors(): APIConnectorTemplate[] {
    return Object.values(API_MARKETPLACE);
  }

  // Get connectors by category
  static getByCategory(category: APIConnectorTemplate['category']): APIConnectorTemplate[] {
    return Object.values(API_MARKETPLACE).filter(api => api.category === category);
  }

  // Search connectors
  static search(query: string): APIConnectorTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(API_MARKETPLACE).filter(api => 
      api.name.toLowerCase().includes(lowerQuery) ||
      api.description.toLowerCase().includes(lowerQuery) ||
      api.features.some(f => f.toLowerCase().includes(lowerQuery)) ||
      api.dataTypes.some(d => d.toLowerCase().includes(lowerQuery))
    );
  }

  // Get quick setup connectors
  static getQuickSetupConnectors(): APIConnectorTemplate[] {
    return Object.values(API_MARKETPLACE).filter(api => api.quickSetup);
  }

  // Generate integration config from template
  static generateIntegrationConfig(connectorId: string): any {
    const template = API_MARKETPLACE[connectorId];
    if (!template) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return {
      name: template.id,
      type: 'rest',
      provider: template.id,
      baseUrl: template.baseUrl,
      authentication: template.authentication,
      endpoints: this.generateDefaultEndpoints(template),
      transformations: this.generateDefaultTransformations(template),
      features: template.features,
      documentation: template.documentation
    };
  }

  // Generate default endpoints based on data types
  private static generateDefaultEndpoints(template: APIConnectorTemplate): any[] {
    const endpoints = [];
    
    for (const dataType of template.dataTypes) {
      endpoints.push({
        name: `get_${dataType}`,
        path: `/${dataType}`,
        method: 'GET',
        description: `Fetch ${dataType} from ${template.name}`
      });
      
      endpoints.push({
        name: `create_${dataType.slice(0, -1)}`,
        path: `/${dataType}`,
        method: 'POST',
        description: `Create new ${dataType.slice(0, -1)} in ${template.name}`
      });
    }

    return endpoints;
  }

  // Generate default transformations
  private static generateDefaultTransformations(template: APIConnectorTemplate): any[] {
    return template.dataTypes.map(dataType => ({
      name: `transform_${dataType}`,
      type: 'field_mapping',
      description: `Transform ${template.name} ${dataType} to internal schema`
    }));
  }

  // One-click setup helper
  static async oneClickSetup(connectorId: string, credentials: any): Promise<{
    success: boolean;
    connectionId?: string;
    error?: string;
  }> {
    try {
      const template = API_MARKETPLACE[connectorId];
      if (!template) {
        throw new Error(`Connector not found: ${connectorId}`);
      }

      // This would integrate with the credential manager and Airbyte
      console.log(`🚀 Setting up ${template.name} with one-click setup...`);
      
      // Steps:
      // 1. Store credentials securely
      // 2. Create Airbyte source
      // 3. Create Airbyte destination
      // 4. Create connection
      // 5. Start initial sync

      return {
        success: true,
        connectionId: `${connectorId}_${Date.now()}`
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}