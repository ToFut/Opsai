'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, ExternalLink, AlertCircle, Loader2, ArrowRight, ChevronRight } from 'lucide-react'

interface Provider {
  id: string
  name: string
  icon: string
  description: string
  scopes?: string[]
  priority: 'critical' | 'recommended' | 'optional'
}

interface OAuthStatus {
  connected: boolean
  accountName?: string
  connecting: boolean
  error?: string
}

interface OAuthCollectionProps {
  detectedProviders: string[]
  onComplete: (connectedProviders: Array<{ provider: string; accountName?: string }>) => void
  onSkip: () => void
  sessionId: string
}

const providers: Record<string, Provider> = {
  // Core Business & Finance
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    description: 'E-commerce store data, products, orders, customers',
    scopes: ['read_products', 'read_orders', 'read_customers'],
    priority: 'critical'
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    description: 'Payment processing, transactions, customer billing',
    scopes: ['read_charges', 'read_customers', 'read_invoices'],
    priority: 'critical'
  },
  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    icon: '💰',
    description: 'Accounting data, expenses, invoicing, financial reports',
    scopes: ['com.intuit.quickbooks.accounting'],
    priority: 'critical'
  },
  square: {
    id: 'square',
    name: 'Square',
    icon: '⬜',
    description: 'Point of sale, inventory, customer data',
    scopes: ['merchant_profile_read', 'payments_read'],
    priority: 'critical'
  },
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    icon: '💰',
    description: 'Payment processing and financial transactions',
    scopes: ['openid'],
    priority: 'recommended'
  },
  
  // Security & Compliance
  'nudge-security': {
    id: 'nudge-security',
    name: 'Nudge Security',
    icon: '🛡️',
    description: 'Security monitoring, app discovery, compliance tracking',
    scopes: ['read:apps', 'read:users', 'read:security'],
    priority: 'recommended'
  },
  okta: {
    id: 'okta',
    name: 'Okta',
    icon: '🔐',
    description: 'Identity management, user authentication, SSO',
    scopes: ['openid', 'profile', 'email'],
    priority: 'recommended'
  },
  auth0: {
    id: 'auth0',
    name: 'Auth0',
    icon: '🔑',
    description: 'Authentication, user management, identity services',
    scopes: ['openid', 'profile', 'email'],
    priority: 'recommended'
  },
  
  // Google & Microsoft Ecosystem
  'google-workspace': {
    id: 'google-workspace',
    name: 'Google Workspace',
    icon: '📊',
    description: 'Gmail, Calendar, Drive, Docs, Sheets integration',
    scopes: ['userinfo.email', 'calendar', 'drive.file'],
    priority: 'recommended'
  },
  'microsoft-365': {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    icon: '📄',
    description: 'Outlook, Teams, SharePoint, OneDrive integration',
    scopes: ['User.Read', 'Mail.Read', 'Calendars.Read'],
    priority: 'recommended'
  },
  bigquery: {
    id: 'bigquery',
    name: 'Google BigQuery',
    icon: '📊',
    description: 'Data warehouse, analytics, business intelligence',
    scopes: ['bigquery'],
    priority: 'optional'
  },
  
  // Database Connectors (Airbyte Supported)
  postgresql: {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: '🐘',
    description: 'PostgreSQL database connection and data sync',
    scopes: ['read', 'write'],
    priority: 'optional'
  },
  mysql: {
    id: 'mysql',
    name: 'MySQL',
    icon: '🐬',
    description: 'MySQL database connection and data sync',
    scopes: ['read', 'write'],
    priority: 'optional'
  },
  snowflake: {
    id: 'snowflake',
    name: 'Snowflake',
    icon: '❄️',
    description: 'Data warehouse, analytics, cloud database',
    scopes: ['refresh_token', 'session:role:accountadmin'],
    priority: 'optional'
  },
  redshift: {
    id: 'redshift',
    name: 'Amazon Redshift',
    icon: '📊',
    description: 'Amazon data warehouse, analytics, reporting',
    scopes: ['read', 'write'],
    priority: 'optional'
  },
  
  // E-commerce Platforms
  magento: {
    id: 'magento',
    name: 'Magento',
    icon: '🛒',
    description: 'E-commerce platform, product catalog, orders',
    scopes: ['admin'],
    priority: 'critical'
  },
  woocommerce: {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: '🛍️',
    description: 'WordPress e-commerce, products, orders, customers',
    scopes: ['read_write'],
    priority: 'critical'
  },
  prestashop: {
    id: 'prestashop',
    name: 'PrestaShop',
    icon: '🛒',
    description: 'E-commerce platform, inventory, customer data',
    scopes: ['read', 'write'],
    priority: 'optional'
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    icon: '📦',
    description: 'Amazon marketplace, orders, inventory',
    scopes: ['profile'],
    priority: 'recommended'
  },
  
  // Marketing & Social Media
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    description: 'Facebook Ads, pages, business management',
    scopes: ['ads_read', 'business_management', 'pages_read_engagement'],
    priority: 'recommended'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    description: 'Instagram posts, stories, audience insights',
    scopes: ['user_profile', 'user_media'],
    priority: 'recommended'
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'Professional network, company pages, ads',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    priority: 'recommended'
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    description: 'Tweets, followers, engagement analytics',
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    priority: 'recommended'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    description: 'TikTok videos, analytics, advertising',
    scopes: ['user.info.basic', 'video.list'],
    priority: 'optional'
  },
  mailchimp: {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: '📧',
    description: 'Email marketing, subscriber lists, campaigns',
    scopes: ['read_campaigns', 'read_lists', 'read_reports'],
    priority: 'recommended'
  },
  
  // CRM & Sales
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🎯',
    description: 'CRM, contacts, deals, marketing automation',
    scopes: ['contacts', 'content', 'reports'],
    priority: 'critical'
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '☁️',
    description: 'CRM, sales pipeline, customer management',
    scopes: ['api', 'refresh_token'],
    priority: 'critical'
  },
  
  // Communication Tools
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Team communication, channels, message data',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    priority: 'recommended'
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    description: 'Community management, server analytics',
    scopes: ['identify', 'guilds'],
    priority: 'optional'
  },
  zoom: {
    id: 'zoom',
    name: 'Zoom',
    icon: '📹',
    description: 'Video meetings, webinars, usage analytics',
    scopes: ['user:read', 'meeting:read'],
    priority: 'recommended'
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: '📱',
    description: 'Business messaging, customer communications',
    scopes: ['whatsapp_business_messaging'],
    priority: 'optional'
  },
  
  // File Storage & Cloud
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    icon: '📁',
    description: 'File storage, document management, sharing',
    scopes: ['files.metadata.read', 'files.content.read'],
    priority: 'optional'
  },
  box: {
    id: 'box',
    name: 'Box',
    icon: '📦',
    description: 'Enterprise file storage and collaboration',
    scopes: ['root_readwrite'],
    priority: 'optional'
  },
  onedrive: {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '☁️',
    description: 'Microsoft cloud storage and file sync',
    scopes: ['Files.ReadWrite'],
    priority: 'optional'
  },
  
  // HR & Recruiting
  bamboohr: {
    id: 'bamboohr',
    name: 'BambooHR',
    icon: '🎋',
    description: 'Human resources, employee data, time tracking',
    scopes: ['read', 'write'],
    priority: 'optional'
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Greenhouse',
    icon: '🌱',
    description: 'Recruiting, candidate management, hiring',
    scopes: ['candidates.read', 'jobs.read'],
    priority: 'optional'
  },
  lever: {
    id: 'lever',
    name: 'Lever',
    icon: '⚖️',
    description: 'Recruiting platform, candidate tracking',
    scopes: ['candidates:read', 'postings:read'],
    priority: 'optional'
  },
  
  // Developer Tools
  github: {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Code repositories, issues, pull requests',
    scopes: ['repo', 'user'],
    priority: 'optional'
  },
  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    description: 'Code repositories, CI/CD, project management',
    scopes: ['read_repository', 'read_user'],
    priority: 'optional'
  },
  bitbucket: {
    id: 'bitbucket',
    name: 'Bitbucket',
    icon: '🪣',
    description: 'Code repositories, pipelines, deployments',
    scopes: ['repositories'],
    priority: 'optional'
  },
  
  // Survey & Forms
  typeform: {
    id: 'typeform',
    name: 'Typeform',
    icon: '📝',
    description: 'Forms, surveys, customer feedback',
    scopes: ['forms:read', 'responses:read'],
    priority: 'optional'
  },
  surveymonkey: {
    id: 'surveymonkey',
    name: 'SurveyMonkey',
    icon: '🐵',
    description: 'Surveys, market research, analytics',
    scopes: ['surveys_read', 'responses_read'],
    priority: 'optional'
  },
  airtable: {
    id: 'airtable',
    name: 'Airtable',
    icon: '📊',
    description: 'Database, spreadsheets, project management',
    scopes: ['data.records:read', 'data.records:write'],
    priority: 'optional'
  },
  
  // Support & Customer Service
  zendesk: {
    id: 'zendesk',
    name: 'Zendesk',
    icon: '🎫',
    description: 'Customer support, ticketing, help desk',
    scopes: ['read', 'write'],
    priority: 'recommended'
  },
  calendly: {
    id: 'calendly',
    name: 'Calendly',
    icon: '📅',
    description: 'Meeting scheduling, calendar integration',
    scopes: ['user:read', 'event_types:read'],
    priority: 'optional'
  },
  
  // Project Management
  asana: {
    id: 'asana',
    name: 'Asana',
    icon: '✅',
    description: 'Project management, tasks, team collaboration',
    scopes: ['default'],
    priority: 'recommended'
  },
  trello: {
    id: 'trello',
    name: 'Trello',
    icon: '📋',
    description: 'Kanban boards, project organization',
    scopes: ['read', 'write'],
    priority: 'recommended'
  },
  monday: {
    id: 'monday',
    name: 'Monday.com',
    icon: '📈',
    description: 'Work management, team collaboration',
    scopes: ['boards:read', 'boards:write'],
    priority: 'recommended'
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    icon: '📓',
    description: 'Notes, databases, knowledge management',
    scopes: ['read', 'update'],
    priority: 'recommended'
  },
  jira: {
    id: 'jira',
    name: 'Jira',
    icon: '🔧',
    description: 'Issue tracking, agile project management',
    scopes: ['read:jira-work', 'read:jira-user'],
    priority: 'recommended'
  },
  
  // Enterprise ERP
  netsuite: {
    id: 'netsuite',
    name: 'NetSuite ERP',
    icon: '🏢',
    description: 'Enterprise resource planning, financials',
    scopes: ['rest_webservices', 'restlets'],
    priority: 'optional'
  },
  sap: {
    id: 'sap',
    name: 'SAP',
    icon: '🏭',
    description: 'Enterprise software, business processes',
    scopes: ['finance:read', 'hr:read'],
    priority: 'optional'
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    icon: '🔮',
    description: 'Enterprise database and applications',
    scopes: ['urn:opc:idm:__myscopes__'],
    priority: 'optional'
  },
  workday: {
    id: 'workday',
    name: 'Workday',
    icon: '💼',
    description: 'Human capital management, financials',
    scopes: ['system'],
    priority: 'optional'
  }
}

export default function OAuthCollection({ 
  detectedProviders, 
  onComplete, 
  onSkip, 
  sessionId 
}: OAuthCollectionProps) {
  const [statuses, setStatuses] = useState<Record<string, OAuthStatus>>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize statuses for detected providers
  useEffect(() => {
    const initialStatus: Record<string, OAuthStatus> = {}
    detectedProviders.forEach(providerId => {
      initialStatus[providerId] = {
        connected: false,
        connecting: false
      }
    })
    setStatuses(initialStatus)
    setIsInitialized(true)
  }, [detectedProviders])

  // Listen for OAuth completion messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'OAUTH_SUCCESS') {
        setStatuses(prev => ({
          ...prev,
          [event.data.provider]: {
            connected: true,
            connecting: false,
            accountName: event.data.accountName
          }
        }))
      } else if (event.data.type === 'OAUTH_ERROR') {
        setStatuses(prev => ({
          ...prev,
          [event.data.provider]: {
            connected: false,
            connecting: false,
            error: event.data.error
          }
        }))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const connectProvider = async (providerId: string) => {
    setStatuses(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId], connecting: true, error: undefined }
    }))

    try {
      // Open OAuth popup
      const popup = window.open(
        `/api/oauth/${providerId}/connect?session_id=${sessionId}`,
        'oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }

      // Monitor popup closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          // Check if still connecting (means popup was closed without success)
          setTimeout(() => {
            setStatuses(prev => {
              if (prev[providerId]?.connecting) {
                return {
                  ...prev,
                  [providerId]: {
                    ...prev[providerId],
                    connecting: false,
                    error: 'Connection cancelled'
                  }
                }
              }
              return prev
            })
          }, 1000)
        }
      }, 1000)

    } catch (error) {
      setStatuses(prev => ({
        ...prev,
        [providerId]: {
          ...prev[providerId],
          connecting: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }))
    }
  }

  const getConnectedProviders = () => {
    return Object.entries(statuses)
      .filter(([_, status]) => status.connected)
      .map(([provider, status]) => ({ 
        provider, 
        accountName: status.accountName 
      }))
  }

  const connectedCount = getConnectedProviders().length
  const totalProviders = detectedProviders.length
  const criticalProviders = detectedProviders.filter(id => providers[id]?.priority === 'critical')
  const connectedCritical = criticalProviders.filter(id => statuses[id]?.connected).length

  // Group providers by priority
  const groupedProviders = {
    critical: detectedProviders.filter(id => providers[id]?.priority === 'critical'),
    recommended: detectedProviders.filter(id => providers[id]?.priority === 'recommended'),
    optional: detectedProviders.filter(id => providers[id]?.priority === 'optional')
  }

  const handleContinue = () => {
    onComplete(getConnectedProviders())
  }

  const handleSkip = () => {
    onSkip()
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Preparing OAuth connections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl mb-6">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect Your Services
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We've detected the systems your business uses. Connect them to enable real-time data sync 
            and unified management. Choose from 60+ supported integrations including all major Airbyte connectors.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-gray-900">
              Connection Progress
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {connectedCount}/{totalProviders}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${totalProviders > 0 ? (connectedCount / totalProviders) * 100 : 0}%` }}
            />
          </div>
          <div className="text-sm text-gray-600">
            {connectedCritical}/{criticalProviders.length} critical integrations connected
          </div>
        </div>

        {/* Featured Security Integration */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">🛡️</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Nudge Security Integration
                </h3>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Featured
                </span>
              </div>
              <p className="text-gray-600 mb-3">
                Discover shadow IT, monitor app usage, and maintain security compliance across your organization.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full border">App Discovery</span>
                <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full border">User Monitoring</span>
                <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full border">Compliance Tracking</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!detectedProviders.includes('nudge-security')) {
                detectedProviders.push('nudge-security')
                setStatuses(prev => ({
                  ...prev,
                  'nudge-security': {
                    connected: false,
                    connecting: false
                  }
                }))
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Nudge Security
          </button>
        </div>

        {/* Add More Providers Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add More Integrations
          </h3>
          <p className="text-gray-600 mb-4">
            Choose from our comprehensive library of 60+ integrations, including all major Airbyte-supported connectors, databases, marketing tools, and business applications.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(providers)
              .filter(([id]) => !detectedProviders.includes(id))
              .slice(0, 24) // Show first 24 additional providers
              .map(([providerId, provider]) => (
                <button
                  key={providerId}
                  onClick={() => {
                    // Add to detected providers if not already there
                    if (!detectedProviders.includes(providerId)) {
                      detectedProviders.push(providerId)
                      setStatuses(prev => ({
                        ...prev,
                        [providerId]: {
                          connected: false,
                          connecting: false
                        }
                      }))
                    }
                  }}
                  className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">{provider.icon}</div>
                  <div className="text-xs font-medium text-gray-700 truncate w-full">
                    {provider.name}
                  </div>
                </button>
              ))}
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                // Add all remaining providers
                const allProviderIds = Object.keys(providers)
                const newProviders = allProviderIds.filter(id => !detectedProviders.includes(id))
                detectedProviders.push(...newProviders)
                
                const newStatuses: Record<string, OAuthStatus> = {}
                newProviders.forEach(id => {
                  newStatuses[id] = {
                    connected: false,
                    connecting: false
                  }
                })
                setStatuses(prev => ({ ...prev, ...newStatuses }))
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              + Show All {Object.keys(providers).length - detectedProviders.length} Available Integrations
            </button>
          </div>
        </div>

        {/* Critical Integrations */}
        {groupedProviders.critical.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
              Critical Integrations
            </h2>
            <p className="text-gray-600 mb-6">
              These are essential for your business operations. We recommend connecting all critical integrations.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {groupedProviders.critical.map(providerId => {
                const provider = providers[providerId]
                const status = statuses[providerId]
                if (!provider) return null

                return (
                  <div key={providerId} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="text-3xl mr-4">{provider.icon}</div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{provider.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                        </div>
                      </div>
                      {status?.connected && (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {status?.connected ? (
                          <div className="text-green-600 font-medium">
                            ✅ Connected {status.accountName && `• ${status.accountName}`}
                          </div>
                        ) : status?.error ? (
                          <div className="text-red-600 font-medium">
                            ❌ {status.error}
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            Ready to connect
                          </div>
                        )}
                      </div>
                      
                      {!status?.connected && (
                        <button
                          onClick={() => connectProvider(providerId)}
                          disabled={status?.connecting}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {status?.connecting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommended Integrations */}
        {groupedProviders.recommended.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
              Recommended Integrations
            </h2>
            <p className="text-gray-600 mb-6">
              These will enhance your platform with additional features and insights.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {groupedProviders.recommended.map(providerId => {
                const provider = providers[providerId]
                const status = statuses[providerId]
                if (!provider) return null

                return (
                  <div key={providerId} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-yellow-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="text-3xl mr-4">{provider.icon}</div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{provider.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                        </div>
                      </div>
                      {status?.connected && (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {status?.connected ? (
                          <div className="text-green-600 font-medium">
                            ✅ Connected {status.accountName && `• ${status.accountName}`}
                          </div>
                        ) : status?.error ? (
                          <div className="text-red-600 font-medium">
                            ❌ {status.error}
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            Optional enhancement
                          </div>
                        )}
                      </div>
                      
                      {!status?.connected && (
                        <button
                          onClick={() => connectProvider(providerId)}
                          disabled={status?.connecting}
                          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {status?.connecting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Continue?
              </h3>
              <p className="text-gray-600">
                {connectedCount > 0 
                  ? `Great! ${connectedCount} integration${connectedCount > 1 ? 's' : ''} connected. You can add more later.`
                  : 'You can connect integrations now or add them later from your dashboard.'
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSkip}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip for Now
              </button>
              
              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center"
              >
                Continue Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>

            {connectedCritical < criticalProviders.length && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-center text-yellow-800">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Consider connecting all critical integrations for the best experience
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}