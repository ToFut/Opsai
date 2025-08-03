import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Brain, 
  Target, 
  Calendar, 
  Download, 
  Upload, 
  Eye, 
  Edit3, 
  BarChart3, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  MessageCircle, 
  Building, 
  Car, 
  Home,
  ArrowRight,
  ChevronRight,
  Star,
  Lock,
  Workflow,
  CreditCard,
  User,
  X,
  Monitor,
  Smartphone,
  Tablet,
  FileCheck,
  Coins,
  Timer,
  CircleDot,
  Globe,
  Mail,
  Send,
  Percent,
  Receipt,
  UserCheck,
  FileWarning,
  AlertOctagon,
  ClipboardList,
  Camera,
  MapPin,
  Phone,
  Award,
  PhoneCall,
  MessageSquare,
  BarChart4,
  PieChart,
  Activity,
  FileX,
  FilePlus,
  FileEdit,
  SortAsc,
  SortDesc,
  Wifi,
  Layers,
  Cloud,
  HardDrive,
  FolderOpen,
  Bookmark,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Banknote,
  Calculator,
  PiggyBank,
  Radar,
  Gauge
} from 'lucide-react';

const InsureFlow = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [userView, setUserView] = useState('admin');
  const [selectedCarriers, setSelectedCarriers] = useState([]);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [deviceView, setDeviceView] = useState('desktop');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [realTimeNotifications, setRealTimeNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [documentFilter, setDocumentFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const [claimsFilter, setClaimsFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  // Comprehensive carrier list
  const carriers = [
    'Abacus', 'Access', 'Adventure Mexican Insurance', 'AEGIS', 'Agent Secure', 'All State', 
    'Allianz', 'AllState', 'American Collectors Insurance', 'American Modern', 'American Strategic',
    'Amtrust', 'Annex Risk', 'Anthem Blue Cross', 'Appalachian Underwriters', 'Arrowhead',
    'ASI', 'Atlas', 'Back9', 'Bamboo', 'Bank of America', 'BASIC COBRA', 'Bass Underwriter',
    'bi', 'Berk', 'BIS', 'Blue Cross', 'Blue Shield', 'BOLT Access', 'Bristol West',
    'BTIS', 'California Assigned Risk', 'California Fair Plan', 'Capital Premium Financing',
    'Choice Administrators', 'Cigna', 'Citizens Property Corporation', 'Classic Plan', 'Cobra',
    'Collectible Insurance', 'Compass', 'Coterie Insurance', 'Cover Insurance', 'Covered California',
    'Cowbell Cyber', 'CSE', 'CSLB', 'CVS Health', 'Deans & Homer', 'Distinguished Programs',
    'Efax', 'Embark General', 'Employers', 'ePremium Renters', 'Ethos', 'Fast Mex',
    'First American', 'First Connect', 'Foremost Flood', 'Foremost Star', 'Geoblue', 'Geovera',
    'Gerber Life', 'Guardian', 'Guardian Dental', 'Guardian Life', 'Hagerty', 'Hartford',
    'Hanover', 'HCC Artisian', 'HCC SPECIALTY', 'HCC Surety', 'Healthnet', 'HealthNet Groups',
    'HealthNet IFP', 'Heritage Insurance', 'Hippo', 'Hippo Flood', 'Hiscox', 'Honeycomb',
    'Honeyquote', 'Liberty Mutual Cargo', 'Humana', 'HYPERDRIVE CORP', 'Insurance Helper',
    'Je Brown', 'John Hancock', 'K & K Insurance Group', 'Kaiser', 'Kemper', 'LExisNexis',
    'Liberty Mutual', 'Liberty Mutual Surety', 'LightSpeed', 'Markel', 'Mercury Agent Station',
    'Mercury Commercial Express', 'Mercury First', 'Mile Auto Inc', 'Mj Hall', 'National General Life',
    'Neptune Flood', 'Oscar', 'Pacific Life', 'Pacific Specialty Flood', 'Pacific Specialty Insurance',
    'Pathpoint', 'Personal Umbrella', 'Philadelphia Small Business', 'Pie', 'Pins Advantage',
    'Principal', 'Progressive', 'Pro', 'Provider Network360', 'Qubie', 'Quotit', 'Rainbow',
    'reinsure', 'REInsurePro', 'RIC Insurance', 'Rivington', 'RLI', 'Rodbrain', 'RRS Agent Portal',
    'RT CONNECTOR', 'RT Specialty', 'Safeco', 'Sircon', 'SureLC', 'StateFund', 'Three',
    'Total Event Insurance', 'Travelers', 'UHC BROKERS', 'UHC employer', 'Ureportus', 'assure',
    'Vacant Express', 'Warner Pacific', 'WCIRB', 'Windsor Insurance', 'Mutual of Omaha',
    'NatGen', 'ISUZO', 'Nationwide Commercial', 'Rocklake', 'DOB NYC', 'IVANS', 'Hourly'
  ];

  // Comprehensive client and user data structure
  const clientsData = [
    {
      id: 'CLI-001',
      name: 'Metro Construction LLC',
      type: 'Commercial',
      industry: 'Construction',
      assignedAgent: 'Sarah Johnson',
      assignedCSR: 'Mike Chen',
      totalPremium: 47520,
      policies: 3,
      lastActivity: '2024-07-30',
      status: 'Active',
      churnRisk: 0.23,
      contact: { email: 'admin@metroconstruction.com', phone: '(555) 123-4567' },
      address: '123 Industrial Blvd, Construction City, CA 90210',
      renewalDate: '2024-12-15',
      commissionRate: 15,
      policyTypes: ['General Liability', 'Commercial Auto', 'Workers Comp'],
      claims: 3
    },
    {
      id: 'CLI-002',
      name: 'Johnson Automotive Group',
      type: 'Commercial',
      industry: 'Automotive',
      assignedAgent: 'Sarah Johnson',
      assignedCSR: 'Lisa Rodriguez',
      totalPremium: 32400,
      policies: 2,
      lastActivity: '2024-07-29',
      status: 'Active',
      churnRisk: 0.67,
      contact: { email: 'info@johnsongroup.com', phone: '(555) 234-5678' },
      address: '456 Auto Lane, Cartown, CA 90211',
      renewalDate: '2024-11-30',
      commissionRate: 12,
      policyTypes: ['Commercial Auto', 'Garage Liability'],
      claims: 2
    },
    {
      id: 'CLI-003',
      name: 'Riverside Medical Center',
      type: 'Commercial',
      industry: 'Healthcare',
      assignedAgent: 'David Miller',
      assignedCSR: 'Mike Chen',
      totalPremium: 85600,
      policies: 4,
      lastActivity: '2024-07-31',
      status: 'Active',
      churnRisk: 0.45,
      contact: { email: 'risk@riversidemedical.com', phone: '(555) 345-6789' },
      address: '789 Health Way, Medical City, CA 90212',
      renewalDate: '2024-10-10',
      commissionRate: 18,
      policyTypes: ['Professional Liability', 'General Liability', 'Cyber', 'Property'],
      claims: 1
    },
    {
      id: 'CLI-004',
      name: 'TechStart Industries',
      type: 'Commercial',
      industry: 'Technology',
      assignedAgent: 'Sarah Johnson',
      assignedCSR: 'Lisa Rodriguez',
      totalPremium: 28900,
      policies: 2,
      lastActivity: '2024-07-28',
      status: 'Renewal Required',
      churnRisk: 0.34,
      contact: { email: 'ops@techstart.com', phone: '(555) 456-7890' },
      address: '321 Innovation Dr, Tech Valley, CA 90213',
      renewalDate: '2024-08-15',
      commissionRate: 16,
      policyTypes: ['Cyber Liability', 'Errors & Omissions'],
      claims: 0
    },
    {
      id: 'CLI-005',
      name: 'Golden State Restaurant Co',
      type: 'Commercial',
      industry: 'Food Service',
      assignedAgent: 'David Miller',
      assignedCSR: 'Mike Chen',
      totalPremium: 19800,
      policies: 3,
      lastActivity: '2024-07-27',
      status: 'Active',
      churnRisk: 0.12,
      contact: { email: 'manager@goldenrestaurants.com', phone: '(555) 567-8901' },
      address: '654 Foodie St, Culinary City, CA 90214',
      renewalDate: '2025-01-20',
      commissionRate: 14,
      policyTypes: ['General Liability', 'Property', 'Workers Comp'],
      claims: 2
    },
    {
      id: 'CLI-006',
      name: 'Pacific Shipping Lines',
      type: 'Commercial',
      industry: 'Transportation',
      assignedAgent: 'Sarah Johnson',
      assignedCSR: 'Lisa Rodriguez',
      totalPremium: 156000,
      policies: 5,
      lastActivity: '2024-07-31',
      status: 'Active',
      churnRisk: 0.28,
      contact: { email: 'risk@pacificshipping.com', phone: '(555) 678-9012' },
      address: '987 Harbor Blvd, Port City, CA 90215',
      renewalDate: '2024-09-30',
      commissionRate: 20,
      policyTypes: ['Marine Cargo', 'Commercial Auto', 'General Liability', 'Property', 'Umbrella'],
      claims: 4
    }
  ];

  const agentsData = [
    {
      id: 'AGT-001',
      name: 'Sarah Johnson',
      role: 'Senior Producer',
      email: 'sarah.johnson@insureflow.com',
      phone: '(555) 111-2222',
      clients: ['CLI-001', 'CLI-002', 'CLI-004', 'CLI-006'],
      totalPremium: 265320,
      commissionEarned: 42450,
      quotesActive: 23,
      renewalsUpcoming: 12,
      lastLogin: '2024-07-31 09:15',
      performance: { quotesToBound: 68.5, retention: 94.2, growth: 15.3 }
    },
    {
      id: 'AGT-002',
      name: 'David Miller',
      role: 'Producer',
      email: 'david.miller@insureflow.com',
      phone: '(555) 222-3333',
      clients: ['CLI-003', 'CLI-005'],
      totalPremium: 105400,
      commissionEarned: 17680,
      quotesActive: 8,
      renewalsUpcoming: 3,
      lastLogin: '2024-07-31 08:30',
      performance: { quotesToBound: 72.1, retention: 91.8, growth: 12.7 }
    },
    {
      id: 'AGT-003',
      name: 'Jennifer Lee',
      role: 'Associate Producer',
      email: 'jennifer.lee@insureflow.com',
      phone: '(555) 333-4444',
      clients: [],
      totalPremium: 0,
      commissionEarned: 0,
      quotesActive: 0,
      renewalsUpcoming: 0,
      lastLogin: '2024-07-30 16:45',
      performance: { quotesToBound: 0, retention: 0, growth: 0 }
    }
  ];

  const csrData = [
    {
      id: 'CSR-001',
      name: 'Mike Chen',
      role: 'Senior CSR',
      email: 'mike.chen@insureflow.com',
      phone: '(555) 444-5555',
      clients: ['CLI-001', 'CLI-003', 'CLI-005'],
      documentsProcessed: 156,
      coiGenerated: 89,
      ticketsResolved: 45,
      avgResponseTime: '2.3 hours',
      lastLogin: '2024-07-31 10:00',
      satisfaction: 4.8
    },
    {
      id: 'CSR-002',
      name: 'Lisa Rodriguez',
      role: 'CSR',
      email: 'lisa.rodriguez@insureflow.com',
      phone: '(555) 555-6666',
      clients: ['CLI-002', 'CLI-004', 'CLI-006'],
      documentsProcessed: 124,
      coiGenerated: 67,
      ticketsResolved: 38,
      avgResponseTime: '3.1 hours',
      lastLogin: '2024-07-31 09:45',
      satisfaction: 4.6
    }
  ];

  // Real-time notifications system
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      ...notification
    };
    setRealTimeNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
  };

  // AI Chat functionality
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      userName: getCurrentUserData().name
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setAiTyping(true);

    // Simulate AI thinking and generate contextual response
    setTimeout(() => {
      const aiResponse = generateAIResponse(message);
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
        userName: 'InsureFlow AI'
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setAiTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  // AI Response Generator with full context awareness
  const generateAIResponse = (userMessage) => {
    const currentUser = getCurrentUserData();
    const currentData = getFilteredClients();
    const lowerMessage = userMessage.toLowerCase();

    // Context-aware responses based on user role and selected entities
    const contextInfo = {
      user: currentUser,
      selectedClient: selectedClient,
      selectedAgent: selectedAgent,
      userRole: userView,
      totalClients: currentData.length,
      hasSelection: selectedClient || selectedAgent
    };

    // Comprehensive response patterns
    if (lowerMessage.includes('policy') || lowerMessage.includes('policies')) {
      if (selectedClient) {
        return `I can see you're asking about policies for ${selectedClient.name}. They currently have ${selectedClient.policies} active policies including ${selectedClient.policyTypes.join(', ')}. Their total premium is $${selectedClient.totalPremium.toLocaleString()} with a renewal date of ${selectedClient.renewalDate}. Their churn risk is currently ${(selectedClient.churnRisk * 100).toFixed(1)}%. Would you like me to analyze their renewal strategy or cross-selling opportunities?`;
      } else if (userView === 'admin') {
        return `As an admin, you have full visibility into all policies across the platform. Currently, there are ${policies.length} active policies with varying renewal dates. The portfolio includes General Liability, Commercial Auto, and Professional Liability policies. Would you like me to analyze policy performance by carrier, client segment, or renewal timeline?`;
      } else if (userView === 'agent') {
        return `As an agent, you can manage policies for your assigned clients. Based on the current selection, I can help you with policy renewals, coverage analysis, or client retention strategies. What specific policy management task can I assist you with?`;
      } else {
        return `I can help you with policy-related questions. Please specify which policy you'd like to discuss, or I can provide an overview of your current coverage options.`;
      }
    }

    if (lowerMessage.includes('claim') || lowerMessage.includes('claims')) {
      if (selectedClient) {
        const clientClaims = selectedClient.claims || 0;
        return `${selectedClient.name} currently has ${clientClaims} ${clientClaims === 1 ? 'claim' : 'claims'} on file. Based on their ${selectedClient.industry} industry classification and $${selectedClient.totalPremium.toLocaleString()} premium, their claims frequency is ${clientClaims > 2 ? 'above' : clientClaims > 0 ? 'at' : 'below'} industry average. Would you like me to analyze their claims history, risk factors, or impact on renewal pricing?`;
      } else {
        return `I can help you with claims management. The system shows various claims across different stages - from initial reporting to settlement. Would you like me to show claims by status, priority, or client? I can also analyze claims trends and their impact on profitability.`;
      }
    }

    if (lowerMessage.includes('quote') || lowerMessage.includes('quoting')) {
      if (selectedClient) {
        return `For ${selectedClient.name}, I can help optimize quoting strategies. Based on their ${selectedClient.industry} industry and current ${(selectedClient.churnRisk * 100).toFixed(1)}% churn risk, I recommend focusing on carriers with strong ${selectedClient.industry} expertise. Their average quote-to-policy conversion rate is estimated at ${selectedClient.churnRisk < 0.3 ? '85%' : selectedClient.churnRisk < 0.6 ? '72%' : '58%'}. Would you like me to suggest optimal carriers or pricing strategies?`;
      } else {
        return `Our AI-powered quoting engine analyzes ${carriers.length} carriers to find the best matches. Current portfolio metrics show a 76.3% conversion rate with an average turnaround time of 14.2 minutes. I can help you optimize quote performance, analyze carrier effectiveness, or improve conversion rates. What aspect of quoting would you like to focus on?`;
      }
    }

    if (lowerMessage.includes('analytics') || lowerMessage.includes('data') || lowerMessage.includes('performance')) {
      if (selectedClient) {
        return `Here's what the analytics show for ${selectedClient.name}: 
        
📊 **Key Metrics:**
• Churn Risk: ${(selectedClient.churnRisk * 100).toFixed(1)}% (${selectedClient.churnRisk < 0.3 ? 'Low' : selectedClient.churnRisk < 0.6 ? 'Medium' : 'High'} risk)
• Industry: ${selectedClient.industry} 
• Premium: $${selectedClient.totalPremium.toLocaleString()}
• Policies: ${selectedClient.policies}
• Commission Rate: ${selectedClient.commissionRate}%

🎯 **Recommendations:**
• Focus on ${selectedClient.industry}-specific coverage optimization
• Monitor renewal timeline (${Math.ceil((new Date(selectedClient.renewalDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
• Consider cross-selling opportunities based on industry needs

Would you like me to dive deeper into any specific metric or provide predictive insights?`;
      } else {
        return `I have access to comprehensive analytics across the entire platform. Key performance indicators show strong growth with 76.3% conversion rates and 94.2% retention. I can analyze performance by client, carrier, product line, or time period. What specific analytics would you like me to focus on?`;
      }
    }

    if (lowerMessage.includes('client') || lowerMessage.includes('customer')) {
      if (selectedClient) {
        return `${selectedClient.name} is a ${selectedClient.industry} company located at ${selectedClient.address}. Key contact: ${selectedClient.contact.email}. They have ${selectedClient.policies} policies with a total premium of $${selectedClient.totalPremium.toLocaleString()}. Their account shows ${selectedClient.churnRisk < 0.3 ? 'excellent' : selectedClient.churnRisk < 0.6 ? 'good' : 'concerning'} retention indicators. I can help with relationship management, renewal strategies, or growth opportunities for this client.`;
      } else if (userView === 'admin') {
        return `You have access to ${currentData.length} clients across various industries including Construction, Healthcare, Technology, and Automotive. I can help analyze client segments, identify growth opportunities, or assess portfolio risk. Which aspect of client management interests you most?`;
      } else {
        return `I can help you manage client relationships more effectively. Whether you need insights on retention, growth opportunities, or service optimization, I have access to comprehensive client data to support your decisions.`;
      }
    }

    if (lowerMessage.includes('carrier') || lowerMessage.includes('insurance company')) {
      return `Our platform integrates with ${carriers.length}+ carriers including major ones like Travelers, Progressive, Hartford, AIG, and Chubb. I can analyze carrier performance by win rate, response time, pricing competitiveness, and claims handling. Current top performers show win rates of 35-42% with response times under 15 minutes. Which carriers or metrics would you like me to analyze?`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      const capabilities = userView === 'admin' ? 
        'full platform management, analytics, client oversight, agent performance, and system administration' :
        userView === 'agent' ?
        'client management, quoting, policy administration, and performance tracking' :
        userView === 'csr' ?
        'customer support, document processing, and service coordination' :
        'policy management, claims, billing, and account oversight';

      return `I'm your AI assistant for InsureFlow! I can help you with ${capabilities}. 

🤖 **My Capabilities:**
• Analyze policies, claims, and client data
• Provide performance insights and recommendations  
• Help with quoting and carrier selection
• Explain analytics and metrics
• Assist with workflow optimization
• Answer questions about your insurance portfolio

I have full access to your data context and can provide personalized insights based on your role as ${currentUser.role}${selectedClient ? ` and your focus on ${selectedClient.name}` : ''}. What would you like to explore?`;
    }

    // Default contextual response
    const responses = [
      `As ${currentUser.role}, I can help you with ${selectedClient ? `${selectedClient.name} specifically` : 'your insurance management needs'}. What would you like to know about policies, claims, analytics, or client management?`,
      `I have access to all your insurance data and can provide insights on performance, risk assessment, or operational optimization. What specific area interests you?`,
      `I can analyze your ${selectedClient ? `${selectedClient.name} account` : 'portfolio'} and provide recommendations for growth, retention, or efficiency improvements. What would you like to explore?`,
      `Based on your ${userView} role${selectedClient ? ` and focus on ${selectedClient.name}` : ''}, I can help with strategic decisions, operational questions, or data analysis. How can I assist you today?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const notificationTypes = [
        { type: 'quote', icon: FileText, color: 'blue', message: 'New quote generated', client: 'Metro Construction' },
        { type: 'renewal', icon: RefreshCw, color: 'orange', message: 'Renewal reminder', client: 'Johnson Automotive' },
        { type: 'payment', icon: CreditCard, color: 'green', message: 'Payment received', client: 'Riverside Medical' },
        { type: 'document', icon: Upload, color: 'purple', message: 'Document uploaded', client: 'TechStart Industries' },
        { type: 'claim', icon: AlertTriangle, color: 'red', message: 'New claim filed', client: 'Metro Construction' },
        { type: 'claim_update', icon: FileWarning, color: 'yellow', message: 'Claim status updated', client: 'Johnson Automotive' },
        { type: 'alert', icon: AlertCircle, color: 'red', message: 'High churn risk detected', client: 'Pacific Shipping' }
      ];
      
      const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      addNotification(randomNotification);
    }, 15000 + Math.random() * 10000); // Random interval between 15-25 seconds

    return () => clearInterval(interval);
  }, []);

  const NotificationDropdown = () => (
    <div className={`absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
      showNotifications ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Notifications</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {realTimeNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Wifi className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No notifications yet</p>
          </div>
        ) : (
          realTimeNotifications.map(notification => (
            <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-${notification.color}-100`}>
                  <notification.icon className={`h-4 w-4 text-${notification.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.client}</p>
                  <p className="text-xs text-gray-400">{notification.timestamp}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Helper functions to get filtered data based on user role
  const getCurrentUserData = () => {
    switch(userView) {
      case 'admin':
        return {
          name: 'Admin User',
          role: 'Agency Administrator',
          permissions: ['full_access', 'user_management', 'billing', 'analytics'],
          avatar: 'A'
        };
      case 'agent':
        const currentAgent = selectedAgent || agentsData[0];
        return {
          name: currentAgent.name,
          role: currentAgent.role,
          permissions: ['quotes', 'policies', 'clients'],
          avatar: currentAgent.name.charAt(0),
          data: currentAgent
        };
      case 'csr':
        const currentCSR = csrData[0];
        return {
          name: currentCSR.name,
          role: currentCSR.role,
          permissions: ['documents', 'coi', 'endorsements'],
          avatar: currentCSR.name.charAt(0),
          data: currentCSR
        };
      case 'client':
        const currentClient = selectedClient || clientsData[0];
        return {
          name: currentClient.name,
          role: 'Commercial Client',
          permissions: ['view_policies', 'request_coi', 'payments'],
          avatar: currentClient.name.charAt(0),
          data: currentClient
        };
      default:
        return {
          name: 'Admin User',
          role: 'Agency Administrator',
          permissions: ['full_access'],
          avatar: 'A'
        };
    }
  };

  const getFilteredClients = () => {
    switch(userView) {
      case 'admin':
        return clientsData;
      case 'agent':
        const currentAgent = selectedAgent || agentsData[0];
        return clientsData.filter(client => currentAgent.clients.includes(client.id));
      case 'csr':
        const currentCSR = csrData[0];
        return clientsData.filter(client => currentCSR.clients.includes(client.id));
      case 'client':
        return selectedClient ? [selectedClient] : [clientsData[0]];
      default:
        return clientsData;
    }
  };

  const getUserData = getCurrentUserData;

  const calculateRoleBasedKPIs = () => {
    const filteredClients = getFilteredClients();
    const totalPremium = filteredClients.reduce((sum, client) => sum + client.totalPremium, 0);
    const avgChurnRisk = filteredClients.reduce((sum, client) => sum + client.churnRisk, 0) / filteredClients.length;
    const renewalsUpcoming = filteredClients.filter(client => {
      const renewalDate = new Date(client.renewalDate);
      const today = new Date();
      const daysUntilRenewal = (renewalDate - today) / (1000 * 60 * 60 * 24);
      return daysUntilRenewal <= 90;
    }).length;
    
    // Calculate claims data
    const totalClaims = filteredClients.reduce((sum, client) => sum + (client.claims || 0), 0);
    const openClaims = Math.floor(totalClaims * 0.3); // 30% of claims are typically open

    switch(userView) {
      case 'admin':
        return {
          totalPremium: clientsData.reduce((sum, client) => sum + client.totalPremium, 0),
          totalClients: clientsData.length,
          totalAgents: agentsData.length,
          totalCSRs: csrData.length,
          avgChurnRisk: (avgChurnRisk * 100).toFixed(1),
          renewalsUpcoming: renewalsUpcoming,
          activeQuotes: agentsData.reduce((sum, agent) => sum + agent.quotesActive, 0),
          boundPolicies: clientsData.reduce((sum, client) => sum + client.policies, 0),
          totalClaims: clientsData.reduce((sum, client) => sum + (client.claims || 0), 0),
          openClaims: openClaims
        };
      case 'agent':
        const currentAgent = selectedAgent || agentsData[0];
        return {
          totalPremium: currentAgent.totalPremium,
          commission: currentAgent.commissionEarned,
          myClients: currentAgent.clients.length,
          quotesToBound: currentAgent.performance.quotesToBound,
          retention: currentAgent.performance.retention,
          growth: currentAgent.performance.growth,
          activeQuotes: currentAgent.quotesActive,
          renewalsUpcoming: currentAgent.renewalsUpcoming,
          boundPolicies: filteredClients.reduce((sum, client) => sum + client.policies, 0),
          myClaims: Math.floor(currentAgent.clients.length * 0.8) // Avg claims per agent
        };
      case 'csr':
        const currentCSR = csrData[0];
        return {
          clientsSupported: currentCSR.clients.length,
          documentsProcessed: currentCSR.documentsProcessed,
          coiGenerated: currentCSR.coiGenerated,
          ticketsResolved: currentCSR.ticketsResolved,
          avgResponseTime: currentCSR.avgResponseTime,
          satisfaction: currentCSR.satisfaction,
          activeTickets: 12,
          pendingDocs: 8,
          claimsSupported: 15 // Claims handled by CSR
        };
      case 'client':
        return {
          activePolicies: filteredClients.reduce((sum, client) => sum + client.policies, 0),
          totalPremium: totalPremium,
          nextRenewal: filteredClients[0]?.renewalDate,
          churnRisk: (avgChurnRisk * 100).toFixed(1),
          openClaims: 1,
          lastActivity: filteredClients[0]?.lastActivity
        };
      default:
        return {};
    }
  };

  // Role-based navigation menu
  const getNavigationItems = () => {
    const kpiData = calculateRoleBasedKPIs();
    
    switch(userView) {
      case 'admin':
        return [
          { id: 'dashboard', icon: BarChart3, label: 'Dashboard', badge: null },
          { id: 'quotes', icon: FileText, label: 'Quote Engine', badge: kpiData.activeQuotes },
          { id: 'policies', icon: Shield, label: 'Policies', badge: kpiData.boundPolicies },
          { id: 'claims', icon: AlertTriangle, label: 'Claims Management', badge: kpiData.totalClaims },
          { id: 'renewals', icon: RefreshCw, label: 'Renewals', badge: kpiData.renewalsUpcoming },
          { id: 'documents', icon: Upload, label: 'Document Vault', badge: null },
          { id: 'billing', icon: DollarSign, label: 'Billing & Payments', badge: null },
          { id: 'analytics', icon: TrendingUp, label: 'AI Analytics', badge: null },
          { id: 'chat', icon: MessageCircle, label: 'AI Assistant', badge: null },
          { id: 'clients', icon: Users, label: 'Client Management', badge: kpiData.totalClients },
          { id: 'agents', icon: UserCheck, label: 'Agent Management', badge: kpiData.totalAgents },
          { id: 'workflows', icon: Workflow, label: 'Automation', badge: null },
          { id: 'settings', icon: Settings, label: 'System Settings', badge: null }
        ];
      case 'agent':
        return [
          { id: 'dashboard', icon: BarChart3, label: 'My Dashboard', badge: null },
          { id: 'quotes', icon: FileText, label: 'Quote Engine', badge: kpiData.activeQuotes },
          { id: 'policies', icon: Shield, label: 'My Policies', badge: kpiData.boundPolicies },
          { id: 'claims', icon: AlertTriangle, label: 'My Claims', badge: kpiData.myClaims },
          { id: 'renewals', icon: RefreshCw, label: 'Renewals', badge: kpiData.renewalsUpcoming },
          { id: 'clients', icon: Users, label: 'My Clients', badge: kpiData.myClients },
          { id: 'analytics', icon: TrendingUp, label: 'Performance', badge: null },
          { id: 'chat', icon: MessageCircle, label: 'AI Assistant', badge: null },
          { id: 'documents', icon: Upload, label: 'Documents', badge: null }
        ];
      case 'csr':
        return [
          { id: 'dashboard', icon: BarChart3, label: 'Service Dashboard', badge: null },
          { id: 'documents', icon: Upload, label: 'Document Processing', badge: kpiData.pendingDocs },
          { id: 'policies', icon: Shield, label: 'Policy Services', badge: null },
          { id: 'claims', icon: AlertTriangle, label: 'Claims Support', badge: kpiData.claimsSupported },
          { id: 'renewals', icon: RefreshCw, label: 'Renewal Support', badge: null },
          { id: 'clients', icon: Users, label: 'Client Support', badge: kpiData.clientsSupported },
          { id: 'billing', icon: DollarSign, label: 'Billing Support', badge: null },
          { id: 'chat', icon: MessageCircle, label: 'AI Assistant', badge: null }
        ];
      case 'client':
        return [
          { id: 'dashboard', icon: BarChart3, label: 'My Account', badge: null },
          { id: 'policies', icon: Shield, label: 'My Policies', badge: kpiData.activePolicies },
          { id: 'documents', icon: Upload, label: 'My Documents', badge: null },
          { id: 'billing', icon: DollarSign, label: 'Billing & Payments', badge: null },
          { id: 'renewals', icon: RefreshCw, label: 'Renewals', badge: null },
          { id: 'claims', icon: AlertTriangle, label: 'Claims', badge: kpiData.openClaims },
          { id: 'chat', icon: MessageCircle, label: 'AI Assistant', badge: null }
        ];
      default:
        return [];
    }
  };

  // Client/Agent Selector Components
  const ClientAgentSelector = () => {
    if (userView === 'client') return null;
    
    return (
      <div className="flex items-center space-x-2">
        {userView === 'admin' && (
          <div className="flex items-center space-x-1">
            <label className="text-xs font-medium text-gray-700 hidden lg:block">Agent:</label>
            <select 
              value={selectedAgent?.id || ''}
              onChange={(e) => {
                const agent = agentsData.find(a => a.id === e.target.value);
                setSelectedAgent(agent);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 min-w-0"
            >
              <option value="">All Agents</option>
              {agentsData.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>
        )}
        
        {(userView === 'admin' || userView === 'agent' || userView === 'csr') && (
          <div className="flex items-center space-x-1">
            <label className="text-xs font-medium text-gray-700 hidden lg:block">Client:</label>
            <select 
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = clientsData.find(c => c.id === e.target.value);
                setSelectedClient(client);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 min-w-0"
            >
              <option value="">
                {userView === 'admin' ? 'All Clients' : 
                 userView === 'agent' ? 'My Clients' : 'Supported Clients'}
              </option>
              {getFilteredClients().map(client => (
                <option key={client.id} value={client.id}>{client.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  const ClientInfoCard = () => {
    if (!selectedClient || userView === 'client') return null;
    
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedClient.name}</h3>
              <p className="text-sm text-gray-600">{selectedClient.industry} • {selectedClient.status}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">${selectedClient.totalPremium.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{selectedClient.policies} policies</p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Agent: {selectedClient.assignedAgent}</span>
            <span className="text-gray-600">CSR: {selectedClient.assignedCSR}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Churn Risk:</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  selectedClient.churnRisk > 0.6 ? 'bg-red-500' : 
                  selectedClient.churnRisk > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${selectedClient.churnRisk * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{(selectedClient.churnRisk * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const recentActivities = [
    { id: 1, type: 'quote', action: 'Auto quote generated for Johnson LLC', time: '2 mins ago', status: 'success', carrier: 'Progressive' },
    { id: 2, type: 'renewal', action: 'High churn risk detected for Policy #12345', time: '5 mins ago', status: 'warning', carrier: 'Travelers' },
    { id: 3, type: 'coi', action: 'COI batch generated for Metro Construction', time: '8 mins ago', status: 'success', carrier: 'AIG' },
    { id: 4, type: 'payment', action: 'Payment processed for $4,500', time: '12 mins ago', status: 'success', carrier: 'Hartford' },
    { id: 5, type: 'document', action: 'ACORD 125 processed via AI intake', time: '15 mins ago', status: 'success', carrier: 'Travelers' },
    { id: 6, type: 'bind', action: 'Policy bound for TechStart Industries', time: '18 mins ago', status: 'success', carrier: 'AIG' },
    { id: 7, type: 'endorsement', action: 'Vehicle added to existing policy', time: '22 mins ago', status: 'success', carrier: 'Progressive' },
    { id: 8, type: 'renewal', action: 'Renewal quote sent to Riverside Medical', time: '25 mins ago', status: 'success', carrier: 'AIG' }
  ];

  const policies = [
    {
      id: 'POL-2024-001',
      client: 'Metro Construction LLC',
      type: 'General Liability',
      carrier: 'Travelers',
      premium: 15420,
      renewal: '2024-12-15',
      status: 'Active',
      churnScore: 0.23,
      lastActivity: '2024-07-28',
      commission: 2313,
      limits: '$1M/$2M',
      deductible: '$2,500'
    },
    {
      id: 'POL-2024-002', 
      client: 'Johnson Automotive',
      type: 'Commercial Auto',
      carrier: 'Progressive',
      premium: 8950,
      renewal: '2024-11-30',
      status: 'Active',
      churnScore: 0.67,
      lastActivity: '2024-07-25',
      commission: 1342,
      limits: '$1M CSL',
      deductible: '$1,000'
    },
    {
      id: 'POL-2024-003',
      client: 'Riverside Medical',
      type: 'Professional Liability',
      carrier: 'AIG',
      premium: 22100,
      renewal: '2024-10-10',
      status: 'Renewal Required',
      churnScore: 0.45,
      lastActivity: '2024-07-29',
      commission: 3315,
      limits: '$2M/$4M',
      deductible: '$5,000'
    }
  ];

  const quotes = [
    {
      id: 'QTE-2024-078',
      client: 'TechStart Industries',
      type: 'Cyber Liability',
      carriers: [
        { name: 'AIG', premium: 4850, score: 0.92, fees: 125, commission: 15 },
        { name: 'Chubb', premium: 5200, score: 0.88, fees: 150, commission: 18 },
        { name: 'Travelers', premium: 4950, score: 0.85, fees: 100, commission: 16 }
      ],
      status: 'Ready to Bind',
      created: '2024-07-30',
      expires: '2024-08-15',
      aiConfidence: 0.94
    }
  ];

  const handleQuoteGeneration = () => {
    setQuotesLoading(true);
    
    setTimeout(() => {
      setQuotesLoading(false);
    }, 3000);
  };

  const handleCarrierSelection = (carrier) => {
    if (selectedCarriers.includes(carrier)) {
      setSelectedCarriers(selectedCarriers.filter(c => c !== carrier));
    } else {
      setSelectedCarriers([...selectedCarriers, carrier]);
    }
  };

  const handleBindPolicy = (quoteId, carrierName = null) => {
    if (carrierName) {
      setTimeout(() => {
        alert(`Policy bound with ${carrierName}!`);
      }, 2000);
    } else {
      setShowCarrierModal(true);
    }
  };

  const CarrierSelectionModal = () => (
    showCarrierModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Select Carriers to Quote</h3>
            <button 
              onClick={() => setShowCarrierModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center space-x-4">
              <Search className="h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search carriers..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => setSelectedCarriers(carriers)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Select All
              </button>
              <button 
                onClick={() => setSelectedCarriers([])}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Clear All
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedCarriers.length} of {carriers.length} carriers selected
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            {carriers.map((carrier, idx) => (
              <button
                key={idx}
                onClick={() => handleCarrierSelection(carrier)}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  selectedCarriers.includes(carrier)
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-medium text-sm">{carrier}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              AI will analyze {selectedCarriers.length} carriers and return the best matches
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowCarrierModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowCarrierModal(false);
                  handleQuoteGeneration();
                }}
                disabled={selectedCarriers.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Generate Quotes ({selectedCarriers.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const ViewSelector = () => (
    <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
      {[
        { id: 'admin', label: 'Admin', icon: Settings },
        { id: 'agent', label: 'Agent', icon: User },
        { id: 'csr', label: 'CSR', icon: Users },
        { id: 'client', label: 'Client', icon: Building }
      ].map(view => (
        <button
          key={view.id}
          onClick={() => setUserView(view.id)}
          className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
            userView === view.id 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <view.icon className="h-3 w-3" />
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );

  const DeviceSelector = () => (
    <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
      {[
        { id: 'desktop', icon: Monitor },
        { id: 'tablet', icon: Tablet },
        { id: 'mobile', icon: Smartphone }
      ].map(device => (
        <button
          key={device.id}
          onClick={() => setDeviceView(device.id)}
          className={`p-1.5 rounded-md transition-all ${
            deviceView === device.id 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <device.icon className="h-3 w-3" />
        </button>
      ))}
    </div>
  );

  const QuotingEngine = () => {
    const contextualQuotes = selectedClient ? 
      quotes.filter(quote => quote.client === selectedClient.name).concat([
        {
          id: `QTE-${selectedClient.id}-NEW`,
          client: selectedClient.name,
          type: selectedClient.policyTypes[0] || 'General Liability',
          status: 'Ready to Quote',
          aiConfidence: 0.92,
          expires: '7 days',
          carriers: [
            { name: 'Travelers', premium: 15420, fees: 250, commission: 15, score: 0.94 },
            { name: 'AIG', premium: 16890, fees: 300, commission: 18, score: 0.89 },
            { name: 'Progressive', premium: 14200, fees: 200, commission: 12, score: 0.85 }
          ]
        }
      ]) : quotes;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Quote Engine</h2>
            <p className="text-gray-600">
              {selectedClient ? `Smart quoting for ${selectedClient.name} • ${selectedClient.industry}` : 
               selectedAgent && userView === 'admin' ? `${selectedAgent.name}'s quote pipeline • ${selectedAgent.quotesActive} active` :
               `Intelligent carrier matching across ${carriers.length} carriers`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowCarrierModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Building className="h-4 w-4" />
              <span>Select Carriers</span>
            </button>
            <button 
              onClick={handleQuoteGeneration}
              disabled={quotesLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {quotesLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{quotesLoading ? 'Generating...' : selectedClient ? `Quote ${selectedClient.name}` : 'New Quote'}</span>
            </button>
            {selectedClient && (
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Brain className="h-4 w-4" />
                <span>AI Risk Analysis</span>
              </button>
            )}
          </div>
        </div>

        {selectedClient && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-3 rounded-xl">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.name}</h3>
                  <p className="text-gray-600">{selectedClient.industry} • {selectedClient.type}</p>
                  <p className="text-sm text-gray-500">{selectedClient.address}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedClient.churnRisk < 0.3 ? 'bg-green-500' : 
                    selectedClient.churnRisk < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-lg font-bold text-gray-900">
                    Risk Score: {(selectedClient.churnRisk * 100).toFixed(0)}/100
                  </span>
                </div>
                <div className="text-sm text-gray-600">Current Premium: ${selectedClient.totalPremium.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{selectedClient.policies} existing policies</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Coverage</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedClient.policyTypes.slice(0, 2).map((type, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {type}
                    </span>
                  ))}
                  {selectedClient.policyTypes.length > 2 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      +{selectedClient.policyTypes.length - 2} more
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Team</span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="text-sm text-gray-900">Agent: {selectedClient.assignedAgent}</div>
                  <div className="text-sm text-gray-900">CSR: {selectedClient.assignedCSR}</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Renewal</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-900">{selectedClient.renewalDate}</div>
                  <div className="text-xs text-gray-500">
                    {Math.ceil((new Date(selectedClient.renewalDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Commission</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-900">{selectedClient.commissionRate}%</div>
                  <div className="text-xs text-gray-500">
                    ${(selectedClient.totalPremium * selectedClient.commissionRate / 100).toLocaleString()} potential
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {contextualQuotes.map(quote => (
            <div key={quote.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{quote.client}</h4>
                  <p className="text-gray-600">{quote.type} • {quote.id}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Brain className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">AI Confidence: {(quote.aiConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Expires {quote.expires}</span>
                    </div>
                    {selectedClient && (
                      <div className="flex items-center space-x-1">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Personalized for {selectedClient.industry}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    quote.status === 'Ready to Bind' ? 'bg-green-100 text-green-800' :
                    quote.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                    quote.status === 'Ready to Quote' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {quote.carriers.map((carrier, idx) => (
                  <div key={idx} className={`p-6 rounded-xl border-2 relative transition-all hover:shadow-lg ${
                    idx === 0 ? 'border-blue-500 bg-blue-50 transform scale-105' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                    {idx === 0 && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          AI RECOMMENDED
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-lg font-bold text-gray-900">{carrier.name}</h5>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{(carrier.score * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Annual Premium:</span>
                        <span className="text-xl font-bold text-gray-900">${carrier.premium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Fees:</span>
                        <span className="font-medium text-gray-700">${carrier.fees}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-medium text-green-600">{carrier.commission}%</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total:</span>
                          <span className="text-xl font-bold text-blue-600">
                            ${(carrier.premium + carrier.fees).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {selectedClient && (
                        <div className="pt-2 border-t border-green-200 bg-green-50 -mx-2 px-2 py-2 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-sm">Your Commission:</span>
                            <span className="text-lg font-bold text-green-600">
                              ${Math.round(carrier.premium * carrier.commission / 100).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            idx === 0 ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}
                          style={{ width: `${carrier.score * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">Match Score: {(carrier.score * 100).toFixed(1)}%</p>
                    </div>

                    <button 
                      onClick={() => handleBindPolicy(quote.id, carrier.name)}
                      className={`w-full mt-4 px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                        idx === 0 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-lg' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {idx === 0 ? '🎯 Bind Best Match' : `Bind with ${carrier.name}`}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-4 w-4" />
                    <span>AI analyzed {carriers.length} carriers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Timer className="h-4 w-4" />
                    <span>Generated in {selectedClient ? '5.2' : '8.3'} seconds</span>
                  </div>
                  {selectedClient && (
                    <div className="flex items-center space-x-1">
                      <PieChart className="h-4 w-4" />
                      <span>Risk-adjusted pricing</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                    Compare Details
                  </button>
                  <button className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors">
                    Download Proposal
                  </button>
                  <button 
                    onClick={() => handleBindPolicy(quote.id)}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 font-medium transform hover:scale-105 transition-all shadow-lg"
                  >
                    🚀 Bind Best Quote
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {quotesLoading && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 text-blue-600 mb-4">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="text-xl font-bold">
                  {selectedClient ? `AI analyzing ${selectedClient.name}'s risk profile...` : 'AI is analyzing carriers...'}
                </span>
              </div>
              <p className="text-gray-600 mb-6">
                {selectedClient ? 
                  `Processing personalized quotes for ${selectedClient.industry} industry` :
                  `Processing ${selectedCarriers.length || 'selected'} carriers for optimal quotes`
                }
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{selectedClient ? 'Client risk assessment' : 'Carrier authentication'}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{selectedClient ? 'Industry-specific analysis' : 'Risk assessment'}</span>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Quote generation</span>
                  <CircleDot className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>AI optimization</span>
                  <CircleDot className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Dashboard = () => {
    const kpiData = calculateRoleBasedKPIs();
    
    const renderKPICards = () => {
      switch(userView) {
        case 'admin':
          return (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Premium</p>
                    <p className="text-3xl font-bold">${(kpiData.totalPremium / 1000000).toFixed(1)}M</p>
                    <p className="text-blue-100 text-sm">{kpiData.totalClients} clients</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Agents</p>
                    <p className="text-3xl font-bold">{kpiData.totalAgents}</p>
                    <p className="text-green-100 text-sm">{kpiData.totalCSRs} CSRs</p>
                  </div>
                  <Users className="h-12 w-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Active Quotes</p>
                    <p className="text-3xl font-bold">{kpiData.activeQuotes}</p>
                    <p className="text-purple-100 text-sm">Across all agents</p>
                  </div>
                  <FileText className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Renewals Due</p>
                    <p className="text-3xl font-bold">{kpiData.renewalsUpcoming}</p>
                    <p className="text-orange-100 text-sm">Next 90 days</p>
                  </div>
                  <Calendar className="h-12 w-12 text-orange-200" />
                </div>
              </div>
            </>
          );
        case 'agent':
          return (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">My Premium</p>
                    <p className="text-3xl font-bold">${(kpiData.totalPremium / 1000).toFixed(0)}K</p>
                    <p className="text-blue-100 text-sm">+{kpiData.growth}% growth</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Commission</p>
                    <p className="text-3xl font-bold">${(kpiData.commission / 1000).toFixed(0)}K</p>
                    <p className="text-green-100 text-sm">This month</p>
                  </div>
                  <Coins className="h-12 w-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">My Clients</p>
                    <p className="text-3xl font-bold">{kpiData.myClients}</p>
                    <p className="text-purple-100 text-sm">{kpiData.retention}% retention</p>
                  </div>
                  <Users className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Quote Rate</p>
                    <p className="text-3xl font-bold">{kpiData.quotesToBound}%</p>
                    <p className="text-orange-100 text-sm">Conversion rate</p>
                  </div>
                  <Target className="h-12 w-12 text-orange-200" />
                </div>
              </div>
            </>
          );
        case 'csr':
          return (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Clients Supported</p>
                    <p className="text-3xl font-bold">{kpiData.clientsSupported}</p>
                    <p className="text-blue-100 text-sm">Active accounts</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Documents Processed</p>
                    <p className="text-3xl font-bold">{kpiData.documentsProcessed}</p>
                    <p className="text-green-100 text-sm">This month</p>
                  </div>
                  <FileText className="h-12 w-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">COIs Generated</p>
                    <p className="text-3xl font-bold">{kpiData.coiGenerated}</p>
                    <p className="text-purple-100 text-sm">Certificates issued</p>
                  </div>
                  <Shield className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Satisfaction</p>
                    <p className="text-3xl font-bold">{kpiData.satisfaction}</p>
                    <p className="text-orange-100 text-sm">Client rating</p>
                  </div>
                  <Star className="h-12 w-12 text-orange-200" />
                </div>
              </div>
            </>
          );
        case 'client':
          return (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Active Policies</p>
                    <p className="text-3xl font-bold">{kpiData.activePolicies}</p>
                    <p className="text-blue-100 text-sm">Current coverage</p>
                  </div>
                  <Shield className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Annual Premium</p>
                    <p className="text-3xl font-bold">${(kpiData.totalPremium / 1000).toFixed(0)}K</p>
                    <p className="text-green-100 text-sm">Total investment</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Next Renewal</p>
                    <p className="text-3xl font-bold">{kpiData.nextRenewal ? new Date(kpiData.nextRenewal).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-purple-100 text-sm">Upcoming date</p>
                  </div>
                  <Calendar className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Open Claims</p>
                    <p className="text-3xl font-bold">{kpiData.openClaims}</p>
                    <p className="text-orange-100 text-sm">In progress</p>
                  </div>
                  <AlertTriangle className="h-12 w-12 text-orange-200" />
                </div>
              </div>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {userView === 'admin' ? 'Agency Overview' :
               userView === 'agent' ? 'My Dashboard' :
               userView === 'csr' ? 'Service Dashboard' :
               'My Account'}
            </h2>
            <p className="text-gray-600">
              {selectedClient ? `Viewing: ${selectedClient.name}` :
               selectedAgent ? `Agent: ${selectedAgent.name}` :
               userView === 'admin' ? 'Complete agency performance metrics' :
               userView === 'agent' ? 'Your personal performance and client portfolio' :
               userView === 'csr' ? 'Client support and document processing metrics' :
               'Your policy and account information'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderKPICards()}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {selectedClient ? `${selectedClient.name} Activity` : 'Recent Activity'}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {(selectedClient ? [
              { 
                id: 1, 
                type: 'quote', 
                action: `Quote generated for ${selectedClient.name}`, 
                time: '2 mins ago', 
                status: 'success', 
                carrier: 'Progressive' 
              },
              { 
                id: 2, 
                type: 'coi', 
                action: `COI issued for ${selectedClient.name}`, 
                time: '15 mins ago', 
                status: 'success', 
                carrier: 'AIG' 
              },
              { 
                id: 3, 
                type: 'payment', 
                action: `Payment processed: $${selectedClient.totalPremium.toLocaleString()}`, 
                time: '1 hour ago', 
                status: 'success', 
                carrier: selectedClient.assignedAgent 
              },
              { 
                id: 4, 
                type: 'document', 
                action: `Policy documents updated`, 
                time: '2 hours ago', 
                status: 'success', 
                carrier: selectedClient.assignedCSR 
              }
            ] : recentActivities).map(activity => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-100' : 
                  activity.status === 'warning' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {activity.type === 'quote' && <FileText className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'renewal' && <RefreshCw className="h-4 w-4 text-orange-600" />}
                  {activity.type === 'coi' && <Shield className="h-4 w-4 text-green-600" />}
                  {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-600" />}
                  {activity.type === 'document' && <Upload className="h-4 w-4 text-purple-600" />}
                  {activity.type === 'bind' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {activity.type === 'endorsement' && <Edit3 className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.action}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{activity.time}</span>
                    {activity.carrier && (
                      <>
                        <span>•</span>
                        <span>{activity.carrier}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {selectedClient ? `${selectedClient.name} Actions` : 'Quick Actions'}
          </h3>
          
          <div className="space-y-4">
            {selectedClient ? (
              <>
                <button 
                  onClick={() => setActiveTab('quotes')}
                  className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all group"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">New Quote</p>
                    <p className="text-sm text-gray-600">Generate for {selectedClient.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>

                <button 
                  onClick={() => setActiveTab('documents')}
                  className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all group"
                >
                  <div className="bg-gradient-to-r from-green-500 to-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Generate COI</p>
                    <p className="text-sm text-gray-600">Certificate for {selectedClient.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>

                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all group">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Contact Client</p>
                    <p className="text-sm text-gray-600">{selectedClient.contact.email}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>

                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-lg transition-all group">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Schedule Renewal</p>
                    <p className="text-sm text-gray-600">Due: {selectedClient.renewalDate}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Industry:</span>
                      <span className="font-medium">{selectedClient.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Agent:</span>
                      <span className="font-medium">{selectedClient.assignedAgent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CSR:</span>
                      <span className="font-medium">{selectedClient.assignedCSR}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-medium">{selectedClient.contact.phone}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setActiveTab('quotes')}
                  className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all group"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">New Quote</p>
                    <p className="text-sm text-gray-600">AI-powered intake</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>

                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all group">
                  <div className="bg-gradient-to-r from-green-500 to-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Generate COIs</p>
                    <p className="text-sm text-gray-600">Bulk certificate factory</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>

                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all group">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">AI Analysis</p>
                    <p className="text-sm text-gray-600">Risk & churn insights</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>

                <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-lg transition-all group">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Renewal Queue</p>
                    <p className="text-sm text-gray-600">{calculateRoleBasedKPIs().renewalsUpcoming} upcoming</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Premium Growth</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {[65, 78, 82, 88, 92, 85, 95, 100, 88, 92, 96, 100].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Policy Distribution</h3>
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{calculateRoleBasedKPIs().boundPolicies}</p>
                    <p className="text-gray-600">Active Policies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Commercial Auto (40%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>General Liability (35%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span>Property (25%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  const RenewalsManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Renewal Management</h2>
          <p className="text-gray-600">AI-powered renewal orchestration and retention analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Calendar className="h-4 w-4" />
            <span>Schedule Review</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Send className="h-4 w-4" />
            <span>Bulk Renewals</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">30-Day Pipeline</p>
              <p className="text-3xl font-bold">23</p>
              <p className="text-green-100 text-sm">$485K premium</p>
            </div>
            <Calendar className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">60-Day Pipeline</p>
              <p className="text-3xl font-bold">47</p>
              <p className="text-yellow-100 text-sm">$892K premium</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">At Risk</p>
              <p className="text-3xl font-bold">12</p>
              <p className="text-red-100 text-sm">High churn probability</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Renewal Queue</h3>
        <div className="space-y-4">
          {[
            { client: 'Metro Construction', policy: 'GL-2024-001', renewal: '2024-08-15', premium: 15420, risk: 'low' },
            { client: 'Johnson Automotive', policy: 'CA-2024-002', renewal: '2024-08-22', premium: 8950, risk: 'high' },
            { client: 'Riverside Medical', policy: 'PL-2024-003', renewal: '2024-09-01', premium: 22100, risk: 'medium' }
          ].map((renewal, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  renewal.risk === 'low' ? 'bg-green-500' : 
                  renewal.risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="font-semibold text-gray-900">{renewal.client}</p>
                  <p className="text-sm text-gray-600">{renewal.policy} • ${renewal.premium.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium text-gray-900">{renewal.renewal}</p>
                  <p className="text-xs text-gray-500">{Math.ceil((new Date(renewal.renewal) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DocumentVault = () => {
    const clientDocuments = selectedClient ? [
      {
        id: 'DOC-001',
        name: `ACORD 125 - ${selectedClient.name}.pdf`,
        type: 'ACORD Form',
        category: 'Policy Documents',
        status: 'Processed',
        uploadDate: '2024-07-31',
        size: '2.4 MB',
        aiExtracted: true,
        tags: ['General Liability', 'Current'],
        lastModified: '2 hours ago',
        client: selectedClient.name
      },
      {
        id: 'DOC-002', 
        name: `Certificate of Insurance - ${selectedClient.name}.pdf`,
        type: 'COI',
        category: 'Certificates',
        status: 'Generated',
        uploadDate: '2024-07-30',
        size: '1.8 MB',
        aiExtracted: true,
        tags: ['Active', 'Auto-Generated'],
        lastModified: '1 day ago',
        client: selectedClient.name
      },
      {
        id: 'DOC-003',
        name: `Policy Endorsement - ${selectedClient.name}.pdf`,
        type: 'Endorsement',
        category: 'Policy Changes',
        status: 'Processing',
        uploadDate: '2024-07-31',
        size: '980 KB',
        aiExtracted: false,
        tags: ['Pending Review'],
        lastModified: '30 mins ago',
        client: selectedClient.name
      },
      {
        id: 'DOC-004',
        name: `Risk Assessment - ${selectedClient.name}.docx`,
        type: 'Risk Report',
        category: 'Underwriting',
        status: 'Completed',
        uploadDate: '2024-07-29',
        size: '1.2 MB',
        aiExtracted: true,
        tags: ['Industry Analysis', selectedClient.industry],
        lastModified: '2 days ago',
        client: selectedClient.name
      }
    ] : [
      { id: 'DOC-001', name: 'ACORD 125 - Metro Construction.pdf', type: 'ACORD Form', category: 'Policy Documents', status: 'Processed', uploadDate: '2024-07-31', size: '2.4 MB', aiExtracted: true, tags: ['General Liability'], lastModified: '2 mins ago', client: 'Metro Construction' },
      { id: 'DOC-002', name: 'Policy Document - Johnson Auto.pdf', type: 'Policy', category: 'Policy Documents', status: 'Processing', uploadDate: '2024-07-31', size: '3.1 MB', aiExtracted: false, tags: ['Commercial Auto'], lastModified: '5 mins ago', client: 'Johnson Automotive' },
      { id: 'DOC-003', name: 'Certificate Request - Riverside.docx', type: 'COI Request', category: 'Certificates', status: 'Completed', uploadDate: '2024-07-31', size: '1.5 MB', aiExtracted: true, tags: ['Healthcare'], lastModified: '8 mins ago', client: 'Riverside Medical' }
    ];

    const filteredDocuments = documentFilter === 'all' ? clientDocuments : clientDocuments.filter(doc => {
      if (documentFilter === 'processed') return doc.status === 'Processed' || doc.status === 'Completed';
      if (documentFilter === 'processing') return doc.status === 'Processing';
      if (documentFilter === 'certificates') return doc.type === 'COI' || doc.category === 'Certificates';
      return true;
    });

    const sortedDocuments = [...filteredDocuments].sort((a, b) => {
      const dateA = new Date(a.uploadDate);
      const dateB = new Date(b.uploadDate);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Vault</h2>
            <p className="text-gray-600">
              {selectedClient ? `Document management for ${selectedClient.name} • ${selectedClient.industry}` : 
               selectedAgent && userView === 'admin' ? `${selectedAgent.name}'s document processing pipeline` :
               'AI-powered document processing and certificate factory'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={documentFilter}
                onChange={(e) => setDocumentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Documents</option>
                <option value="processed">Processed</option>
                <option value="processing">Processing</option>
                <option value="certificates">Certificates</option>
              </select>
            </div>
            <button 
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
              <span className="text-sm">Date</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="h-4 w-4" />
              <span>{selectedClient ? `Upload for ${selectedClient.name}` : 'Upload Documents'}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Shield className="h-4 w-4" />
              <span>{selectedClient ? `Generate COI` : 'Generate COIs'}</span>
            </button>
          </div>
        </div>

        {selectedClient && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-3 rounded-xl">
                  <FolderOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.name} Documents</h3>
                  <p className="text-gray-600">{clientDocuments.length} documents • {selectedClient.industry}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {clientDocuments.filter(d => d.aiExtracted).length}/{clientDocuments.length} AI Processed
                </div>
                <div className="text-sm text-gray-600">
                  Last updated: {clientDocuments[0]?.lastModified}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Policy Documents</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {clientDocuments.filter(d => d.category === 'Policy Documents').length}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Certificates</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {clientDocuments.filter(d => d.category === 'Certificates').length}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">AI Processed</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round((clientDocuments.filter(d => d.aiExtracted).length / clientDocuments.length) * 100)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Storage Used</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(clientDocuments.reduce((sum, d) => sum + parseFloat(d.size), 0)).toFixed(1)} MB
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedClient ? `${selectedClient.name} Documents` : 'Document Library'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{sortedDocuments.length} documents</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">Live Sync</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {sortedDocuments.map((doc) => (
                  <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${
                          doc.type === 'COI' ? 'bg-green-100' :
                          doc.type === 'ACORD Form' ? 'bg-blue-100' :
                          doc.type === 'Policy' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {doc.type === 'COI' ? <Shield className="h-6 w-6 text-green-600" /> :
                           doc.type === 'ACORD Form' ? <FileText className="h-6 w-6 text-blue-600" /> :
                           doc.type === 'Policy' ? <FileCheck className="h-6 w-6 text-purple-600" /> :
                           <FileX className="h-6 w-6 text-gray-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{doc.type} • {doc.size}</span>
                            <span className="text-sm text-gray-500">{doc.lastModified}</span>
                            {!selectedClient && (
                              <span className="text-sm text-blue-600">{doc.client}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {doc.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            doc.status === 'Completed' || doc.status === 'Generated' ? 'bg-green-100 text-green-800' :
                            doc.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                            doc.status === 'Processed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.status}
                          </span>
                          {doc.aiExtracted && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Brain className="h-3 w-3 text-purple-500" />
                              <span className="text-xs text-purple-600">AI Processed</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Download">
                            <Download className="h-4 w-4 text-green-600" />
                          </button>
                          <button className="p-2 hover:bg-purple-100 rounded-lg transition-colors" title="Share">
                            <Send className="h-4 w-4 text-purple-600" />
                          </button>
                          <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors" title="Edit">
                            <FileEdit className="h-4 w-4 text-orange-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Document Intelligence</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Smart Extraction</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {selectedClient ? 
                      `Auto-extract ${selectedClient.industry}-specific policy details and risk factors` :
                      'Automatically extract policy details, limits, and deductibles'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Validation</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {selectedClient ?
                      `Validate against ${selectedClient.name}'s existing policies for consistency` :
                      'AI validates document accuracy and flags inconsistencies'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Layers className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Smart Filing</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Automatically categorize and file documents by type and client
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all">
                  <FilePlus className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {selectedClient ? `Upload for ${selectedClient.name}` : 'Upload Documents'}
                  </span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Generate COI</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all">
                  <Cloud className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Bulk Process</span>
                </button>

                {selectedClient && (
                  <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-lg transition-all">
                    <Bookmark className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-900">Archive Client Docs</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BillingPayments = () => {
    const clientBillingData = selectedClient ? [
      {
        id: 'INV-001',
        client: selectedClient.name,
        amount: selectedClient.totalPremium,
        type: 'Annual Premium',
        status: 'Completed',
        date: '2024-07-30',
        dueDate: '2024-08-15',
        commission: selectedClient.totalPremium * selectedClient.commissionRate / 100,
        invoiceNumber: `INV-${selectedClient.id}-2024-001`,
        paymentMethod: 'ACH Transfer',
        description: `Premium payment for ${selectedClient.policyTypes.join(', ')}`,
        category: 'Premium'
      },
      {
        id: 'INV-002',
        client: selectedClient.name,
        amount: Math.round(selectedClient.totalPremium * 0.15),
        type: 'Policy Fee',
        status: 'Pending',
        date: '2024-07-25',
        dueDate: '2024-08-10',
        commission: Math.round(selectedClient.totalPremium * 0.15) * 0.1,
        invoiceNumber: `INV-${selectedClient.id}-2024-002`,
        paymentMethod: 'Credit Card',
        description: 'Policy processing and administration fees',
        category: 'Fees'
      },
      {
        id: 'INV-003',
        client: selectedClient.name,
        amount: Math.round(selectedClient.totalPremium * 0.08),
        type: 'Endorsement Fee',
        status: 'Overdue',
        date: '2024-07-15',
        dueDate: '2024-07-30',
        commission: Math.round(selectedClient.totalPremium * 0.08) * 0.05,
        invoiceNumber: `INV-${selectedClient.id}-2024-003`,
        paymentMethod: 'Check',
        description: 'Policy endorsement and modification fees',
        category: 'Endorsements'
      }
    ] : [
      { id: 'INV-001', client: 'Metro Construction LLC', amount: 47520, type: 'Premium Payment', status: 'Completed', date: '2024-07-30', commission: 7128, category: 'Premium' },
      { id: 'INV-002', client: 'Johnson Automotive', amount: 32400, type: 'Renewal Payment', status: 'Pending', date: '2024-07-29', commission: 3888, category: 'Premium' },
      { id: 'INV-003', client: 'Riverside Medical', amount: 85600, type: 'Policy Payment', status: 'Completed', date: '2024-07-28', commission: 15408, category: 'Premium' }
    ];

    const filteredBilling = billingFilter === 'all' ? clientBillingData : clientBillingData.filter(bill => {
      if (billingFilter === 'completed') return bill.status === 'Completed';
      if (billingFilter === 'pending') return bill.status === 'Pending';
      if (billingFilter === 'overdue') return bill.status === 'Overdue';
      return true;
    });

    const totalRevenue = clientBillingData.reduce((sum, bill) => sum + bill.amount, 0);
    const totalCommission = clientBillingData.reduce((sum, bill) => sum + bill.commission, 0);
    const pendingAmount = clientBillingData.filter(b => b.status === 'Pending' || b.status === 'Overdue').reduce((sum, bill) => sum + bill.amount, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
            <p className="text-gray-600">
              {selectedClient ? `Billing management for ${selectedClient.name} • ${selectedClient.industry}` : 
               selectedAgent && userView === 'admin' ? `${selectedAgent.name}'s commission and billing overview` :
               'Automated commission reconciliation and payment processing'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={billingFilter}
                onChange={(e) => setBillingFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Invoices</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Receipt className="h-4 w-4" />
              <span>{selectedClient ? `Invoice ${selectedClient.name}` : 'Generate Invoice'}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <CreditCard className="h-4 w-4" />
              <span>Process Payment</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Calculator className="h-4 w-4" />
              <span>Commission Report</span>
            </button>
          </div>
        </div>

        {selectedClient && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-3 rounded-xl">
                  <PiggyBank className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.name} Billing</h3>
                  <p className="text-gray-600">Account: {selectedClient.id} • {selectedClient.industry}</p>
                  <p className="text-sm text-gray-500">Billing cycle: Monthly • Payment terms: Net 30</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-lg font-semibold text-green-600">${totalCommission.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Commission Earned</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Premium</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">${selectedClient.totalPremium.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{selectedClient.commissionRate}% commission rate</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Commission</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${(selectedClient.totalPremium * selectedClient.commissionRate / 100).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Annual earning</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Clock3 className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Outstanding</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">${pendingAmount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{filteredBilling.filter(b => b.status !== 'Completed').length} invoices</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Next Due</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{selectedClient.renewalDate}</div>
                <div className="text-xs text-gray-500">Renewal payment</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Revenue</p>
                <p className="text-3xl font-bold">
                  {selectedClient ? `$${totalRevenue.toLocaleString()}` : '$2.4M'}
                </p>
                <p className="text-green-100 text-sm">
                  {selectedClient ? `${selectedClient.name} account` : '+15.3% YTD'}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Commission</p>
                <p className="text-3xl font-bold">
                  {selectedClient ? `$${totalCommission.toLocaleString()}` : '$245K'}
                </p>
                <p className="text-blue-100 text-sm">
                  {selectedClient ? `${selectedClient.commissionRate}% rate` : 'This month'}
                </p>
              </div>
              <Percent className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Outstanding</p>
                <p className="text-3xl font-bold">
                  {selectedClient ? `$${pendingAmount.toLocaleString()}` : '$45K'}
                </p>
                <p className="text-yellow-100 text-sm">
                  {selectedClient ? 
                    `${filteredBilling.filter(b => b.status !== 'Completed').length} invoices` : 
                    '12 invoices'
                  }
                </p>
              </div>
              <Clock3 className="h-12 w-12 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Collection Rate</p>
                <p className="text-3xl font-bold">
                  {selectedClient ? 
                    `${Math.round((filteredBilling.filter(b => b.status === 'Completed').length / filteredBilling.length) * 100)}%` : 
                    '96.2%'
                  }
                </p>
                <p className="text-purple-100 text-sm">
                  {selectedClient ? 'Client performance' : 'Industry: 89%'}
                </p>
              </div>
              <Target className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedClient ? `${selectedClient.name} Invoices` : 'Recent Transactions'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{filteredBilling.length} invoices</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">Auto-Sync</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredBilling.map((payment) => (
                  <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${
                          payment.status === 'Completed' ? 'bg-green-100' :
                          payment.status === 'Pending' ? 'bg-yellow-100' :
                          payment.status === 'Overdue' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          {payment.category === 'Premium' ? <Banknote className="h-6 w-6 text-green-600" /> :
                           payment.category === 'Fees' ? <Calculator className="h-6 w-6 text-blue-600" /> :
                           <Receipt className="h-6 w-6 text-purple-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{payment.client}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{payment.type} • {payment.date}</span>
                            {selectedClient && payment.invoiceNumber && (
                              <span className="text-sm text-blue-600">{payment.invoiceNumber}</span>
                            )}
                          </div>
                          {selectedClient && payment.description && (
                            <p className="text-sm text-gray-600 mt-1">{payment.description}</p>
                          )}
                          {selectedClient && payment.dueDate && (
                            <div className="flex items-center space-x-2 mt-2">
                              <Clock3 className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">Due: {payment.dueDate}</span>
                              {payment.paymentMethod && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{payment.paymentMethod}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">${payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-green-600">+${payment.commission.toLocaleString()} commission</p>
                        <div className="mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedClient ? 'Payment Analytics' : 'Commission Breakdown'}
              </h3>
              
              {selectedClient ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Payment History</span>
                      </div>
                      <span className="text-blue-700 font-bold">
                        {Math.round((filteredBilling.filter(b => b.status === 'Completed').length / filteredBilling.length) * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      {filteredBilling.filter(b => b.status === 'Completed').length} of {filteredBilling.length} invoices paid on time
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900">Revenue Growth</span>
                      </div>
                      <span className="text-green-700 font-bold">+12.5%</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">Year-over-year premium growth</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Gauge className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Credit Score</span>
                      </div>
                      <span className="text-purple-700 font-bold">A+</span>
                    </div>
                    <p className="text-sm text-purple-700 mt-2">Excellent payment reliability</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { carrier: 'Travelers', commission: 85000, percentage: 15, policies: 45 },
                    { carrier: 'AIG', commission: 72000, percentage: 18, policies: 32 },
                    { carrier: 'Progressive', commission: 88000, percentage: 12, policies: 67 }
                  ].map((comm, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{comm.carrier}</span>
                        <span className="text-lg font-bold text-green-600">${comm.commission.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{comm.percentage}% avg rate</span>
                        <span>{comm.policies} policies</span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(comm.commission / 88000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {selectedClient ? `Generate Invoice` : 'Create Invoice'}
                  </span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Process Payment</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Commission Report</span>
                </button>

                {selectedClient && (
                  <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 rounded-lg transition-all">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-900">Payment Reminder</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AIAnalytics = () => {
    // Comprehensive QQ Analytics Data
    const qqAnalytics = {
      // Quote Performance Metrics
      quoteMetrics: {
        totalQuotes: selectedClient ? Math.floor(selectedClient.totalPremium / 10000) : 1247,
        quotesWon: selectedClient ? Math.floor(selectedClient.policies * 1.5) : 389,
        quotesLost: selectedClient ? Math.floor(selectedClient.churnRisk * 20) : 158,
        quotesOutstanding: selectedClient ? Math.max(1, Math.floor(selectedClient.churnRisk * 10)) : 42,
        conversionRate: selectedClient ? (selectedClient.churnRisk < 0.3 ? 85 : selectedClient.churnRisk < 0.6 ? 72 : 58) : 76.3,
        avgQuoteTime: selectedClient ? (selectedClient.industry === 'Construction' ? 18 : selectedClient.industry === 'Technology' ? 12 : 15) : 14.2,
        avgQuoteValue: selectedClient ? Math.round(selectedClient.totalPremium / selectedClient.policies) : 25847
      },
      
      // Carrier Performance Analytics
      carrierPerformance: [
        { 
          name: 'Travelers', 
          quotes: selectedClient ? Math.floor(selectedClient.totalPremium / 50000) : 87, 
          wins: selectedClient ? Math.floor(selectedClient.policies * 0.4) : 34, 
          winRate: selectedClient ? (selectedClient.churnRisk < 0.4 ? 42 : 28) : 39.1,
          avgPremium: selectedClient ? Math.round(selectedClient.totalPremium * 0.8) : 31200,
          responseTime: 8.2 
        },
        { 
          name: 'Progressive', 
          quotes: selectedClient ? Math.floor(selectedClient.totalPremium / 45000) : 94, 
          wins: selectedClient ? Math.floor(selectedClient.policies * 0.3) : 28, 
          winRate: selectedClient ? (selectedClient.churnRisk < 0.4 ? 35 : 22) : 29.8,
          avgPremium: selectedClient ? Math.round(selectedClient.totalPremium * 0.9) : 28400,
          responseTime: 12.5 
        },
        { 
          name: 'Hartford', 
          quotes: selectedClient ? Math.floor(selectedClient.totalPremium / 60000) : 73, 
          wins: selectedClient ? Math.floor(selectedClient.policies * 0.25) : 22, 
          winRate: selectedClient ? (selectedClient.churnRisk < 0.4 ? 38 : 25) : 30.1,
          avgPremium: selectedClient ? Math.round(selectedClient.totalPremium * 1.1) : 34600,
          responseTime: 15.8 
        }
      ],
      
      // Quality Score Analytics
      qualityMetrics: {
        overallQualityScore: selectedClient ? (selectedClient.churnRisk < 0.3 ? 9.2 : selectedClient.churnRisk < 0.6 ? 8.4 : 7.6) : 8.7,
        dataCompleteness: selectedClient ? (selectedClient.industry === 'Technology' ? 98 : 94) : 96.2,
        accuracyScore: selectedClient ? (selectedClient.churnRisk < 0.4 ? 97 : 89) : 93.4,
        complianceScore: selectedClient ? (selectedClient.industry === 'Healthcare' ? 99 : 95) : 97.1
      },
      
      // Profitability Analysis
      profitabilityMetrics: {
        totalRevenue: selectedClient ? selectedClient.totalPremium : 1247896,
        totalCommission: selectedClient ? Math.round(selectedClient.totalPremium * selectedClient.commissionRate / 100) : 187184,
        costPerQuote: selectedClient ? Math.round(selectedClient.totalPremium / selectedClient.policies / 50) : 42,
        netProfit: selectedClient ? Math.round(selectedClient.totalPremium * selectedClient.commissionRate / 100 * 0.8) : 149747,
        profitMargin: selectedClient ? (selectedClient.commissionRate * 0.8).toFixed(1) : '12.0',
        roi: selectedClient ? Math.round(selectedClient.commissionRate * 5.5) : 278
      },
      
      // Market Competitiveness
      marketAnalysis: {
        marketPosition: selectedClient ? (selectedClient.churnRisk < 0.3 ? 'Leader' : selectedClient.churnRisk < 0.6 ? 'Challenger' : 'Follower') : 'Leader',
        competitiveScore: selectedClient ? (100 - Math.round(selectedClient.churnRisk * 100)) : 87,
        priceAdvantage: selectedClient ? (selectedClient.churnRisk < 0.4 ? '+12%' : '-8%') : '+5%',
        winRateVsCompetitors: selectedClient ? (selectedClient.churnRisk < 0.3 ? 23 : selectedClient.churnRisk < 0.6 ? 15 : 8) : 18
      }
    };

    const clientAnalytics = selectedClient ? {
      churnRisk: selectedClient.churnRisk * 100,
      riskScore: (selectedClient.churnRisk * 10).toFixed(1),
      profitPrediction: Math.round(selectedClient.totalPremium * selectedClient.commissionRate / 100 * 1.15),
      timeToRenewal: Math.ceil((new Date(selectedClient.renewalDate) - new Date()) / (1000 * 60 * 60 * 24)),
      industryFactors: [
        selectedClient.industry === 'Construction' ? 'Weather dependency' : 
        selectedClient.industry === 'Automotive' ? 'Market volatility' :
        selectedClient.industry === 'Healthcare' ? 'Regulatory changes' :
        selectedClient.industry === 'Technology' ? 'Cyber risks' : 'Economic factors',
        'Premium trends',
        'Claim history'
      ],
      recommendations: [
        `Optimize ${selectedClient.industry} coverage`,
        'Schedule renewal discussion',
        'Review risk factors',
        'Consider cross-selling opportunities'
      ],
      performanceMetrics: {
        conversionRate: qqAnalytics.quoteMetrics.conversionRate,
        retentionRate: selectedClient.churnRisk < 0.3 ? 95 : selectedClient.churnRisk < 0.6 ? 80 : 65,
        profitability: Math.round(selectedClient.commissionRate * 5.2)
      }
    } : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quote & Qualify Analytics</h2>
            <p className="text-gray-600">
              {selectedClient ? `Comprehensive QQ analytics for ${selectedClient.name} • ${selectedClient.industry} sector analysis` : 
               selectedAgent && userView === 'admin' ? `${selectedAgent.name}'s quote performance & conversion analytics` :
               'Enterprise-level quote performance, carrier analytics, and profitability insights'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <BarChart4 className="h-4 w-4" />
              <span>QQ Dashboard</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export QQ Report</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Brain className="h-4 w-4" />
              <span>AI Insights</span>
            </button>
            {selectedClient && (
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-colors">
                <Radar className="h-4 w-4" />
                <span>Client Deep Dive</span>
              </button>
            )}
          </div>
        </div>

        {/* Quote Performance Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <BarChart4 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedClient ? `${selectedClient.name} Quote Performance` : 'Quote Performance Overview'}
                </h3>
                <p className="text-gray-600">
                  {selectedClient ? `${qqAnalytics.quoteMetrics.totalQuotes} total quotes • ${selectedClient.industry} sector` : 
                   `${qqAnalytics.quoteMetrics.totalQuotes} quotes analyzed • Multi-carrier performance`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{qqAnalytics.quoteMetrics.conversionRate}%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-lg font-semibold text-green-600">${qqAnalytics.quoteMetrics.avgQuoteValue.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Avg Quote Value</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Quotes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{qqAnalytics.quoteMetrics.totalQuotes.toLocaleString()}</div>
              <div className="text-xs text-gray-500">+{Math.round(qqAnalytics.quoteMetrics.totalQuotes * 0.12)} this month</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Quotes Won</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{qqAnalytics.quoteMetrics.quotesWon}</div>
              <div className="text-xs text-gray-500">{qqAnalytics.quoteMetrics.conversionRate}% win rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Avg Quote Time</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{qqAnalytics.quoteMetrics.avgQuoteTime}m</div>
              <div className="text-xs text-gray-500">Industry avg: 18m</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <CircleDot className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Outstanding</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{qqAnalytics.quoteMetrics.quotesOutstanding}</div>
              <div className="text-xs text-gray-500">Pending decisions</div>
            </div>
          </div>
        </div>

        {/* Carrier Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrier Performance Analytics</h3>
            
            <div className="space-y-4">
              {qqAnalytics.carrierPerformance.map((carrier, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-green-600' : 'bg-purple-600'
                      }`}>
                        <span className="text-white font-semibold text-sm">{carrier.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{carrier.name}</h4>
                        <p className="text-sm text-gray-600">{carrier.quotes} quotes • {carrier.wins} wins</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{carrier.winRate}%</span>
                      <p className="text-xs text-gray-500">Win Rate</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Avg Premium:</span>
                      <span className="font-semibold text-gray-900 ml-2">${carrier.avgPremium.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Response Time:</span>
                      <span className="font-semibold text-gray-900 ml-2">{carrier.responseTime}m</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-green-600' : 'bg-purple-600'
                        }`}
                        style={{ width: `${carrier.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality & Compliance Metrics</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Overall Quality Score</span>
                  </div>
                  <span className="text-green-700 font-bold text-xl">{qqAnalytics.qualityMetrics.overallQualityScore}/10</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  {selectedClient ? 'Excellent data quality and compliance' : 'Above industry benchmark'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Data Completeness</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${qqAnalytics.qualityMetrics.dataCompleteness}%` }}></div>
                    </div>
                    <span className="font-semibold text-gray-900">{qqAnalytics.qualityMetrics.dataCompleteness}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Accuracy Score</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${qqAnalytics.qualityMetrics.accuracyScore}%` }}></div>
                    </div>
                    <span className="font-semibold text-gray-900">{qqAnalytics.qualityMetrics.accuracyScore}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Compliance Score</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${qqAnalytics.qualityMetrics.complianceScore}%` }}></div>
                    </div>
                    <span className="font-semibold text-gray-900">{qqAnalytics.qualityMetrics.complianceScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profitability & Market Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability Analysis</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Total Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${qqAnalytics.profitabilityMetrics.totalRevenue.toLocaleString()}</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Commission</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${qqAnalytics.profitabilityMetrics.totalCommission.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-900">Net Profit</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">${qqAnalytics.profitabilityMetrics.netProfit.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-purple-600">{qqAnalytics.profitabilityMetrics.profitMargin}%</div>
                    <div className="text-xs text-gray-500">Margin</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Cost per Quote</span>
                  <span className="font-semibold text-gray-900">${qqAnalytics.profitabilityMetrics.costPerQuote}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">ROI</span>
                  <span className="font-semibold text-green-600">{qqAnalytics.profitabilityMetrics.roi}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Competitiveness</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Market Position</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{qqAnalytics.marketAnalysis.marketPosition}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">{qqAnalytics.marketAnalysis.competitiveScore}/100</div>
                    <div className="text-xs text-gray-500">Competitive Score</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Price Advantage</span>
                  <span className={`font-semibold ${
                    qqAnalytics.marketAnalysis.priceAdvantage.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {qqAnalytics.marketAnalysis.priceAdvantage}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Win Rate vs Competitors</span>
                  <span className="font-semibold text-blue-600">+{qqAnalytics.marketAnalysis.winRateVsCompetitors}%</span>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Insights
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• {selectedClient ? `${selectedClient.industry} sector performance above average` : 'Strong performance across all sectors'}</li>
                  <li>• {selectedClient ? 'Client retention strategy working effectively' : 'Competitive pricing strategy effective'}</li>
                  <li>• Quote turnaround time {qqAnalytics.quoteMetrics.avgQuoteTime < 15 ? 'excellent' : 'good'} vs industry</li>
                  <li>• {selectedClient ? `Risk level optimized for ${selectedClient.industry}` : 'Portfolio diversification optimal'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {selectedClient && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-3 rounded-xl">
                  <Radar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.name} QQ Deep Dive</h3>
                  <p className="text-gray-600">Client-specific quote performance • Risk analysis • Profitability insights</p>
                  <p className="text-sm text-gray-500">
                    {qqAnalytics.quoteMetrics.totalQuotes} quotes • {qqAnalytics.quoteMetrics.conversionRate}% conversion • ${qqAnalytics.quoteMetrics.avgQuoteValue.toLocaleString()} avg value
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  clientAnalytics.churnRisk < 30 ? 'text-green-600' : 
                  clientAnalytics.churnRisk < 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {clientAnalytics.churnRisk.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Churn Risk</div>
                <div className="text-lg font-semibold text-blue-600">${clientAnalytics.profitPrediction.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Profit forecast</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">QQ Conversion</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{qqAnalytics.quoteMetrics.conversionRate}%</div>
                <div className="text-xs text-gray-500">
                  {qqAnalytics.quoteMetrics.conversionRate > 80 ? 'Excellent' : 
                   qqAnalytics.quoteMetrics.conversionRate > 65 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Quote Speed</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{qqAnalytics.quoteMetrics.avgQuoteTime}m</div>
                <div className="text-xs text-gray-500">Avg turnaround</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Avg Value</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">${(qqAnalytics.quoteMetrics.avgQuoteValue / 1000).toFixed(0)}k</div>
                <div className="text-xs text-gray-500">Per quote</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Quality</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{qqAnalytics.qualityMetrics.overallQualityScore}/10</div>
                <div className="text-xs text-gray-500">QQ score</div>
              </div>
            </div>
          </div>
        )}

        {/* QQ Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Quote Conversion</p>
                <p className="text-3xl font-bold">{qqAnalytics.quoteMetrics.conversionRate}%</p>
                <p className="text-blue-100 text-sm">
                  {selectedClient ? `${selectedClient.name} rate` : 'Overall rate'}
                </p>
              </div>
              <Target className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Quality Score</p>
                <p className="text-3xl font-bold">{qqAnalytics.qualityMetrics.overallQualityScore}/10</p>
                <p className="text-green-100 text-sm">
                  {selectedClient ? 'Client data quality' : 'Portfolio avg'}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Market Position</p>
                <p className="text-3xl font-bold">{qqAnalytics.marketAnalysis.competitiveScore}</p>
                <p className="text-purple-100 text-sm">
                  {qqAnalytics.marketAnalysis.marketPosition} • /100 score
                </p>
              </div>
              <Award className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Profitability</p>
                <p className="text-3xl font-bold">{qqAnalytics.profitabilityMetrics.profitMargin}%</p>
                <p className="text-orange-100 text-sm">
                  {selectedClient ? 'Client margin' : 'Portfolio margin'}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* QQ Analytics Action Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            QQ Analytics Actions & Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all text-left">
              <BarChart4 className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Quote Performance</div>
                <div className="text-sm text-gray-600">Analyze conversion trends</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all text-left">
              <Target className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Carrier Optimization</div>
                <div className="text-sm text-gray-600">Improve win rates</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all text-left">
              <Award className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Market Analysis</div>
                <div className="text-sm text-gray-600">Competitive positioning</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-lg transition-all text-left">
              <DollarSign className="h-6 w-6 text-orange-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Profitability Focus</div>
                <div className="text-sm text-gray-600">Revenue optimization</div>
              </div>
            </button>
          </div>

          {selectedClient && (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                QQ Recommendations for {selectedClient.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Focus on {qqAnalytics.carrierPerformance[0].name} - highest win rate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Quote turnaround: {qqAnalytics.quoteMetrics.avgQuoteTime}m vs 18m industry avg</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Quality score: {qqAnalytics.qualityMetrics.overallQualityScore}/10 - excellent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Profit margin: {qqAnalytics.profitabilityMetrics.profitMargin}% above target</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ClaimsManagement = () => {
    const clientClaimsData = selectedClient ? [
      {
        id: 'CLM-001',
        claimNumber: `CLM-${selectedClient.id}-2024-001`,
        client: selectedClient.name,
        policyType: selectedClient.policyTypes[0],
        dateReported: '2024-07-25',
        incidentDate: '2024-07-20',
        status: 'Under Investigation',
        priority: selectedClient.churnRisk > 0.5 ? 'High' : selectedClient.churnRisk > 0.3 ? 'Medium' : 'Low',
        claimAmount: Math.round(selectedClient.totalPremium * 0.15),
        estimatedReserve: Math.round(selectedClient.totalPremium * 0.12),
        adjuster: 'Sarah Martinez',
        description: `${selectedClient.industry} incident requiring immediate attention`,
        location: selectedClient.address,
        contactPerson: selectedClient.contact.email,
        documents: ['Incident Report', 'Photos', 'Police Report'],
        activities: [
          { date: '2024-07-31', action: 'Initial investigation completed', user: 'Sarah Martinez' },
          { date: '2024-07-28', action: 'Expert assigned to case', user: 'Claims Team' },
          { date: '2024-07-25', action: 'Claim reported and logged', user: 'Mike Chen' }
        ]
      },
      {
        id: 'CLM-002',
        claimNumber: `CLM-${selectedClient.id}-2024-002`,
        client: selectedClient.name,
        policyType: selectedClient.policyTypes[1] || selectedClient.policyTypes[0],
        dateReported: '2024-06-15',
        incidentDate: '2024-06-10',
        status: 'Settled',
        priority: 'Low',
        claimAmount: Math.round(selectedClient.totalPremium * 0.08),
        paidAmount: Math.round(selectedClient.totalPremium * 0.06),
        adjuster: 'David Kumar',
        description: 'Minor property damage claim',
        location: selectedClient.address,
        contactPerson: selectedClient.contact.email,
        documents: ['Settlement Agreement', 'Repair Estimates'],
        activities: [
          { date: '2024-07-01', action: 'Claim settled and closed', user: 'David Kumar' },
          { date: '2024-06-20', action: 'Settlement negotiated', user: 'David Kumar' },
          { date: '2024-06-15', action: 'Claim reported', user: 'Lisa Rodriguez' }
        ]
      }
    ] : [
      { id: 'CLM-001', claimNumber: 'CLM-CLI-001-2024-001', client: 'Metro Construction LLC', policyType: 'General Liability', dateReported: '2024-07-25', status: 'Under Investigation', priority: 'High', claimAmount: 25000, adjuster: 'Sarah Martinez' },
      { id: 'CLM-002', claimNumber: 'CLM-CLI-002-2024-001', client: 'Johnson Automotive Group', policyType: 'Commercial Auto', dateReported: '2024-07-20', status: 'Open', priority: 'Medium', claimAmount: 18500, adjuster: 'David Kumar' },
      { id: 'CLM-003', claimNumber: 'CLM-CLI-003-2024-001', client: 'Riverside Medical Center', policyType: 'Professional Liability', dateReported: '2024-07-15', status: 'Settled', priority: 'Low', claimAmount: 12000, paidAmount: 8500, adjuster: 'Maria Lopez' }
    ];

    const filteredClaims = claimsFilter === 'all' ? clientClaimsData : clientClaimsData.filter(claim => {
      if (claimsFilter === 'open') return claim.status === 'Open' || claim.status === 'Under Investigation';
      if (claimsFilter === 'settled') return claim.status === 'Settled' || claim.status === 'Closed';
      if (claimsFilter === 'high_priority') return claim.priority === 'High';
      return true;
    });

    const sortedClaims = [...filteredClaims].sort((a, b) => {
      const dateA = new Date(a.dateReported);
      const dateB = new Date(b.dateReported);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const totalClaimsAmount = clientClaimsData.reduce((sum, claim) => sum + claim.claimAmount, 0);
    const settledClaims = clientClaimsData.filter(c => c.status === 'Settled' || c.status === 'Closed');
    const openClaims = clientClaimsData.filter(c => c.status === 'Open' || c.status === 'Under Investigation');
    const avgSettlementTime = 45; // days

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Claims Management</h2>
            <p className="text-gray-600">
              {selectedClient ? `Claims management for ${selectedClient.name} • ${selectedClient.industry} sector` : 
               selectedAgent && userView === 'admin' ? `${selectedAgent.name}'s claims portfolio and processing` :
               'Intelligent claims processing and adjudication workflow'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={claimsFilter}
                onChange={(e) => setClaimsFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Claims</option>
                <option value="open">Open Claims</option>
                <option value="settled">Settled Claims</option>
                <option value="high_priority">High Priority</option>
              </select>
            </div>
            <button 
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
              <span className="text-sm">Date</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <AlertTriangle className="h-4 w-4" />
              <span>{selectedClient ? `File Claim` : 'New Claim'}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ClipboardList className="h-4 w-4" />
              <span>Claims Report</span>
            </button>
          </div>
        </div>

        {selectedClient && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-600 p-3 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.name} Claims Portfolio</h3>
                  <p className="text-gray-600">{clientClaimsData.length} total claims • {selectedClient.industry} risk profile</p>
                  <p className="text-sm text-gray-500">Client since: {selectedClient.renewalDate} • Risk level: {selectedClient.churnRisk > 0.5 ? 'High' : selectedClient.churnRisk > 0.3 ? 'Medium' : 'Low'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${totalClaimsAmount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Claims Value</div>
                <div className="text-lg font-semibold text-green-600">${(totalClaimsAmount * 0.7).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Estimated Settlement</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <AlertOctagon className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">Open Claims</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{openClaims.length}</div>
                <div className="text-xs text-gray-500">{openClaims.filter(c => c.priority === 'High').length} high priority</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Settled</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{settledClaims.length}</div>
                <div className="text-xs text-gray-500">This year</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Avg Resolution</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{avgSettlementTime}</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Success Rate</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">94%</div>
                <div className="text-xs text-gray-500">Client satisfaction</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedClient ? `${selectedClient.name} Claims` : 'Active Claims'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{sortedClaims.length} claims</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-red-600">Live Tracking</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {sortedClaims.map((claim) => (
                  <div key={claim.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${
                          claim.status === 'Under Investigation' ? 'bg-yellow-100' :
                          claim.status === 'Open' ? 'bg-red-100' :
                          claim.status === 'Settled' ? 'bg-green-100' :
                          'bg-gray-100'
                        }`}>
                          {claim.status === 'Under Investigation' ? <FileWarning className="h-6 w-6 text-yellow-600" /> :
                           claim.status === 'Open' ? <AlertTriangle className="h-6 w-6 text-red-600" /> :
                           claim.status === 'Settled' ? <CheckCircle className="h-6 w-6 text-green-600" /> :
                           <ClipboardList className="h-6 w-6 text-gray-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{claim.claimNumber}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{claim.policyType} • {claim.dateReported}</span>
                            {!selectedClient && (
                              <span className="text-sm text-blue-600">{claim.client}</span>
                            )}
                          </div>
                          {selectedClient && claim.description && (
                            <p className="text-sm text-gray-600 mt-1">{claim.description}</p>
                          )}
                          {selectedClient && claim.adjuster && (
                            <div className="flex items-center space-x-2 mt-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">Adjuster: {claim.adjuster}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className={`text-xs font-medium ${
                                claim.priority === 'High' ? 'text-red-600' :
                                claim.priority === 'Medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {claim.priority} Priority
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">${claim.claimAmount.toLocaleString()}</p>
                        {claim.paidAmount && (
                          <p className="text-sm text-green-600">Paid: ${claim.paidAmount.toLocaleString()}</p>
                        )}
                        {claim.estimatedReserve && (
                          <p className="text-sm text-orange-600">Reserve: ${claim.estimatedReserve.toLocaleString()}</p>
                        )}
                        <div className="mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            claim.status === 'Under Investigation' ? 'bg-yellow-100 text-yellow-800' :
                            claim.status === 'Open' ? 'bg-red-100 text-red-800' :
                            claim.status === 'Settled' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedClient && claim.activities && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h5>
                        <div className="space-y-2">
                          {claim.activities.slice(0, 2).map((activity, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>{activity.date}: {activity.action}</span>
                              <span className="text-gray-400">by {activity.user}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Analytics</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-900">Active Claims</span>
                    </div>
                    <span className="text-red-700 font-bold">{openClaims.length}</span>
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    {selectedClient ? 
                      `${openClaims.length} active claims requiring attention` :
                      'Claims awaiting resolution'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Settlement Rate</span>
                    </div>
                    <span className="text-green-700 font-bold">
                      {Math.round((settledClaims.length / clientClaimsData.length) * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    {selectedClient ? 'Strong settlement performance' : 'Above industry average'}
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Avg Resolution</span>
                    </div>
                    <span className="text-blue-700 font-bold">{avgSettlementTime}d</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    {selectedClient ? 'Efficient claim processing' : 'Industry benchmark: 60 days'}  
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-lg transition-all">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-gray-900">
                    {selectedClient ? `File New Claim` : 'File Claim'}
                  </span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Generate Report</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all">
                  <Camera className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Upload Evidence</span>
                </button>

                {selectedClient && (
                  <>
                    <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 rounded-lg transition-all">
                      <Phone className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-gray-900">Contact Client</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900">Site Inspection</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SystemSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Platform configuration, security, and user management controls</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Settings className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span>Backup System</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input 
                    type="text" 
                    defaultValue="InsureFlow Agency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Pacific Standard Time (PST)</option>
                    <option>Eastern Standard Time (EST)</option>
                    <option>Central Standard Time (CST)</option>
                    <option>Mountain Standard Time (MST)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>USD - US Dollar</option>
                    <option>CAD - Canadian Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Access</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Enhanced security for admin accounts</p>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="sr-only" />
                  <div className="w-10 h-6 bg-blue-600 rounded-full shadow-inner"></div>
                  <div className="dot absolute w-4 h-4 bg-white rounded-full shadow -left-1 -top-1 transition transform translate-x-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Session Timeout</h4>
                  <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>4 hours</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Password Policy</h4>
                  <p className="text-sm text-gray-600">Minimum requirements for passwords</p>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* Integration Settings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrations & APIs</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">ACORD Forms Integration</h4>
                    <p className="text-sm text-gray-600">Connected and syncing</p>
                  </div>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Carrier APIs</h4>
                    <p className="text-sm text-gray-600">{carriers.length} carriers connected</p>
                  </div>
                </div>
                <span className="text-blue-600 font-medium">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Email Automation</h4>
                    <p className="text-sm text-gray-600">Setting up SMTP configuration</p>
                  </div>
                </div>
                <span className="text-yellow-600 font-medium">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* System Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">All Systems</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="text-sm font-medium text-gray-900">78% Used</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Activity</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">User login: Sarah Johnson</span>
                <span className="text-xs text-gray-400">2m ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Backup completed</span>
                <span className="text-xs text-gray-400">15m ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">System update available</span>
                <span className="text-xs text-gray-400">1h ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">New carrier integration</span>
                <span className="text-xs text-gray-400">3h ago</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Manage Users</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Security Audit</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 rounded-lg transition-all">
                <Download className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Export Data</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">System Update</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ClientPortal = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userView === 'client' ? 'My Account' : 'Client Portal Management'}
          </h2>
          <p className="text-gray-600">
            {userView === 'client' ? 'Manage your policies and documents' : 'White-label client self-service portal'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {userView !== 'client' && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Users className="h-4 w-4" />
              <span>Manage Clients</span>
            </button>
          )}
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Mail className="h-4 w-4" />
            <span>{userView === 'client' ? 'Contact Agent' : 'Send Notification'}</span>
          </button>
        </div>
      </div>

      {userView === 'client' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Active Policies</p>
                <p className="text-3xl font-bold">3</p>
                <p className="text-blue-100 text-sm">Total coverage</p>
              </div>
              <Shield className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Next Payment</p>
                <p className="text-3xl font-bold">$4.2K</p>
                <p className="text-green-100 text-sm">Due Aug 15</p>
              </div>
              <CreditCard className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Claims Open</p>
                <p className="text-3xl font-bold">1</p>
                <p className="text-purple-100 text-sm">In progress</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Clients</p>
                <p className="text-3xl font-bold">324</p>
                <p className="text-blue-100 text-sm">+12 this month</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Portal Usage</p>
                <p className="text-3xl font-bold">87%</p>
                <p className="text-green-100 text-sm">Active users</p>
              </div>
              <Globe className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Self-Service</p>
                <p className="text-3xl font-bold">94%</p>
                <p className="text-purple-100 text-sm">Request resolution</p>
              </div>
              <CheckCircle className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Satisfaction</p>
                <p className="text-3xl font-bold">4.8</p>
                <p className="text-orange-100 text-sm">Avg rating</p>
              </div>
              <Star className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {userView === 'client' ? 'My Policies' : 'Client Activity'}
        </h3>
        <div className="space-y-4">
          {userView === 'client' ? [
            { policy: 'General Liability', carrier: 'Travelers', premium: 15420, renewal: '2024-12-15', status: 'Active' },
            { policy: 'Commercial Auto', carrier: 'Progressive', premium: 8950, renewal: '2024-11-30', status: 'Active' },
            { policy: 'Property Insurance', carrier: 'AIG', premium: 12800, renewal: '2024-10-10', status: 'Renewal Due' }
          ].map((policy, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-semibold text-gray-900">{policy.policy}</p>
                  <p className="text-sm text-gray-600">{policy.carrier} • ${policy.premium.toLocaleString()}/year</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">Renews {policy.renewal}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  policy.status === 'Active' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {policy.status}
                </span>
              </div>
            </div>
          )) : [
            { client: 'Metro Construction', action: 'Downloaded COI', time: '2 mins ago', type: 'document' },
            { client: 'Johnson Automotive', action: 'Viewed policy details', time: '5 mins ago', type: 'view' },
            { client: 'Riverside Medical', action: 'Made payment', time: '8 mins ago', type: 'payment' }
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  {activity.type === 'document' && <FileText className="h-4 w-4 text-white" />}
                  {activity.type === 'view' && <Eye className="h-4 w-4 text-white" />}
                  {activity.type === 'payment' && <CreditCard className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{activity.client}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AutomationWorkflows = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automation Workflows</h2>
          <p className="text-gray-600">RPA orchestration and AI-driven process automation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>Create Workflow</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Workflow className="h-4 w-4" />
            <span>View Templates</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Active Workflows</p>
              <p className="text-3xl font-bold">23</p>
              <p className="text-blue-100 text-sm">Running now</p>
            </div>
            <Workflow className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Time Saved</p>
              <p className="text-3xl font-bold">847h</p>
              <p className="text-green-100 text-sm">This month</p>
            </div>
            <Timer className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Success Rate</p>
              <p className="text-3xl font-bold">98.7%</p>
              <p className="text-purple-100 text-sm">Automation accuracy</p>
            </div>
            <CheckCircle className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Cost Savings</p>
              <p className="text-3xl font-bold">$125K</p>
              <p className="text-orange-100 text-sm">Annual projection</p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Active Workflows</h3>
          <div className="space-y-4">
            {[
              { name: 'Auto Renewal Processing', status: 'Running', processed: 23, success: 100 },
              { name: 'COI Generation', status: 'Running', processed: 47, success: 98 },
              { name: 'Policy Document Filing', status: 'Running', processed: 156, success: 99 },
              { name: 'Commission Reconciliation', status: 'Scheduled', processed: 0, success: 0 }
            ].map((workflow, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">{workflow.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workflow.status === 'Running' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {workflow.status}
                  </span>
                </div>
                {workflow.status === 'Running' && (
                  <>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Processed today: {workflow.processed}</span>
                      <span>Success rate: {workflow.success}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${workflow.success}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Workflow Templates</h3>
          <div className="space-y-4">
            {[
              { name: 'New Client Onboarding', description: 'Automated client setup and document collection', category: 'Client Management' },
              { name: 'Claims Processing', description: 'End-to-end claims workflow automation', category: 'Claims' },
              { name: 'Renewal Campaign', description: 'Automated renewal notifications and follow-ups', category: 'Renewals' },
              { name: 'Risk Assessment', description: 'AI-powered risk evaluation workflow', category: 'Underwriting' }
            ].map((template, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{template.name}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Use Template →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ClientManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">
            {userView === 'admin' ? 'Complete client portfolio and agent assignments' : 
             userView === 'agent' ? 'Your assigned client portfolio' : 
             'Supported client accounts'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Client</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Industry</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Agent</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">CSR</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Premium</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Policies</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Renewal</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Churn Risk</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredClients().map(client => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {client.industry}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-900">{client.assignedAgent}</td>
                  <td className="py-4 px-6 text-gray-900">{client.assignedCSR}</td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-900">${client.totalPremium.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{client.commissionRate}% commission</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{client.policies}</div>
                    <div className="text-xs text-gray-500">policies</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-900">{client.renewalDate}</div>
                    <div className="text-xs text-gray-500">
                      {Math.ceil((new Date(client.renewalDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            client.churnRisk > 0.6 ? 'bg-red-500' : 
                            client.churnRisk > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${client.churnRisk * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${
                        client.churnRisk > 0.6 ? 'text-red-600' : 
                        client.churnRisk > 0.4 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {Math.round(client.churnRisk * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      client.status === 'Active' ? 'bg-green-100 text-green-800' :
                      client.status === 'Renewal Required' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedClient(client)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                        title="Generate Quote"
                      >
                        <Plus className="h-4 w-4 text-green-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Generate COI"
                      >
                        <Shield className="h-4 w-4 text-purple-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                        title="Contact Client"
                      >
                        <Mail className="h-4 w-4 text-orange-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const AgentManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
          <p className="text-gray-600">
            {selectedAgent ? `Managing: ${selectedAgent.name}` : 'Comprehensive agent performance and client portfolio management'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>Add Agent</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Award className="h-4 w-4" />
            <span>Performance Review</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {selectedAgent && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedAgent.name}</h3>
                <p className="text-gray-600">{selectedAgent.role}</p>
                <p className="text-sm text-gray-500">Last login: {selectedAgent.lastLogin}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">${selectedAgent.totalPremium.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Premium</div>
              <div className="text-lg font-semibold text-green-600">${selectedAgent.commissionEarned.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Commission Earned</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Clients</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{selectedAgent.clients.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Conversion</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{selectedAgent.performance.quotesToBound}%</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Retention</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{selectedAgent.performance.retention}%</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Growth</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">+{selectedAgent.performance.growth}%</div>
            </div>
          </div>

          <div className="mt-6 flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PhoneCall className="h-4 w-4" />
              <span>Call Agent</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <MessageSquare className="h-4 w-4" />
              <span>Send Message</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <BarChart4 className="h-4 w-4" />
              <span>View Analytics</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              <Award className="h-4 w-4" />
              <span>Performance Goals</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Agent Performance Dashboard</h3>
              <p className="text-sm text-gray-600">
                {selectedAgent ? `${selectedAgent.name}'s performance metrics` : 'All agents performance overview'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Agent</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Clients</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Premium</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Commission</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Conversion</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Retention</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Growth</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(selectedAgent ? [selectedAgent] : agentsData).map(agent => (
                    <tr key={agent.id} className={`hover:bg-gray-50 transition-colors ${selectedAgent?.id === agent.id ? 'bg-blue-50' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                            <UserCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{agent.name}</p>
                            <p className="text-sm text-gray-500">{agent.role}</p>
                            <p className="text-xs text-gray-400">{agent.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{agent.clients.length}</div>
                        <div className="text-xs text-gray-500">active clients</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">${agent.totalPremium.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">annual premium</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-green-600">${agent.commissionEarned.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">this year</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                              style={{ width: `${agent.performance.quotesToBound}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{agent.performance.quotesToBound}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                              style={{ width: `${agent.performance.retention}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{agent.performance.retention}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className={`h-4 w-4 ${agent.performance.growth > 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={`font-medium ${agent.performance.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {agent.performance.growth > 0 ? '+' : ''}{agent.performance.growth}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          agent.quotesActive > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {agent.quotesActive > 0 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setSelectedAgent(agent)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button 
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Message Agent"
                          >
                            <MessageSquare className="h-4 w-4 text-green-600" />
                          </button>
                          <button 
                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Performance Analytics"
                          >
                            <BarChart4 className="h-4 w-4 text-purple-600" />
                          </button>
                          <button 
                            className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Set Goals"
                          >
                            <Award className="h-4 w-4 text-orange-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance Insights</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Top Performer</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {agentsData.reduce((top, agent) => 
                    agent.performance.quotesToBound > top.performance.quotesToBound ? agent : top
                  ).name} - {agentsData.reduce((top, agent) => 
                    agent.performance.quotesToBound > top.performance.quotesToBound ? agent : top
                  ).performance.quotesToBound}% conversion rate
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Growth Leader</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {agentsData.reduce((top, agent) => 
                    agent.performance.growth > top.performance.growth ? agent : top
                  ).name} - +{agentsData.reduce((top, agent) => 
                    agent.performance.growth > top.performance.growth ? agent : top
                  ).performance.growth}% growth
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Retention Champion</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  {agentsData.reduce((top, agent) => 
                    agent.performance.retention > top.performance.retention ? agent : top
                  ).name} - {agentsData.reduce((top, agent) => 
                    agent.performance.retention > top.performance.retention ? agent : top
                  ).performance.retention}% retention
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all">
                <Plus className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Add New Agent</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg transition-all">
                <Award className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Performance Review</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all">
                <BarChart4 className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Analytics Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PoliciesView = () => {
    const selectedClientPolicies = selectedClient ? [
      ...selectedClient.policyTypes.map((type, idx) => ({
        id: `${selectedClient.id}-${idx}`,
        client: selectedClient.name,
        type: type,
        carrier: ['Travelers', 'AIG', 'Progressive'][idx % 3],
        premium: Math.floor(selectedClient.totalPremium / selectedClient.policies * (1 + (idx * 0.1))),
        renewal: selectedClient.renewalDate,
        status: selectedClient.status,
        churnScore: selectedClient.churnRisk,
        lastActivity: selectedClient.lastActivity,
        commission: Math.floor(selectedClient.totalPremium * selectedClient.commissionRate / 100 / selectedClient.policies),
        limits: ['$1M/$2M', '$2M/$4M', '$1M CSL'][idx % 3],
        deductible: ['$1,000', '$2,500', '$5,000'][idx % 3]
      }))
    ] : policies;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedClient ? `${selectedClient.name} Policies` : 'Policy Management'}
            </h2>
            <p className="text-gray-600">
              {selectedClient ? `${selectedClient.policies} active policies` : 'AI-powered policy lifecycle orchestration'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search policies..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Plus className="h-4 w-4" />
              <span>New Policy</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Policy</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Client</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Carrier</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Premium</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Commission</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Renewal</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Churn Risk</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedClientPolicies.map(policy => (
                  <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{policy.id}</div>
                      <div className="text-sm text-gray-500">{policy.lastActivity}</div>
                      <div className="text-xs text-gray-400">{policy.limits}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                          <Building className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{policy.client}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {policy.type.includes('Auto') && <Car className="h-4 w-4 text-blue-600" />}
                        {policy.type.includes('Liability') && <Shield className="h-4 w-4 text-green-600" />}
                        {policy.type.includes('Property') && <Home className="h-4 w-4 text-orange-600" />}
                        {policy.type.includes('Cyber') && <Lock className="h-4 w-4 text-purple-600" />}
                        <span className="text-gray-900">{policy.type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">{policy.carrier}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">${policy.premium.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Deductible: {policy.deductible}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-green-600">${policy.commission.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">15% rate</div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">{policy.renewal}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              policy.churnScore > 0.6 ? 'bg-red-500' : 
                              policy.churnScore > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${policy.churnScore * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${
                          policy.churnScore > 0.6 ? 'text-red-600' : 
                          policy.churnScore > 0.4 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {Math.round(policy.churnScore * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        policy.status === 'Active' ? 'bg-green-100 text-green-800' :
                        policy.status === 'Renewal Required' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <Edit3 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <Download className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // AI Chat Component
  const AIChat = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Assistant</h2>
          <p className="text-gray-600">
            {selectedClient ? `Intelligent assistant for ${selectedClient.name} • ${selectedClient.industry} sector` : 
             selectedAgent && userView === 'admin' ? `AI support for ${selectedAgent.name}'s portfolio` :
             `Your personal AI assistant • Context-aware help for ${getCurrentUserData().role}`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setChatMessages([])}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Clear Chat</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Chat</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">InsureFlow AI Assistant</h3>
              <p className="text-sm text-gray-600">
                {selectedClient ? `Focused on ${selectedClient.name}` : 
                 selectedAgent && userView === 'admin' ? `Managing ${selectedAgent.name}` :
                 `Helping with ${getCurrentUserData().role.toLowerCase()} tasks`}
                <span className="ml-2 inline-flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <span className="text-xs">Online</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to InsureFlow AI!</h3>
              <p className="text-gray-600 mb-4">I'm here to help you with your insurance management needs.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                <button 
                  onClick={() => sendMessage("What can you help me with?")}
                  className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 border border-blue-200 transition-colors"
                >
                  💡 What can you do?
                </button>
                <button 
                  onClick={() => sendMessage(selectedClient ? `Tell me about ${selectedClient.name}` : "Show me my policies")}
                  className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm text-green-700 border border-green-200 transition-colors"
                >
                  📊 {selectedClient ? 'Client analysis' : 'Policy overview'}
                </button>
                <button 
                  onClick={() => sendMessage("Show me analytics")}
                  className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-purple-700 border border-purple-200 transition-colors"
                >
                  📈 Analytics insights
                </button>
                <button 
                  onClick={() => sendMessage("Help me with quotes")}
                  className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm text-orange-700 border border-orange-200 transition-colors"
                >
                  🎯 Quoting help
                </button>
              </div>
            </div>
          ) : (
            <>
              {chatMessages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-end space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        message.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                      }`}>
                        {message.sender === 'user' ? getCurrentUserData().avatar : 'AI'}
                      </div>
                      <div className={`rounded-lg px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <div className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {aiTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-sm font-semibold text-white">
                      AI
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ask me anything about your insurance data..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(chatInput)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                disabled={aiTyping}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {chatInput.length > 0 && (
                  <button
                    onClick={() => setChatInput('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => sendMessage(chatInput)}
              disabled={!chatInput.trim() || aiTyping}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>
          
          {selectedClient && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Context: {selectedClient.name} • {selectedClient.industry}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <CarrierSelectionModal />
      
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  InsureFlow
                </h1>
                <p className="text-sm text-gray-600">Next-Gen Insurance Automation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <ViewSelector />
                <DeviceSelector />
              </div>
              
              <ClientAgentSelector />
              
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 w-64 xl:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {realTimeNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                        {realTimeNotifications.length > 9 ? '9+' : realTimeNotifications.length}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown />
                </div>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-2 ml-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{getUserData().avatar}</span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="font-semibold text-gray-900 text-sm">{getUserData().name}</p>
                    <p className="text-xs text-gray-500">{getUserData().role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {selectedClient && userView !== 'client' && (
          <div className="px-6 pb-4">
            <ClientInfoCard />
          </div>
        )}
      </header>

      <div className="flex">
        <nav className="w-72 bg-white/60 backdrop-blur-sm border-r border-gray-200 min-h-screen p-6">
          <div className="space-y-2">
            {getNavigationItems().map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-5 w-5 ${
                    activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    activeTab === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">AI Assistant</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Need help? Ask our AI anything about your policies, quotes, or platform features.
            </p>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">Chat with AI</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'quotes' && <QuotingEngine />}
          {activeTab === 'policies' && <PoliciesView />}
          {activeTab === 'claims' && <ClaimsManagement />}
          {activeTab === 'renewals' && <RenewalsManagement />}
          {activeTab === 'documents' && <DocumentVault />}
          {activeTab === 'billing' && <BillingPayments />}
          {activeTab === 'analytics' && <AIAnalytics />}
          {activeTab === 'chat' && <AIChat />}
          {activeTab === 'clients' && (userView === 'client' ? <ClientPortal /> : <ClientManagement />)}
          {activeTab === 'agents' && <AgentManagement />}
          {activeTab === 'workflows' && <AutomationWorkflows />}
          {activeTab === 'settings' && <SystemSettings />}
        </main>
      </div>
    </div>
  );
};

export default InsureFlow;
