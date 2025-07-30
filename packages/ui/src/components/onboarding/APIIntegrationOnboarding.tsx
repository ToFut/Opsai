import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Filter,
  Star,
  Clock,
  Zap,
  Settings,
  Globe,
  Key,
  Shield,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface APIConnector {
  id: string;
  name: string;
  provider: string;
  category: 'crm' | 'ecommerce' | 'hospitality' | 'finance' | 'marketing' | 'analytics' | 'communication';
  description: string;
  logo?: string;
  authentication: {
    type: 'api_key' | 'oauth2' | 'basic' | 'custom';
  };
  features: string[];
  setupTime: string;
  pricing: 'free' | 'freemium' | 'paid';
  quickSetup: boolean;
  connected?: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

const APIIntegrationOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVertical, setSelectedVertical] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedConnectors, setSelectedConnectors] = useState<Set<string>>(new Set());
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connectedApis, setConnectedApis] = useState<Set<string>>(new Set());
  const [showOAuthModal, setShowOAuthModal] = useState<string | null>(null);
  const [oauthStep, setOAuthStep] = useState(1);
  
  // YAML Configuration State
  const [appConfig, setAppConfig] = useState({
    name: '',
    displayName: '',
    description: '',
    version: '1.0.0'
  });
  const [dataModels, setDataModels] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [generatedYAML, setGeneratedYAML] = useState('');
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'vertical',
      title: 'Choose Your Industry',
      description: 'Select your business vertical to get tailored API recommendations',
      completed: !!selectedVertical,
      current: currentStep === 0
    },
    {
      id: 'schema',
      title: 'Design Your Schema',
      description: 'Define your data models and business entities',
      completed: false,
      current: currentStep === 1
    },
    {
      id: 'browse',
      title: 'Browse APIs',
      description: 'Discover and select APIs that fit your business needs',
      completed: selectedConnectors.size > 0,
      current: currentStep === 2
    },
    {
      id: 'workflows',
      title: 'Build Workflows',
      description: 'Create automated business processes',
      completed: false,
      current: currentStep === 3
    },
    {
      id: 'generate',
      title: 'Generate Application',
      description: 'Create your YAML config and generate the SaaS application',
      completed: false,
      current: currentStep === 4
    },
    {
      id: 'connect',
      title: 'Connect APIs',
      description: 'Authenticate and configure your live integrations',
      completed: connectedApis.size > 0,
      current: currentStep === 5
    },
    {
      id: 'complete',
      title: 'Complete Setup',
      description: 'Review your integrations and start using your vertical SaaS',
      completed: false,
      current: currentStep === 6
    }
  ];

  // Mock API connectors (in production, this would come from the API marketplace)
  const mockConnectors: APIConnector[] = [
    {
      id: 'guesty',
      name: 'Guesty',
      provider: 'Guesty Inc.',
      category: 'hospitality',
      description: 'Property management for vacation rentals',
      authentication: { type: 'oauth2' },
      features: ['Property sync', 'Reservations', 'Guest messaging'],
      setupTime: '5 minutes',
      pricing: 'paid',
      quickSetup: true
    },
    {
      id: 'airbnb',
      name: 'Airbnb',
      provider: 'Airbnb',
      category: 'hospitality',
      description: 'Global vacation rental marketplace',
      authentication: { type: 'oauth2' },
      features: ['Listing sync', 'Booking sync', 'Calendar management'],
      setupTime: '10 minutes',
      pricing: 'free',
      quickSetup: true
    },
    {
      id: 'stripe',
      name: 'Stripe',
      provider: 'Stripe',
      category: 'finance',
      description: 'Payment processing platform',
      authentication: { type: 'api_key' },
      features: ['Payment processing', 'Subscriptions', 'Invoicing'],
      setupTime: '5 minutes',
      pricing: 'paid',
      quickSetup: true
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      provider: 'Salesforce',
      category: 'crm',
      description: 'Leading CRM platform',
      authentication: { type: 'oauth2' },
      features: ['Contact management', 'Lead tracking', 'Sales pipeline'],
      setupTime: '20 minutes',
      pricing: 'paid',
      quickSetup: false
    },
    {
      id: 'shopify',
      name: 'Shopify',
      provider: 'Shopify',
      category: 'ecommerce',
      description: 'E-commerce platform',
      authentication: { type: 'oauth2' },
      features: ['Product catalog', 'Order management', 'Inventory'],
      setupTime: '15 minutes',
      pricing: 'paid',
      quickSetup: true
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      provider: 'HubSpot',
      category: 'crm',
      description: 'Inbound marketing and CRM',
      authentication: { type: 'oauth2' },
      features: ['Contact management', 'Email marketing', 'Analytics'],
      setupTime: '10 minutes',
      pricing: 'freemium',
      quickSetup: true
    }
  ];

  const verticals = [
    { id: 'vacation-rental', name: 'Vacation Rental', icon: '🏠', apis: ['guesty', 'airbnb', 'stripe'] },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛒', apis: ['shopify', 'stripe', 'salesforce'] },
    { id: 'saas', name: 'SaaS Business', icon: '💼', apis: ['hubspot', 'stripe', 'salesforce'] },
    { id: 'restaurant', name: 'Restaurant', icon: '🍕', apis: ['stripe', 'shopify'] },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', apis: ['salesforce', 'hubspot'] },
    { id: 'custom', name: 'Custom Setup', icon: '⚙️', apis: [] }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', count: mockConnectors.length },
    { id: 'hospitality', name: 'Hospitality', count: 2 },
    { id: 'crm', name: 'CRM', count: 2 },
    { id: 'ecommerce', name: 'E-commerce', count: 1 },
    { id: 'finance', name: 'Finance', count: 1 }
  ];

  const getFilteredConnectors = () => {
    let filtered = mockConnectors;

    // Filter by vertical
    if (selectedVertical && selectedVertical !== 'custom') {
      const vertical = verticals.find(v => v.id === selectedVertical);
      if (vertical?.apis.length) {
        filtered = filtered.filter(c => vertical.apis.includes(c.id));
      }
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.features.some(f => f.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const handleConnectorSelect = (connectorId: string) => {
    const newSelected = new Set(selectedConnectors);
    if (newSelected.has(connectorId)) {
      newSelected.delete(connectorId);
    } else {
      newSelected.add(connectorId);
    }
    setSelectedConnectors(newSelected);
  };

  const handleConnect = async (connectorId: string) => {
    const connector = mockConnectors.find(c => c.id === connectorId);
    if (!connector) return;

    setIsConnecting(connectorId);

    if (connector.authentication.type === 'oauth2') {
      setShowOAuthModal(connectorId);
      setOAuthStep(1);
    } else if (connector.authentication.type === 'api_key') {
      // Simulate API key setup
      setTimeout(() => {
        setConnectedApis(prev => new Set([...prev, connectorId]));
        setIsConnecting(null);
      }, 2000);
    }
  };

  const completeOAuth = () => {
    if (showOAuthModal) {
      setConnectedApis(prev => new Set([...prev, showOAuthModal]));
      setShowOAuthModal(null);
      setIsConnecting(null);
      setOAuthStep(1);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderVerticalSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Industry</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select your business vertical to get personalized API recommendations and pre-built integrations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verticals.map((vertical) => (
          <button
            key={vertical.id}
            onClick={() => setSelectedVertical(vertical.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
              selectedVertical === vertical.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-4xl mb-3">{vertical.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{vertical.name}</h3>
            <p className="text-sm text-gray-600">
              {vertical.apis.length > 0 
                ? `${vertical.apis.length} recommended APIs`
                : 'Build custom integrations'
              }
            </p>
          </button>
        ))}
      </div>

      {selectedVertical && (
        <div className="flex justify-end pt-4">
          <button
            onClick={nextStep}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );

  const renderAPIBrowser = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse API Integrations</h2>
        <p className="text-gray-600">
          Discover and select the APIs that best fit your {verticals.find(v => v.id === selectedVertical)?.name} business
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search APIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* API Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredConnectors().map((connector) => {
          const isSelected = selectedConnectors.has(connector.id);
          const isConnected = connectedApis.has(connector.id);
          const isConnecting = isConnecting === connector.id;
          
          return (
            <div
              key={connector.id}
              className={`border rounded-lg p-6 transition-all hover:shadow-md ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{connector.name}</h3>
                    <p className="text-sm text-gray-500">{connector.provider}</p>
                  </div>
                </div>
                {connector.quickSetup && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Quick Setup
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4">{connector.description}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Setup Time:</span>
                  <span className="font-medium">{connector.setupTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pricing:</span>
                  <span className={`font-medium capitalize ${
                    connector.pricing === 'free' ? 'text-green-600' : 
                    connector.pricing === 'freemium' ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {connector.pricing}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Auth Type:</span>
                  <span className="font-medium flex items-center">
                    <Key className="w-3 h-3 mr-1" />
                    {connector.authentication.type.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Features:</p>
                <div className="flex flex-wrap gap-1">
                  {connector.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                  {connector.features.length > 3 && (
                    <span className="text-xs text-gray-500">+{connector.features.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleConnectorSelect(connector.id)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
                {isConnected ? (
                  <button className="py-2 px-4 bg-green-600 text-white rounded-lg flex items-center">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(connector.id)}
                    disabled={isConnecting}
                    className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {getFilteredConnectors().length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No APIs found</h3>
          <p className="text-gray-500">Try adjusting your search or category filter</p>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        {selectedConnectors.size > 0 && (
          <button
            onClick={nextStep}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            Connect {selectedConnectors.size} API{selectedConnectors.size !== 1 ? 's' : ''}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  const renderConnectionStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect Your APIs</h2>
        <p className="text-gray-600">
          Authenticate with your selected services to enable data synchronization
        </p>
      </div>

      <div className="space-y-4">
        {Array.from(selectedConnectors).map(connectorId => {
          const connector = mockConnectors.find(c => c.id === connectorId);
          if (!connector) return null;

          const isConnected = connectedApis.has(connectorId);
          const isConnecting = isConnecting === connectorId;

          return (
            <div key={connectorId} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{connector.name}</h3>
                    <p className="text-sm text-gray-500">
                      {connector.authentication.type.toUpperCase()} Authentication
                    </p>
                  </div>
                </div>
                
                {isConnected ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Connected
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(connectorId)}
                    disabled={isConnecting}
                    className={`px-6 py-2 rounded-lg flex items-center ${
                      isConnecting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>

              {connector.authentication.type === 'oauth2' && !isConnected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="w-5 h-5 text-blue-600 mt-0.5">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">OAuth 2.0 Setup</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        You'll be redirected to {connector.name} to authorize access. We'll handle the rest automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {connector.authentication.type === 'api_key' && !isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="w-5 h-5 text-yellow-600 mt-0.5">
                      <Key className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-900">API Key Required</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        You'll need to provide your {connector.name} API key to enable this integration.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        {connectedApis.size > 0 && (
          <button
            onClick={nextStep}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            Complete Setup <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Setup Complete! 🎉</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your {verticals.find(v => v.id === selectedVertical)?.name} SaaS is now connected to {connectedApis.size} API{connectedApis.size !== 1 ? 's' : ''}. 
          Data synchronization will begin automatically.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Connected Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(connectedApis).map(connectorId => {
            const connector = mockConnectors.find(c => c.id === connectorId);
            if (!connector) return null;

            return (
              <div key={connectorId} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <Globe className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{connector.name}</p>
                  <p className="text-sm text-gray-500">Ready for sync</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <button className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium">
          Go to Dashboard
        </button>
        <button className="w-full border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 font-medium">
          Add More Integrations
        </button>
      </div>
    </div>
  );

  // OAuth Modal
  const renderOAuthModal = () => {
    if (!showOAuthModal) return null;
    
    const connector = mockConnectors.find(c => c.id === showOAuthModal);
    if (!connector) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Connect to {connector.name}</h3>
              <p className="text-gray-600 mt-2">
                You'll be redirected to {connector.name} to authorize access. Click continue when ready.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowOAuthModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={completeOAuth}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSchemaDesigner = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Design Your Data Schema</h2>
        <p className="text-gray-600">
          Define the data models and business entities for your {verticals.find(v => v.id === selectedVertical)?.name} application
        </p>
      </div>

      {/* Visual Schema Builder */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Data Models</h3>
          <button
            onClick={() => {
              const newField = {
                id: Date.now().toString(),
                name: 'new_field',
                type: 'string',
                required: false,
                description: ''
              };
              const newEntity = {
                id: Date.now().toString(),
                name: 'NewEntity',
                fields: [newField],
                relationships: []
              };
              setSchemaEntities(prev => [...prev, newEntity]);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entity
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {schemaEntities.map((entity, entityIndex) => (
            <div key={entity.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={entity.name}
                  onChange={(e) => {
                    const updated = [...schemaEntities];
                    updated[entityIndex].name = e.target.value;
                    setSchemaEntities(updated);
                  }}
                  className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                />
                <button
                  onClick={() => {
                    setSchemaEntities(prev => prev.filter(e => e.id !== entity.id));
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {entity.fields.map((field, fieldIndex) => (
                  <div key={field.id} className="flex items-center space-x-2 bg-white p-3 rounded border">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        const updated = [...schemaEntities];
                        updated[entityIndex].fields[fieldIndex].name = e.target.value;
                        setSchemaEntities(updated);
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="field_name"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const updated = [...schemaEntities];
                        updated[entityIndex].fields[fieldIndex].type = e.target.value;
                        setSchemaEntities(updated);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="text">Text</option>
                      <option value="json">JSON</option>
                    </select>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const updated = [...schemaEntities];
                          updated[entityIndex].fields[fieldIndex].required = e.target.checked;
                          setSchemaEntities(updated);
                        }}
                        className="mr-1"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => {
                        const updated = [...schemaEntities];
                        updated[entityIndex].fields = updated[entityIndex].fields.filter(f => f.id !== field.id);
                        setSchemaEntities(updated);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newField = {
                      id: Date.now().toString(),
                      name: 'new_field',
                      type: 'string',
                      required: false,
                      description: ''
                    };
                    const updated = [...schemaEntities];
                    updated[entityIndex].fields.push(newField);
                    setSchemaEntities(updated);
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </button>
              </div>
            </div>
          ))}

          {schemaEntities.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entities defined</h3>
              <p className="text-gray-500 mb-4">Add your first data entity to get started</p>
              <button
                onClick={() => {
                  const defaultEntity = {
                    id: Date.now().toString(),
                    name: selectedVertical === 'vacation-rental' ? 'Property' : 'Customer',
                    fields: [
                      { id: '1', name: 'id', type: 'string', required: true, description: 'Unique identifier' },
                      { id: '2', name: 'name', type: 'string', required: true, description: 'Display name' },
                      { id: '3', name: 'created_at', type: 'date', required: true, description: 'Creation timestamp' }
                    ],
                    relationships: []
                  };
                  setSchemaEntities([defaultEntity]);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Default Schema
              </button>
            </div>
          )}
        </div>
      </div>

      {/* App Configuration */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
            <input
              type="text"
              value={appConfig.name}
              onChange={(e) => setAppConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="my-vacation-rental"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={appConfig.displayName}
              onChange={(e) => setAppConfig(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Vacation Rental Platform"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={appConfig.description}
              onChange={(e) => setAppConfig(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Complete vacation rental management platform with property management, bookings, and guest services"
            />
          </div>
        </div>
      </div>

      {/* Data Models */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Data Models</h3>
          <button
            onClick={() => setDataModels(prev => [...prev, { 
              name: '', 
              displayName: '', 
              fields: [{ name: 'id', type: 'string', required: true }] 
            }])}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Add Model
          </button>
        </div>

        {dataModels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No data models yet. Add your first model to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dataModels.map((model, modelIndex) => (
              <div key={modelIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="text"
                      value={model.name}
                      onChange={(e) => {
                        const newModels = [...dataModels];
                        newModels[modelIndex].name = e.target.value;
                        setDataModels(newModels);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Model name (e.g., Property)"
                    />
                    <input
                      type="text"
                      value={model.displayName}
                      onChange={(e) => {
                        const newModels = [...dataModels];
                        newModels[modelIndex].displayName = e.target.value;
                        setDataModels(newModels);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Display name (e.g., Properties)"
                    />
                  </div>
                  <button
                    onClick={() => setDataModels(prev => prev.filter((_, i) => i !== modelIndex))}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Fields:</div>
                  {model.fields.map((field: any, fieldIndex: number) => (
                    <div key={fieldIndex} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => {
                          const newModels = [...dataModels];
                          newModels[modelIndex].fields[fieldIndex].name = e.target.value;
                          setDataModels(newModels);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Field name"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const newModels = [...dataModels];
                          newModels[modelIndex].fields[fieldIndex].type = e.target.value;
                          setDataModels(newModels);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="text">Text</option>
                        <option value="json">JSON</option>
                      </select>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const newModels = [...dataModels];
                            newModels[modelIndex].fields[fieldIndex].required = e.target.checked;
                            setDataModels(newModels);
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>
                      <button
                        onClick={() => {
                          const newModels = [...dataModels];
                          newModels[modelIndex].fields = newModels[modelIndex].fields.filter((_, i) => i !== fieldIndex);
                          setDataModels(newModels);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newModels = [...dataModels];
                      newModels[modelIndex].fields.push({ name: '', type: 'string', required: false });
                      setDataModels(newModels);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        {dataModels.length > 0 && appConfig.name && (
          <button
            onClick={nextStep}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  const renderWorkflowBuilder = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Build Workflows</h2>
        <p className="text-gray-600">
          Create automated business processes using visual workflow components. Drag and drop components to build your automation logic.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Component Palette */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Components</h3>
          <div className="space-y-2">
            {[
              { type: 'trigger', label: 'Trigger', icon: Play, color: 'bg-green-100 text-green-800', desc: 'Start workflow' },
              { type: 'api_call', label: 'API Call', icon: Globe, color: 'bg-blue-100 text-blue-800', desc: 'External request' },
              { type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-yellow-100 text-yellow-800', desc: 'If/else logic' },
              { type: 'transform', label: 'Transform', icon: RefreshCw, color: 'bg-purple-100 text-purple-800', desc: 'Modify data' },
              { type: 'email', label: 'Email', icon: Mail, color: 'bg-red-100 text-red-800', desc: 'Send notification' },
              { type: 'database', label: 'Database', icon: Database, color: 'bg-gray-100 text-gray-800', desc: 'Store/retrieve' },
              { type: 'webhook', label: 'Webhook', icon: Send, color: 'bg-indigo-100 text-indigo-800', desc: 'HTTP callback' }
            ].map((component) => {
              const IconComponent = component.icon;
              return (
                <div
                  key={component.type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('component-type', component.type)}
                  className={`p-3 rounded-lg cursor-grab border hover:shadow-md transition-all ${component.color}`}
                  title={component.desc}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">{component.label}</div>
                      <div className="text-xs opacity-75">{component.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="lg:col-span-3 bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Workflow Canvas</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setWorkflows(prev => [...prev, { 
                  id: Date.now().toString(),
                  name: 'New Workflow', 
                  description: 'Describe what this workflow does', 
                  trigger: { type: 'trigger', config: { event: 'api_call' } },
                  steps: []
                }])}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Workflow
              </button>
            </div>
          </div>

          {workflows.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
              <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
              <p className="text-gray-500 mb-4">Create your first workflow or choose from templates</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    const bookingWorkflow = {
                      id: Date.now().toString(),
                      name: 'Booking Confirmation',
                      description: 'Automated workflow for new booking confirmations',
                      trigger: { type: 'trigger', config: { event: 'new_booking' } },
                      steps: [
                        { id: '1', type: 'api_call', config: { name: 'Fetch guest data', endpoint: '/api/guests' } },
                        { id: '2', type: 'condition', config: { name: 'Check guest type', condition: 'guest.type === "VIP"' } },
                        { id: '3', type: 'email', config: { name: 'Send confirmation', template: 'booking_confirmation' } },
                        { id: '4', type: 'database', config: { name: 'Update status', action: 'UPDATE bookings SET status = "confirmed"' } }
                      ]
                    };
                    setWorkflows([bookingWorkflow]);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  🏨 Booking Template
                </button>
                <button
                  onClick={() => {
                    const customerWorkflow = {
                      id: Date.now().toString(),
                      name: 'Customer Onboarding',
                      description: 'Welcome new customers with automated setup',
                      trigger: { type: 'trigger', config: { event: 'user_signup' } },
                      steps: [
                        { id: '1', type: 'email', config: { name: 'Welcome email', template: 'welcome' } },
                        { id: '2', type: 'database', config: { name: 'Create profile', action: 'INSERT INTO profiles' } },
                        { id: '3', type: 'webhook', config: { name: 'Notify CRM', url: '/webhooks/new_customer' } }
                      ]
                    };
                    setWorkflows([customerWorkflow]);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  👤 Customer Template
                </button>
                <button
                  onClick={() => setWorkflows(prev => [...prev, { 
                    id: Date.now().toString(),
                    name: 'Custom Workflow', 
                    description: 'Build from scratch', 
                    trigger: { type: 'trigger', config: { event: 'manual' } },
                    steps: []
                  }])}
                  className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  ⚙️ Custom
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {workflows.map((workflow, workflowIndex) => (
                <div key={workflow.id || workflowIndex} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={workflow.name}
                        onChange={(e) => {
                          const newWorkflows = [...workflows];
                          newWorkflows[workflowIndex].name = e.target.value;
                          setWorkflows(newWorkflows);
                        }}
                        className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setWorkflows(prev => prev.filter((_, i) => i !== workflowIndex));
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={workflow.description}
                    onChange={(e) => {
                      const newWorkflows = [...workflows];
                      newWorkflows[workflowIndex].description = e.target.value;
                      setWorkflows(newWorkflows);
                    }}
                    className="w-full mb-4 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this workflow does..."
                  />

                  {/* Workflow Steps Visualization */}
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-700">Workflow Steps</div>
                      <div className="text-xs text-gray-500">{workflow.steps?.length || 0} steps</div>
                    </div>
                    
                    {workflow.steps && workflow.steps.length > 0 ? (
                      <div className="flex items-center space-x-2 overflow-x-auto">
                        {/* Trigger */}
                        <div className="flex-shrink-0 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
                          <Play className="w-4 h-4 inline mr-1" />
                          Trigger
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        
                        {/* Steps */}
                        {workflow.steps.map((step, stepIndex) => (
                          <div key={step.id} className="flex items-center space-x-2">
                            <div className="flex-shrink-0 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                              {step.type === 'api_call' && <Globe className="w-4 h-4 inline mr-1" />}
                              {step.type === 'email' && <Mail className="w-4 h-4 inline mr-1" />}
                              {step.type === 'database' && <Database className="w-4 h-4 inline mr-1" />}
                              {step.type === 'condition' && <GitBranch className="w-4 h-4 inline mr-1" />}
                              {step.type === 'webhook' && <Send className="w-4 h-4 inline mr-1" />}
                              {step.type === 'transform' && <RefreshCw className="w-4 h-4 inline mr-1" />}
                              {step.config?.name || step.type}
                            </div>
                            {stepIndex < workflow.steps.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500"
                        onDrop={(e) => {
                          e.preventDefault();
                          const componentType = e.dataTransfer.getData('component-type');
                          if (componentType) {
                            const newStep = {
                              id: Date.now().toString(),
                              type: componentType,
                              config: { name: `New ${componentType}` }
                            };
                            const newWorkflows = [...workflows];
                            if (!newWorkflows[workflowIndex].steps) {
                              newWorkflows[workflowIndex].steps = [];
                            }
                            newWorkflows[workflowIndex].steps.push(newStep);
                            setWorkflows(newWorkflows);
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <Play className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p>Drag components here to build your workflow</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const generateYAMLConfig = () => {
    const vertical = verticals.find(v => v.id === selectedVertical);
    const selectedConnectorsList = Array.from(selectedConnectors).map(id => 
      mockConnectors.find(c => c.id === id)
    ).filter(Boolean);

    const yamlConfig = {
      metadata: {
        version: '1.0',
        generated: new Date().toISOString(),
        generator: 'OPSAI Core Platform v2.1'
      },
      app: {
        name: appConfig.name || 'my-saas-app',  
        displayName: appConfig.displayName || 'My SaaS Application',
        description: appConfig.description || `Complete ${vertical?.name} management platform built with OPSAI`,
        version: appConfig.version || '1.0.0',
        vertical: selectedVertical,
        type: 'saas',
        framework: 'next-js',
        database: 'postgresql'
      },
      database: {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        name: appConfig.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'app_db',
        entities: (schemaEntities.length > 0 ? schemaEntities : dataModels).map(entity => ({
          name: entity.name,
          displayName: entity.displayName || entity.name,
          description: `${entity.displayName || entity.name} management and operations`,
          tableName: entity.name.toLowerCase() + 's',
          fields: (entity.fields || []).reduce((acc: any, field: any) => {
            acc[field.name] = {
              type: field.type,
              required: field.required,
              label: field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/_/g, ' '),
              validation: field.type === 'email' ? { format: 'email' } : 
                         field.type === 'url' ? { format: 'url' } : {},
              ...(field.description && { description: field.description })
            };
            return acc;
          }, {
            id: { type: 'string', required: true, primary: true, label: 'ID' },
            created_at: { type: 'date', required: true, default: 'now()', label: 'Created At' },
            updated_at: { type: 'date', required: true, default: 'now()', label: 'Updated At' }
          })
        }))
      },
      integrations: selectedConnectorsList.map(connector => ({
        name: connector!.id,
        type: 'rest',
        provider: connector!.provider,
        displayName: connector!.name,
        category: connector!.category,
        baseUrl: connector!.baseUrl,
        documentation: connector!.documentation,
        authentication: {
          type: connector!.authentication.type,
          ...(connector!.authentication.type === 'oauth2' && connector!.authentication.oauth ? {
            oauth: {
              authUrl: connector!.authentication.oauth.authUrl,
              tokenUrl: connector!.authentication.oauth.tokenUrl,
              scope: connector!.authentication.oauth.scope
            }
          } : {}),
          ...(connector!.authentication.type === 'api_key' ? {
            apiKey: {
              header: 'Authorization',
              prefix: 'Bearer'
            }
          } : {})
        },
        endpoints: connector!.dataTypes.map(dataType => ({
          name: `get_${dataType}`,
          path: `/${dataType}`,
          method: 'GET',
          description: `Fetch ${dataType} from ${connector!.name}`,
          response: {
            type: 'array',
            items: { type: 'object' }
          }
        })),
        sync: {
          enabled: true,
          frequency: connector!.syncFrequency || 'hourly',
          strategy: 'incremental'
        }
      })),
      workflows: workflows.map(workflow => ({
        name: workflow.name.replace(/\s+/g, '_').toLowerCase(),
        displayName: workflow.name,
        description: workflow.description,
        enabled: true,
        trigger: {
          type: workflow.trigger?.type || 'manual',
          event: workflow.trigger?.config?.event || 'manual_trigger',
          ...(workflow.trigger?.endpoint && { endpoint: workflow.trigger.endpoint })
        },
        steps: (workflow.steps || []).map((step, index) => ({
          id: step.id || `step_${index + 1}`,
          name: step.config?.name || `${step.type}_step`,
          type: step.type,
          order: index + 1,
          config: {
            ...step.config,
            ...(step.type === 'api_call' && {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }),
            ...(step.type === 'email' && {
              provider: 'sendgrid',
              from: 'noreply@myapp.com'
            }),
            ...(step.type === 'database' && {
              operation: 'INSERT'
            })
          }
        })),
        error_handling: {
          retry: { max_attempts: 3, backoff: 'exponential' },
          on_failure: 'log_and_continue'
        }
      })),
      ui: {
        theme: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444'
        },
        pages: (schemaEntities.length > 0 ? schemaEntities : dataModels).map(entity => ({
          name: entity.name.toLowerCase(),
          path: `/${entity.name.toLowerCase()}s`,
          title: `${entity.displayName || entity.name} Management`,
          type: 'crud',
          entity: entity.name,
          features: ['list', 'create', 'edit', 'delete', 'search', 'pagination']
        })),
        navigation: [
          { label: 'Dashboard', path: '/', icon: 'home' },
          ...(schemaEntities.length > 0 ? schemaEntities : dataModels).map(entity => ({
            label: entity.displayName || entity.name,
            path: `/${entity.name.toLowerCase()}s`,
            icon: entity.name.toLowerCase() === 'user' ? 'users' : 'database'
          })),
          { label: 'Integrations', path: '/integrations', icon: 'plug' },
          { label: 'Settings', path: '/settings', icon: 'settings' }
        ]
      },
      deployment: {
        type: 'docker',
        platform: 'vercel',
        environment: {
          NODE_ENV: 'production',
          DATABASE_URL: '${DATABASE_URL}',
          NEXTAUTH_SECRET: '${NEXTAUTH_SECRET}',
          NEXTAUTH_URL: '${NEXTAUTH_URL}'
        }
      }
    };

    return `# OPSAI Generated Configuration
# Generated on: ${new Date().toISOString()}
# Generator: OPSAI Core Platform v2.1
# Vertical: ${vertical?.name}

${JSON.stringify(yamlConfig, null, 2)}`;
  };

  const renderYAMLGeneration = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Generate Your Application</h2>
        <p className="text-gray-600">
          Review your configuration and generate your complete SaaS application. Your YAML configuration will include all schemas, integrations, and workflows.
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 App Configuration</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {appConfig.name}</div>
            <div><span className="font-medium">Display Name:</span> {appConfig.displayName}</div>
            <div><span className="font-medium">Type:</span> {verticals.find(v => v.id === selectedVertical)?.name}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Data Schema</h3>
          <div className="space-y-2 text-sm">
            {(schemaEntities.length > 0 ? schemaEntities : dataModels).map((entity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{entity.name}</span>
                  <span className="text-gray-500 ml-2">({entity.fields?.length || 0} fields)</span>
                </div>
                <div className="flex space-x-1">
                  {entity.fields?.slice(0, 3).map((field, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {field.name}
                    </span>
                  ))}
                  {(entity.fields?.length || 0) > 3 && (
                    <span className="text-gray-400 text-xs">+{(entity.fields?.length || 0) - 3}</span>
                  )}
                </div>
              </div>
            ))}
            {schemaEntities.length === 0 && dataModels.length === 0 && (
              <div className="text-gray-500 italic">No entities defined</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔌 API Integrations</h3>
          <div className="space-y-3 text-sm">
            {Array.from(selectedConnectors).map(connectorId => {
              const connector = mockConnectors.find(c => c.id === connectorId);
              const isConnected = connectedApis.has(connectorId);
              return (
                <div key={connectorId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-medium">{connector?.name}</span>
                    <span className="text-gray-500">({connector?.category})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      connector?.authentication.type === 'oauth2' ? 'bg-blue-100 text-blue-800' :
                      connector?.authentication.type === 'api_key' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {connector?.authentication.type?.toUpperCase()}
                    </span>
                    {isConnected && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              );
            })}
            {selectedConnectors.size === 0 && (
              <div className="text-gray-500 italic">No integrations selected</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Automated Workflows</h3>
          <div className="space-y-3 text-sm">
            {workflows.map((workflow, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-3">
                <div className="font-medium">{workflow.name}</div>
                <div className="text-gray-500 text-xs">{workflow.description}</div>
                <div className="flex items-center mt-1 space-x-2">
                  <Play className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-gray-600">
                    {workflow.steps?.length || 0} steps
                  </span>
                </div>
              </div>
            ))}
            {workflows.length === 0 && (
              <div className="text-gray-500 italic">No workflows defined</div>
            )}
          </div>
        </div>
      </div>

      {/* YAML Preview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📄 Generated YAML Configuration</h3>
          <button
            onClick={() => {
              const yaml = generateYAMLConfig();
              setGeneratedYAML(yaml);
              navigator.clipboard.writeText(yaml);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Copy to Clipboard
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {generatedYAML || generateYAMLConfig()}
          </pre>
        </div>
      </div>

      {/* Generate Application */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate Your SaaS?</h3>
          <p className="text-gray-600 mb-6">
            Click below to generate your complete vertical SaaS application from your configuration
          </p>
          <button
            onClick={async () => {
              setIsGeneratingApp(true);
              // Simulate app generation
              await new Promise(resolve => setTimeout(resolve, 3000));
              setIsGeneratingApp(false);
              nextStep();
            }}
            disabled={isGeneratingApp}
            className={`px-8 py-3 rounded-lg font-medium text-white ${
              isGeneratingApp 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isGeneratingApp ? (
              <div className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Application...
              </div>
            ) : (
              'Generate My SaaS Application'
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Integration Setup</h1>
              <p className="text-gray-600 mt-1">Connect your business tools and automate your workflows</p>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-3 ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.completed
                      ? 'bg-green-600 text-white'
                      : index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 0 && renderVerticalSelection()}
        {currentStep === 1 && renderSchemaDesigner()}
        {currentStep === 2 && renderAPIBrowser()}
        {currentStep === 3 && renderWorkflowBuilder()}
        {currentStep === 4 && renderYAMLGeneration()}
        {currentStep === 5 && renderConnectionStep()}
        {currentStep === 6 && renderCompletionStep()}
      </div>

      {renderOAuthModal()}
    </div>
  );
};

export default APIIntegrationOnboarding;