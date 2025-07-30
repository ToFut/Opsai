import React, { useState } from 'react';
import { ChevronLeft, AlertCircle, X, Sparkles, MapPin } from 'lucide-react';

const OnboardingProcess = ({ onBackToDashboard }) => {
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessName: '',
    businessType: 'bakery',
    yearFounded: '',
    website: '',
    phone: '',
    mainContact: '',
    businessHours: '',
    socialLinks: [],
    locations: [{ name: '', address: '', manager: '', phone: '' }],
    industry: 'food-service',
    
    // Step 2: Email Integration
    emailDomain: '',
    emailAccess: false,
    emailProvider: '',
    sharedMailbox: '',
    emailPassword: '', // Added for real email scanning
    
    // Step 3: Current Systems
    currentSystems: [],
    posSystem: '',
    accountingSystem: '',
    inventorySystem: '',
    ecommerceSystem: '',
    
    // Step 4: Data Sources
    dataSources: {
      pos: { connected: false, system: '', apiKey: '' },
      inventory: { connected: false, system: '', apiKey: '' },
      accounting: { connected: false, system: '', apiKey: '' },
      ecommerce: { connected: false, system: '', apiKey: '' },
      staff: { connected: false, system: '', apiKey: '' }
    },
    
    // Step 5: Preferences
    automationPreferences: {
      autoReorder: true,
      wasteAlerts: true,
      staffNotifications: true,
      customerCommunications: false,
      financialReports: true
    },
    
    // Step 6: Team Setup
    teamMembers: [{ name: '', email: '', role: '', permissions: [] }],
    
    // Step 7: Goals & KPIs
    goals: {
      wasteReduction: 20,
      inventoryOptimization: true,
      staffEfficiency: true,
      customerSatisfaction: true,
      revenueGrowth: 15
    }
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [step, setStep] = useState('scan');
  
  // SaaS Discovery with NudgeSecurity
  const [nudgeToken, setNudgeToken] = useState('');
  const [nudgeScanning, setNudgeScanning] = useState(false);
  const [discoveredApps, setDiscoveredApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [showSaaSDiscovery, setShowSaaSDiscovery] = useState(false);
  const [showNudgeGuide, setShowNudgeGuide] = useState(false);
  const [nudgeStep, setNudgeStep] = useState(1);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);

  const scanWebsiteWithAI = async (websiteUrl) => {
    setAiScanning(true);
    setErrorMessage('');
    setIsError(false);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch('/api/ai-scan-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteUrl }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success) {
        // AI results stored in data
        
        // Transition to profile page after successful scan
        setStep('profile');
        
        // Auto-populate form with AI results
        if (data.businessInfo) {
          setFormData(prev => ({
            ...prev,
            businessName: data.businessInfo.businessName || prev.businessName,
            businessType: data.businessInfo.businessType || prev.businessType,
            yearFounded: data.businessInfo.yearFounded || prev.yearFounded,
            website: data.businessInfo.website || prev.website,
            phone: data.businessInfo.phone || prev.phone,
            mainContact: data.businessInfo.mainContact || prev.mainContact,
            businessHours: data.businessInfo.businessHours || prev.businessHours,
            socialLinks: data.businessInfo.socialLinks || prev.socialLinks,
            emailDomain: data.emailSuggestions?.emailDomains?.[0] || prev.emailDomain,
            sharedMailbox: data.emailSuggestions?.sharedMailboxes?.[0] || prev.sharedMailbox,
            emailProvider: data.emailSuggestions?.recommendedProvider || prev.emailProvider
          }));
        }
        
        // Auto-populate locations if available
        if (data.onboardingData?.locations && Array.isArray(data.onboardingData.locations) && data.onboardingData.locations.length > 0) {
          setFormData(prev => ({
            ...prev,
            locations: data.onboardingData.locations
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            locations: [{ name: '', address: '', manager: '', phone: '' }]
          }));
        }
        
        // Auto-populate team members if available
        if (data.onboardingData?.teamMembers) {
          setFormData(prev => ({
            ...prev,
            teamMembers: data.onboardingData.teamMembers
          }));
        }
        
        // Auto-populate automation preferences if available
        if (data.onboardingData?.automationPreferences) {
          setFormData(prev => ({
            ...prev,
            automationPreferences: data.onboardingData.automationPreferences
          }));
        }
        
        // Auto-populate goals if available
        if (data.onboardingData?.goals) {
          setFormData(prev => ({
            ...prev,
            goals: data.onboardingData.goals
          }));
        }
        
      } else {
        setErrorMessage(data.error || 'AI scanning failed. Please try again.');
        setIsError(true);
      }
    } catch (error) {
      console.error('AI scanning error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setErrorMessage('Network error. The scan is taking longer than expected. Please try again.');
      } else {
        setErrorMessage('Network error. Please check your connection and try again.');
      }
      setIsError(true);
    } finally {
      setAiScanning(false);
    }
  };

  // SaaS Discovery with NudgeSecurity
  const handleNudgeDiscovery = async () => {
    if (!nudgeToken.trim()) {
      setErrorMessage('Please enter your NudgeSecurity API token');
      setIsError(true);
      return;
    }

    setNudgeScanning(true);
    setErrorMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/nudge-discover-saas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nudgeToken: nudgeToken.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setDiscoveredApps(data.apps || []);
        setShowSaaSDiscovery(true);
      } else {
        setErrorMessage(data.error || 'Failed to discover SaaS apps. Please check your token and try again.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Nudge discovery error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
      setIsError(true);
    } finally {
      setNudgeScanning(false);
    }
  };

  const handleAppSelection = (appName, isSelected) => {
    if (isSelected) {
      setSelectedApps(prev => [...prev, appName]);
    } else {
      setSelectedApps(prev => prev.filter(app => app !== appName));
    }
  };

  const connectSelectedApps = async () => {
    if (selectedApps.length === 0) {
      setErrorMessage('Please select at least one app to connect');
      setIsError(true);
      return;
    }

    try {
      const response = await fetch('/api/connect-saas-apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          selectedApps,
          nudgeToken: nudgeToken.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update form data with connected apps
        const updatedDataSources = { ...formData.dataSources };
        selectedApps.forEach(appName => {
          const app = discoveredApps.find(a => a.name === appName);
          if (app) {
            if (app.type === 'pos') updatedDataSources.pos.system = appName;
            if (app.type === 'accounting') updatedDataSources.accounting.system = appName;
            if (app.type === 'ecommerce') updatedDataSources.ecommerce.system = appName;
            if (app.type === 'inventory') updatedDataSources.inventory.system = appName;
            if (app.type === 'marketing') updatedDataSources.staff.system = appName;
          }
        });

        setFormData(prev => ({
          ...prev,
          dataSources: updatedDataSources
        }));

        setShowSaaSDiscovery(false);
        setSelectedApps([]);
        setDiscoveredApps([]);
        setNudgeToken('');
      } else {
        setErrorMessage(data.error || 'Failed to connect selected apps');
        setIsError(true);
      }
    } catch (error) {
      console.error('App connection error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
      setIsError(true);
    }
  };

  const startNudgeGuide = () => {
    setShowNudgeGuide(true);
    setNudgeStep(1);
  };

  const nextNudgeStep = () => {
    setNudgeStep(prev => Math.min(prev + 1, 4));
  };

  const prevNudgeStep = () => {
    setNudgeStep(prev => Math.max(prev - 1, 1));
  };

  const completeNudgeGuide = () => {
    setShowNudgeGuide(false);
    setNudgeStep(1);
  };

  const createUserProfile = async () => {
    setIsCreatingProfile(true);
    setErrorMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/create-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessProfile: formData,
          connectedApps: selectedApps,
          discoveredApps: discoveredApps,
          websiteUrl: formData.website || '',
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        setProfileCreated(true);
        // Store the profile data in localStorage for demo purposes
        localStorage.setItem('bakeryProfile', JSON.stringify({
          ...formData,
          profileId: data.profileId,
          createdAt: data.createdAt,
          connectedApps: selectedApps,
          discoveredApps: discoveredApps
        }));
      } else {
        setErrorMessage(data.error || 'Failed to create profile. Please try again.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
      setIsError(true);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const renderNudgeGuide = () => {
    const steps = [
      {
        title: "Sign Up for NudgeSecurity",
        description: "Create your free NudgeSecurity account to discover all your bakery's apps",
        action: "Go to NudgeSecurity.com",
        link: "https://www.nudgesecurity.com",
        details: [
          "Click 'Start Free Trial' on NudgeSecurity.com",
          "Use your bakery's business email address",
          "Complete the signup process (takes 2-3 minutes)"
        ]
      },
      {
        title: "Connect Your Business Email",
        description: "Grant NudgeSecurity read-only access to your business email",
        action: "Connect Email",
        details: [
          "Choose Google Workspace or Microsoft 365",
          "Grant read-only access to your email",
          "This allows NudgeSecurity to find all your SaaS apps"
        ]
      },
      {
        title: "Generate API Token",
        description: "Create an API token to connect NudgeSecurity to your bakery system",
        action: "Generate Token",
        details: [
          "Go to 'API Access' in your NudgeSecurity dashboard",
          "Click 'Generate New Token'",
          "Copy the token (it looks like: nudge_xxxxx.xxxxx)"
        ]
      },
      {
        title: "Paste Your Token",
        description: "Enter your NudgeSecurity API token to discover your apps",
        action: "Enter Token",
        details: [
          "Paste your API token in the field below",
          "Click 'Discover Apps' to find all your SaaS",
          "Select which apps to connect to your bakery system"
        ]
      }
    ];

    const currentStep = steps[nudgeStep - 1];

    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">🔍 NudgeSecurity Setup Guide</h3>
          <button
            onClick={completeNudgeGuide}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 <= nudgeStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 ${
                    index + 1 < nudgeStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">{currentStep.title}</h4>
            <p className="text-gray-600 mb-4">{currentStep.description}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-blue-900">{currentStep.action}</h5>
                <ul className="mt-2 space-y-1">
                  {currentStep.details.map((detail, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              {currentStep.link && (
                <a
                  href={currentStep.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Open
                </a>
              )}
            </div>
          </div>

          {/* Token Input for Step 4 */}
          {nudgeStep === 4 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Your NudgeSecurity API Token
              </label>
              <input
                type="password"
                value={nudgeToken}
                onChange={(e) => setNudgeToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="nudge_xxxxx.xxxxx"
              />
              <p className="text-sm text-gray-500">
                Paste your API token here. It should start with "nudge_" and contain a period.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevNudgeStep}
            disabled={nudgeStep === 1}
            className={`px-4 py-2 rounded-md ${
              nudgeStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Previous
          </button>
          
          {nudgeStep === 4 ? (
            <button
              onClick={handleNudgeDiscovery}
              disabled={nudgeScanning || !nudgeToken.trim()}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                nudgeScanning || !nudgeToken.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {nudgeScanning ? 'Discovering...' : 'Discover Apps'}
            </button>
          ) : (
            <button
              onClick={nextNudgeStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  };

  const goBackToDashboard = () => {
    onBackToDashboard();
  };

  const renderContent = () => {
    if (showSaaSDiscovery) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">SaaS Apps Discovered!</h2>
            <p className="text-gray-600">We found {discoveredApps.length} apps in your bakery. Select the ones you want to connect:</p>
          </div>

          {isError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-medium text-red-800">Discovery Error</h4>
              </div>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </div>
          )}

          <div className="grid gap-4">
            {discoveredApps.map((app, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`app-${index}`}
                      checked={selectedApps.includes(app.name)}
                      onChange={(e) => handleAppSelection(app.name, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor={`app-${index}`} className="font-medium text-gray-900 cursor-pointer">
                        {app.name}
                      </label>
                      <p className="text-sm text-gray-500">
                        {app.type.toUpperCase()} • {app.confidence}% confidence
                      </p>
                      {app.lastUsed && (
                        <p className="text-xs text-gray-400">
                          Last used: {new Date(app.lastUsed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {app.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              onClick={() => setShowSaaSDiscovery(false)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={connectSelectedApps}
              disabled={selectedApps.length === 0}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                selectedApps.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Connect {selectedApps.length} Selected App{selectedApps.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      );
    }

    // Step 1: Website Scan
    if (step === 'scan') {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bakery Onboarding</h2>
            <p className="text-gray-600">Let's set up your bakery management system</p>
          </div>

          {/* AI Website Scan */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🤖 AI-Powered Business Discovery</h3>
            <p className="text-gray-600 mb-4">Let our AI scan your website to automatically fill in your business information</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Business Website URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    id="websiteUrl"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://yourbakery.com"
                  />
                  <button
                    onClick={() => {
                      const url = document.getElementById('websiteUrl').value;
                      if (url) scanWebsiteWithAI(url);
                    }}
                    disabled={aiScanning}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      aiScanning
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {aiScanning ? 'Scanning...' : 'Scan with AI'}
                  </button>
                </div>
              </div>
            </div>

            {aiScanning && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
                  <div className="w-12 h-12 rounded-full bg-white"></div>
                </div>
                <p className="mt-4 text-gray-600">AI is analyzing your website...</p>
                <p className="text-sm text-gray-500">This may take up to 60 seconds</p>
              </div>
            )}
          </div>

          {isError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-medium text-red-800">Error</h4>
              </div>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <button
              onClick={goBackToDashboard}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    // Step 2: Profile Review & Edit
    if (step === 'profile') {
      // Show success state if profile was created
      if (profileCreated) {
        return (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-8 text-white text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Profile Created Successfully!</h2>
                  <p className="text-green-100 text-lg mt-1">Your bakery is now ready for intelligent management</p>
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Your Business Profile Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {formData.businessName}</div>
                      <div><span className="font-medium">Type:</span> {formData.businessType}</div>
                      <div><span className="font-medium">Website:</span> {formData.website || 'Not specified'}</div>
                      <div><span className="font-medium">Phone:</span> {formData.phone || 'Not specified'}</div>
                      <div><span className="font-medium">Main Contact:</span> {formData.mainContact || 'Not specified'}</div>
                      <div><span className="font-medium">Year Founded:</span> {formData.yearFounded || 'Not specified'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Social Media</h4>
                    <div className="space-y-1 text-sm">
                      {formData.socialLinks && formData.socialLinks.length > 0 ? (
                        formData.socialLinks.map((link, index) => (
                          <div key={index}>
                            <span className="font-medium">{link.name}:</span> {link.url}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No social media links found</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Connected Systems</h4>
                    <div className="space-y-2 text-sm">
                      {selectedApps.length > 0 ? (
                        selectedApps.map((app, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span>{app}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No apps connected yet</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Business Hours</h4>
                    <div className="text-sm text-gray-600">
                      {formData.businessHours || 'Not specified'}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Profile ID</h4>
                    <div className="text-sm font-mono text-gray-600 bg-gray-100 p-2 rounded">
                      {localStorage.getItem('bakeryProfile') ? 
                        JSON.parse(localStorage.getItem('bakeryProfile')).profileId || 'Generated on save' : 
                        'Will be generated'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">🎯 What's Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <h4 className="font-medium text-blue-900 mb-2">View Dashboard</h4>
                  <p className="text-sm text-blue-700">Access your intelligent bakery management dashboard</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl">🔗</span>
                  </div>
                  <h4 className="font-medium text-blue-900 mb-2">Connect More Apps</h4>
                  <p className="text-sm text-blue-700">Add additional SaaS integrations as needed</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl">⚙️</span>
                  </div>
                  <h4 className="font-medium text-blue-900 mb-2">Configure Settings</h4>
                  <p className="text-sm text-blue-700">Customize automation and notification preferences</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => onBackToDashboard()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setProfileCreated(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Edit Profile
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {/* Celebratory Banner */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white text-center">
            <div className="flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 mr-2" />
              <h2 className="text-2xl font-bold">Profile Created Successfully!</h2>
            </div>
            <p className="text-green-100">Review and edit your business information below</p>
          </div>

          {/* Business Info Card */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bakery">Bakery</option>
                  <option value="cafe">Cafe</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="food-service">Food Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Founded</label>
                <input
                  type="number"
                  value={formData.yearFounded || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearFounded: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourbakery.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Contact</label>
                <input
                  type="text"
                  value={formData.mainContact || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mainContact: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
              <textarea
                value={formData.businessHours || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, businessHours: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Monday-Friday: 7AM-6PM, Saturday: 8AM-4PM, Sunday: Closed"
              />
            </div>
          </div>

          {/* Social Links Card */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
            <div className="space-y-3">
              {formData.socialLinks && formData.socialLinks.map((link, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => {
                      const newLinks = [...formData.socialLinks];
                      newLinks[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, socialLinks: newLinks }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Platform (e.g., Instagram)"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...formData.socialLinks];
                      newLinks[index].url = e.target.value;
                      setFormData(prev => ({ ...prev, socialLinks: newLinks }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/yourbakery"
                  />
                  <button
                    onClick={() => {
                      const newLinks = formData.socialLinks.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, socialLinks: newLinks }));
                    }}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newLinks = [...(formData.socialLinks || []), { name: '', url: '' }];
                  setFormData(prev => ({ ...prev, socialLinks: newLinks }));
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Social Media Link
              </button>
            </div>
          </div>

                     {/* Connected SaaS & Systems */}
           <div className="bg-white rounded-lg border p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Your Connected SaaS & Systems</h3>
             <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                 <div>
                   <p className="font-medium">Square POS</p>
                   <p className="text-sm text-gray-500">Payment Processing</p>
                 </div>
                 <span className="text-green-600 text-sm">Connected</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                 <div>
                   <p className="font-medium">QuickBooks</p>
                   <p className="text-sm text-gray-500">Accounting</p>
                 </div>
                 <span className="text-green-600 text-sm">Connected</span>
               </div>
               
               {/* NudgeSecurity Discovery */}
               {showNudgeGuide ? (
                 renderNudgeGuide()
               ) : (
                 <div className="space-y-4">
                   <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                     <div className="text-4xl mb-2">🔍</div>
                     <h4 className="text-lg font-medium text-gray-900 mb-2">Discover All Your SaaS Apps</h4>
                     <p className="text-gray-600 mb-4">
                       Automatically find all the apps your bakery uses (POS, accounting, delivery, etc.) with NudgeSecurity
                     </p>
                     
                     <div className="space-y-3">
                       <button
                         onClick={startNudgeGuide}
                         className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                       >
                         🚀 Get Started with NudgeSecurity
                       </button>
                       
                       <div className="text-sm text-gray-500">
                         Already have a NudgeSecurity account? 
                         <button
                           onClick={() => setShowSaaSDiscovery(true)}
                           className="text-blue-600 hover:text-blue-800 ml-1"
                         >
                           Enter your API token
                         </button>
                       </div>
                     </div>
                   </div>
                   
                   {/* Quick Token Input for Existing Users */}
                   {showSaaSDiscovery && (
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           NudgeSecurity API Token
                         </label>
                         <input
                           type="password"
                           value={nudgeToken}
                           onChange={(e) => setNudgeToken(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="nudge_xxxxx.xxxxx"
                         />
                       </div>
                       
                       <button
                         onClick={handleNudgeDiscovery}
                         disabled={nudgeScanning || !nudgeToken.trim()}
                         className={`w-full px-6 py-3 rounded-md text-white font-medium ${
                           nudgeScanning || !nudgeToken.trim()
                             ? 'bg-gray-400 cursor-not-allowed'
                             : 'bg-blue-600 hover:bg-blue-700'
                         }`}
                       >
                         {nudgeScanning ? 'Discovering Apps...' : 'Discover All SaaS with Nudge Security'}
                       </button>
                       
                       <button
                         onClick={() => setShowSaaSDiscovery(false)}
                         className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
                       >
                         Cancel
                       </button>
                     </div>
                   )}
                 </div>
               )}
             </div>
           </div>

          {/* Suggested API Connectors based on AI Analysis */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Suggested Integrations</h3>
            <p className="text-gray-600 mb-4">Based on our AI analysis of your website, here are the recommended integrations for your business:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Processing */}
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">💳 Payment Processing</h4>
                  <span className="text-blue-600 text-sm">Essential</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Square POS</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stripe</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">PayPal</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                </div>
              </div>

              {/* Inventory Management */}
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">📦 Inventory Management</h4>
                  <span className="text-green-600 text-sm">Essential</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Shopify</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">WooCommerce</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lightspeed</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                </div>
              </div>

              {/* Accounting & Finance */}
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">💰 Accounting & Finance</h4>
                  <span className="text-purple-600 text-sm">Important</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">QuickBooks</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Xero</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">FreshBooks</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                </div>
              </div>

              {/* Delivery & Logistics */}
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">🚚 Delivery & Logistics</h4>
                  <span className="text-orange-600 text-sm">Essential</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">DoorDash</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uber Eats</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Grubhub</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                </div>
              </div>

              {/* Marketing & Social */}
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">📱 Marketing & Social</h4>
                  <span className="text-pink-600 text-sm">Boost Sales</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Instagram Business</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Facebook Ads</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mailchimp</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                </div>
              </div>

              {/* Analytics & Reporting */}
              <div className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">📊 Analytics & Reporting</h4>
                  <span className="text-indigo-600 text-sm">Insights</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Google Analytics</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Google Search Console</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hotjar</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Connect</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">💡</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">AI Recommendation</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Based on your website analysis, we recommend starting with Square POS and QuickBooks for immediate value. 
                    These integrations will help you track sales, manage inventory, and streamline your accounting processes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Continue Button */}
          <div className="sticky bottom-6 bg-white border-t pt-4">
            <button
              onClick={createUserProfile}
              disabled={isCreatingProfile}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                isCreatingProfile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {isCreatingProfile ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Profile...
                </div>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </div>
        </div>
      );
    }

         // SaaS Discovery Modal
     if (showSaaSDiscovery && discoveredApps.length > 0) {
       return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-semibold text-gray-900">🔍 SaaS Apps Discovered!</h3>
                 <button
                   onClick={() => setShowSaaSDiscovery(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <p className="text-gray-600 mb-6">
                 We found {discoveredApps.length} apps in your bakery. Select the ones you want to connect:
               </p>
               
               <div className="space-y-3 mb-6">
                 {discoveredApps.map((app, index) => (
                   <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id={`app-${index}`}
                           checked={selectedApps.includes(app.name)}
                           onChange={(e) => handleAppSelection(app.name, e.target.checked)}
                           className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                         />
                         <div>
                           <label htmlFor={`app-${index}`} className="font-medium text-gray-900 cursor-pointer">
                             {app.name}
                           </label>
                           <p className="text-sm text-gray-500">
                             {app.type.toUpperCase()} • {app.confidence}% confidence
                           </p>
                           {app.lastUsed && (
                             <p className="text-xs text-gray-400">
                               Last used: {new Date(app.lastUsed).toLocaleDateString()}
                             </p>
                           )}
                         </div>
                       </div>
                       <div className="text-right">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                           {app.type}
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="flex space-x-4">
                 <button
                   onClick={() => setShowSaaSDiscovery(false)}
                   className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={connectSelectedApps}
                   disabled={selectedApps.length === 0}
                   className={`px-6 py-2 rounded-md text-white font-medium ${
                     selectedApps.length === 0
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-blue-600 hover:bg-blue-700'
                   }`}
                 >
                   Connect {selectedApps.length} Selected App{selectedApps.length !== 1 ? 's' : ''}
                 </button>
               </div>
             </div>
           </div>
         </div>
       );
     }

     return null;
   };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProcess;