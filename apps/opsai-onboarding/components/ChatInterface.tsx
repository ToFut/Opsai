'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, Copy, Download, Sparkles, Bot, User, Rocket } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  yamlConfig?: string
}

interface ChatInterfaceProps {
  onBack: () => void
}

export default function ChatInterface({ onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `�� **Welcome to OPSAI Business Intelligence!**

I'm here to help you consolidate all your business systems into one intelligent dashboard. No more juggling between 20+ different apps!

**Quick System Discovery Options:**
• "Analyze my restaurant's systems" 
• "I have a retail business with too many tools"
• "Help me consolidate my e-commerce operations"
• "My law firm uses dozens of different software"

**Or tell me about your business:**
• What industry are you in?
• How many different software tools do you currently use?
• What's your biggest pain point with managing systems?
• Any specific integrations you need (QuickBooks, Stripe, Shopify, etc.)?

Let's discover all your systems and create one unified dashboard to control everything! ✨`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedYaml, setGeneratedYaml] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const simulateAIResponse = async (userMessage: string): Promise<{ content: string; yamlConfig?: string }> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    const lowerMessage = userMessage.toLowerCase()
    
    // Detect business type and generate appropriate response
    if (lowerMessage.includes('vacation') || lowerMessage.includes('rental') || lowerMessage.includes('property') || lowerMessage.includes('hospitality')) {
      return {
        content: `Perfect! I've discovered your **Hospitality/Vacation Rental Business** systems. Let me consolidate everything for you.

**🏨 Systems I Found in Your Business:**
• Property management software (Guesty, HostGPO)
• Booking platforms (Airbnb, VRBO, Booking.com)
• Payment processors (Stripe, PayPal)
• Channel managers for listings
• Guest communication tools
• Cleaning/maintenance scheduling
• Financial/accounting software

**🔗 What I'll Consolidate:**
• Unified property dashboard across all platforms
• Centralized guest communication hub
• Real-time booking and availability sync
• Automated pricing optimization
• Financial reporting from all sources
• Staff task management

**🧠 Smart Actions Your Dashboard Will Enable:**
• Auto-adjust pricing based on demand across all platforms
• Instant guest issue resolution with context from all systems
• Predictive maintenance scheduling
• Revenue optimization recommendations

**Your unified control center is being generated...** One dashboard to rule them all!`,
        yamlConfig: generateVacationRentalYaml()
      }
    }
    
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('dining') || lowerMessage.includes('retail')) {
      return {
        content: `Excellent! I've analyzed your **Restaurant/Retail Business** and found the system chaos. Let me fix this for you.

**🍕 Current System Nightmare I Discovered:**
• POS system (Square, Toast, Clover)
• Delivery platforms (DoorDash, UberEats, Grubhub) 
• Reservation system (OpenTable, Resy)
• Inventory management (separate spreadsheets!)
• Staff scheduling (When I Work, Deputy)
• Accounting (QuickBooks, separate from everything)
• Customer loyalty (points system not connected)
• Marketing (Mailchimp, Instagram, Facebook)

**🔗 Your New Unified Command Center:**
• Single dashboard showing ALL sales channels
• Real-time inventory across delivery + in-store
• Customer profiles merged from all touchpoints  
• Staff performance metrics in one place
• Financial overview combining ALL revenue streams

**🧠 Smart Business Actions:**
• Auto-reorder inventory when low across ALL platforms
• Send targeted promotions based on unified customer data
• Optimize staff scheduling using sales predictions
• Price menu items dynamically based on demand/inventory

**Consolidating your restaurant empire into one intelligent system...** No more app-switching madness!`,
        yamlConfig: generateRestaurantCrmYaml()
      }
    }

    if (lowerMessage.includes('ecommerce') || lowerMessage.includes('shop') || lowerMessage.includes('store')) {
      return {
        content: `Great! I'll create an **E-commerce Management Dashboard** for you.

**🛍️ Dashboard Features:**
• Product catalog management
• Order processing and fulfillment
• Customer management
• Inventory tracking
• Sales analytics
• Multi-channel integration

**🔌 Key Integrations:**
• Shopify for store management
• Stripe for payment processing
• ShipStation for fulfillment
• Google Analytics for insights

Your e-commerce dashboard is ready to build!`,
        yamlConfig: generateEcommerceDashboardYaml()
      }
    }

    // Default response for custom descriptions
    return {
      content: `I understand you want to build: "${userMessage}"

Let me create a custom SaaS application for you! 

**🎯 Based on your description, I'll include:**
• Custom database schema for your data
• REST API endpoints for all operations
• Admin dashboard for management
• User authentication and permissions
• Responsive web interface

**🔧 I can also add:**
• Payment processing (Stripe)
• Email notifications (SendGrid)
• File uploads and storage
• Real-time updates
• Mobile-responsive design

**Want me to add any specific integrations or features?** Otherwise, I'll generate a complete application based on your description!`,
      yamlConfig: generateCustomAppYaml(userMessage)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await simulateAIResponse(userMessage.content)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        yamlConfig: response.yamlConfig
      }

      setMessages(prev => [...prev, assistantMessage])
      
      if (response.yamlConfig) {
        setGeneratedYaml(response.yamlConfig)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again!',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyYaml = () => {
    if (generatedYaml) {
      navigator.clipboard.writeText(generatedYaml)
    }
  }

  const downloadYaml = () => {
    if (generatedYaml) {
      const blob = new Blob([generatedYaml], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'opsai-config.yaml'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const generateApp = () => {
    // This would integrate with the OPSAI Core generator
    alert('🚀 App generation started! Your complete SaaS application will be ready in 2-3 minutes.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">OPSAI AI Builder</h1>
              <p className="text-xs text-gray-500">Describe your app idea</p>
            </div>
          </div>
        </div>
        
        {generatedYaml && (
          <div className="flex items-center space-x-2">
            <button
              onClick={copyYaml}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy YAML
            </button>
            <button
              onClick={downloadYaml}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </button>
            <button
              onClick={generateApp}
              className="px-4 py-1 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 flex items-center"
            >
              <Rocket className="w-4 h-4 mr-1" />
              Generate App
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.role === 'system'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <div key={index} className="font-semibold text-lg mt-3 mb-1">{line.slice(2, -2)}</div>
                    }
                    if (line.startsWith('•')) {
                      return <div key={index} className="ml-2 text-sm opacity-90">{line}</div>
                    }
                    return <div key={index} className="text-sm">{line}</div>
                  })}
                </div>
                
                {message.yamlConfig && (
                  <div className="mt-4 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <div className="text-green-400 mb-2">✅ YAML Configuration Generated</div>
                    <pre className="whitespace-pre-wrap">{message.yamlConfig}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-2xl flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Building your SaaS...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your SaaS app idea... (e.g., 'Build a vacation rental management system')"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// YAML Generation Functions
function generateVacationRentalYaml(): string {
  return `# OPSAI Generated Configuration - Vacation Rental SaaS
# Generated: ${new Date().toISOString()}

metadata:
  name: "vacation-rental-saas"
  displayName: "Vacation Rental Management"
  description: "Complete vacation rental management platform"
  version: "1.0.0"
  vertical: "hospitality"

database:
  type: "postgresql"
  entities:
    Property:
      fields:
        id: { type: "uuid", primary: true }
        name: { type: "string", required: true }
        description: { type: "text" }
        address: { type: "string", required: true }
        bedrooms: { type: "number" }
        bathrooms: { type: "number" }
        max_guests: { type: "number" }
        price_per_night: { type: "decimal", required: true }
        images: { type: "json" }
        amenities: { type: "json" }
        created_at: { type: "timestamp", default: "now()" }
        
    Reservation:
      fields:
        id: { type: "uuid", primary: true }
        property_id: { type: "uuid", ref: "Property" }
        guest_name: { type: "string", required: true }
        guest_email: { type: "email", required: true }
        check_in: { type: "date", required: true }
        check_out: { type: "date", required: true }
        guests_count: { type: "number" }
        total_amount: { type: "decimal" }
        status: { type: "enum", values: ["pending", "confirmed", "cancelled"] }
        created_at: { type: "timestamp", default: "now()" }

integrations:
  - name: "guesty"
    type: "rest"
    provider: "Guesty"
    baseUrl: "https://open-api.guesty.com/v1"
    authentication:
      type: "oauth2"
      oauth:
        authUrl: "https://login.guesty.com/oauth2/authorize"
        tokenUrl: "https://login.guesty.com/oauth2/token"
        scope: ["open-api"]
        
  - name: "stripe"
    type: "rest"
    provider: "Stripe"
    baseUrl: "https://api.stripe.com/v1"
    authentication:
      type: "api_key"

workflows:
  - name: "booking_confirmation"
    displayName: "Booking Confirmation"
    trigger:
      type: "database"
      event: "reservation_created"
    steps:
      - type: "email"
        config:
          template: "booking_confirmation"
          to: "{{reservation.guest_email}}"
      - type: "api_call"
        config:
          url: "{{integrations.stripe}}/payment_intents"
          method: "POST"

ui:
  theme:
    primary: "#3B82F6"
    secondary: "#64748B"
  pages:
    - name: "properties"
      type: "crud"
      entity: "Property"
    - name: "reservations" 
      type: "crud"
      entity: "Reservation"
    - name: "dashboard"
      type: "analytics"

deployment:
  platform: "vercel"
  database: "postgresql"
  storage: "aws-s3"`
}

function generateRestaurantCrmYaml(): string {
  return `# OPSAI Generated Configuration - Restaurant CRM
# Generated: ${new Date().toISOString()}

metadata:
  name: "restaurant-crm"
  displayName: "Restaurant CRM System"
  description: "Customer relationship management for restaurants"
  version: "1.0.0"
  vertical: "food-service"

database:
  type: "postgresql"
  entities:
    Customer:
      fields:
        id: { type: "uuid", primary: true }
        name: { type: "string", required: true }
        email: { type: "email" }
        phone: { type: "string" }
        birthday: { type: "date" }
        dietary_preferences: { type: "json" }
        loyalty_points: { type: "number", default: 0 }
        total_spent: { type: "decimal", default: 0 }
        visit_count: { type: "number", default: 0 }
        last_visit: { type: "timestamp" }
        created_at: { type: "timestamp", default: "now()" }
        
    Order:
      fields:
        id: { type: "uuid", primary: true }
        customer_id: { type: "uuid", ref: "Customer" }
        order_date: { type: "timestamp", default: "now()" }
        items: { type: "json", required: true }
        total_amount: { type: "decimal", required: true }
        payment_method: { type: "string" }
        table_number: { type: "string" }
        status: { type: "enum", values: ["pending", "preparing", "ready", "served", "cancelled"] }

integrations:
  - name: "stripe"
    type: "rest"
    provider: "Stripe"
    authentication:
      type: "api_key"
      
  - name: "twilio"
    type: "rest"
    provider: "Twilio"
    authentication:
      type: "basic"
      
  - name: "hubspot"
    type: "rest"
    provider: "HubSpot"
    authentication:
      type: "oauth2"

workflows:
  - name: "welcome_customer"
    trigger:
      type: "database"
      event: "customer_created"
    steps:
      - type: "email"
        config:
          template: "welcome"
      - type: "api_call"
        config:
          integration: "hubspot"
          endpoint: "/contacts"
          
  - name: "birthday_campaign"
    trigger:
      type: "schedule"
      cron: "0 9 * * *"
    steps:
      - type: "database"
        config:
          query: "SELECT * FROM customers WHERE birthday = CURRENT_DATE"
      - type: "email"
        config:
          template: "birthday_special"`
}

function generateEcommerceDashboardYaml(): string {
  return `# OPSAI Generated Configuration - E-commerce Dashboard
# Generated: ${new Date().toISOString()}

metadata:
  name: "ecommerce-dashboard"
  displayName: "E-commerce Management Dashboard"
  description: "Complete e-commerce management and analytics platform"
  version: "1.0.0"
  vertical: "ecommerce"

database:
  type: "postgresql"
  entities:
    Product:
      fields:
        id: { type: "uuid", primary: true }
        name: { type: "string", required: true }
        description: { type: "text" }
        price: { type: "decimal", required: true }
        inventory_count: { type: "number", default: 0 }
        sku: { type: "string", unique: true }
        category: { type: "string" }
        images: { type: "json" }
        status: { type: "enum", values: ["active", "inactive", "out_of_stock"] }
        
    Order:
      fields:
        id: { type: "uuid", primary: true }
        customer_email: { type: "email", required: true }
        items: { type: "json", required: true }
        total_amount: { type: "decimal", required: true }
        shipping_address: { type: "json" }
        status: { type: "enum", values: ["pending", "processing", "shipped", "delivered", "cancelled"] }
        created_at: { type: "timestamp", default: "now()" }

integrations:
  - name: "shopify"
    type: "rest"
    provider: "Shopify"
    authentication:
      type: "oauth2"
      
  - name: "stripe"
    type: "rest"
    provider: "Stripe"
    authentication:
      type: "api_key"

workflows:
  - name: "inventory_alert"
    trigger:
      type: "database"
      event: "product_updated"
      condition: "inventory_count < 10"
    steps:
      - type: "email"
        config:
          template: "low_inventory_alert"
          to: "admin@store.com"`
}

function generateCustomAppYaml(description: string): string {
  return `# OPSAI Generated Configuration - Custom SaaS Application
# Generated: ${new Date().toISOString()}
# Based on: "${description}"

metadata:
  name: "custom-saas-app"
  displayName: "Custom SaaS Application"
  description: "\${description}"
  version: "1.0.0"
  vertical: "custom"

database:
  type: "postgresql"
  entities:
    User:
      fields:
        id: { type: "uuid", primary: true }
        email: { type: "email", required: true, unique: true }
        name: { type: "string", required: true }
        role: { type: "enum", values: ["admin", "user"] }
        created_at: { type: "timestamp", default: "now()" }
        
    CustomEntity:
      fields:
        id: { type: "uuid", primary: true }
        name: { type: "string", required: true }
        description: { type: "text" }
        user_id: { type: "uuid", ref: "User" }
        status: { type: "string", default: "active" }
        data: { type: "json" }
        created_at: { type: "timestamp", default: "now()" }

integrations:
  - name: "stripe"
    type: "rest"
    provider: "Stripe"
    authentication:
      type: "api_key"
      
  - name: "sendgrid"
    type: "rest"
    provider: "SendGrid"
    authentication:
      type: "api_key"

ui:
  theme:
    primary: "#3B82F6"
  pages:
    - name: "dashboard"
      type: "analytics"
    - name: "users"
      type: "crud"
      entity: "User"
    - name: "entities"
      type: "crud"
      entity: "CustomEntity"

deployment:
  platform: "vercel"
  database: "postgresql"`
}