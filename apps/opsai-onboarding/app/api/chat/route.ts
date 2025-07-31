import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Generate intelligent response based on user input
    return NextResponse.json(generateIntelligentResponse(message))

  } catch (error) {
    console.error('Chat API error:', error)
    // Fallback response
    return NextResponse.json({
      content: "I'm here to help you consolidate your business systems! Tell me about your business and I'll identify what software you're likely using and how we can unify everything into one intelligent dashboard.",
      yamlConfig: generateBusinessYAML()
    })
  }
}

function generateIntelligentResponse(message: string) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('cafe') || lowerMessage.includes('dining')) {
    return {
      content: `🍽️ **Restaurant System Analysis Complete!**

Based on your restaurant/cafe business, I've detected you likely use these systems:

**Point of Sale & Payments:**
• Square, Toast, or Clover POS systems
• Stripe or PayPal for online payments
• Cash register integration

**Operations Management:**
• Restaurant365 or TouchBistro for inventory
• When I Work or Deputy for staff scheduling
• BevSpot for beverage inventory

**Customer & Delivery:**
• DoorDash, Uber Eats, Grubhub integrations
• OpenTable or Resy for reservations
• Yelp and Google Reviews management

**Business Management:**
• QuickBooks for accounting
• Mailchimp for customer emails
• Social media management tools

**OPSAI Consolidation Benefits:**
✅ **Unified Dashboard**: All restaurant metrics in one place
✅ **Smart Inventory**: AI-powered stock predictions and waste reduction
✅ **Staff Optimization**: Automatic scheduling based on demand patterns
✅ **Revenue Intelligence**: Real-time profit analysis across all channels
✅ **Customer Insights**: Unified view of all customer touchpoints

Ready to transform your restaurant operations with one intelligent platform?`,
      yamlConfig: generateRestaurantYAML()
    }
  }
  
  if (lowerMessage.includes('retail') || lowerMessage.includes('store') || lowerMessage.includes('shop') || lowerMessage.includes('boutique')) {
    return {
      content: `🛍️ **Retail System Analysis Complete!**

Your retail business likely uses multiple disconnected systems:

**E-commerce & Sales:**
• Shopify, WooCommerce, or Magento
• Square, Lightspeed, or Shopify POS
• Amazon, eBay, Etsy marketplaces

**Inventory & Operations:**
• TradeGecko, inFlow, or Cin7 for inventory
• ShipStation for order fulfillment
• Barcode scanning systems

**Marketing & Analytics:**
• Mailchimp or Klaviyo for email marketing
• Facebook Ads, Google Ads management
• Google Analytics, Hotjar for website analytics
• Social media scheduling tools

**Customer Service:**
• Zendesk, Intercom, or LiveChat
• Return management systems

**OPSAI Intelligence Platform:**
✅ **360° Customer View**: All customer touchpoints unified
✅ **Inventory Forecasting**: AI predicts demand patterns and prevents stockouts
✅ **Marketing ROI**: Track performance across all advertising channels
✅ **Real-time Insights**: Live dashboard for sales, inventory, and customer behavior
✅ **Automated Workflows**: From order to fulfillment to follow-up

Transform your retail operations into a data-driven powerhouse!`,
      yamlConfig: generateRetailYAML()
    }
  }

  if (lowerMessage.includes('law') || lowerMessage.includes('legal') || lowerMessage.includes('attorney')) {
    return {
      content: `⚖️ **Law Firm System Analysis Complete!**

Your legal practice likely manages multiple complex systems:

**Case Management:**
• Clio, MyCase, or PracticePanther
• Document management systems
• Time tracking and billing software

**Communication & Scheduling:**
• Calendly or Acuity for client scheduling
• Zoom for virtual consultations
• Client portal systems

**Business Operations:**
• QuickBooks for accounting and trust accounting
• DocuSign for electronic signatures
• Legal research platforms (Westlaw, LexisNexis)

**Marketing & Client Acquisition:**
• Website and SEO management
• Google Ads for legal services
• Client review management

**OPSAI Legal Intelligence:**
✅ **Unified Case Dashboard**: All cases, clients, and deadlines in one view
✅ **Smart Time Tracking**: Automated billing and productivity insights
✅ **Client Intelligence**: Complete client relationship management
✅ **Document Automation**: Streamlined contract and document workflows
✅ **Financial Intelligence**: Trust accounting, billing, and profitability analysis

Ready to modernize your legal practice with intelligent automation?`,
      yamlConfig: generateLegalYAML()
    }
  }

  // Default business response
  return {
    content: `🚀 **Business System Discovery Complete!**

I've analyzed your business needs and identified common software challenges most businesses face:

**Common Systems You Likely Use:**
• **CRM**: Salesforce, HubSpot, or Pipedrive for customer management
• **Accounting**: QuickBooks, Xero, or FreshBooks for financial management
• **Communication**: Slack, Microsoft Teams, or Zoom for team collaboration
• **Project Management**: Asana, Trello, or Monday.com for task tracking
• **Marketing**: Mailchimp, Constant Contact, or social media tools
• **Analytics**: Google Analytics, spreadsheets for reporting

**Current Pain Points:**
❌ Data scattered across multiple platforms
❌ Manual data entry between systems
❌ Inconsistent reporting and metrics
❌ Time wasted switching between apps
❌ Difficulty getting complete business overview

**OPSAI Consolidation Solution:**
✅ **Single Intelligent Dashboard**: All business metrics unified in real-time
✅ **AI-Powered Insights**: Smart recommendations based on your data patterns
✅ **Automated Workflows**: Eliminate manual data entry and repetitive tasks
✅ **Predictive Analytics**: Forecast trends and make data-driven decisions
✅ **Complete Business Intelligence**: 360° view of customers, revenue, and operations

Ready to consolidate your business operations into one powerful platform?`,
    yamlConfig: generateBusinessYAML()
  }
}

function generateRestaurantYAML() {
  return `# OPSAI Restaurant Intelligence Platform
metadata:
  name: "restaurant-intelligence"
  displayName: "Restaurant Business Intelligence"
  description: "Unified restaurant management and analytics platform"
  industry: "food-service"
  version: "1.0.0"

integrations:
  pos_systems:
    - name: "Square POS"
      type: "payment_processing"
      data_sync: "real_time"
      metrics: ["sales", "transactions", "tips", "refunds"]
    - name: "Toast POS"
      type: "restaurant_pos"
      data_sync: "real_time"
      metrics: ["orders", "menu_performance", "staff_performance"]
  
  delivery_platforms:
    - name: "DoorDash"
      type: "delivery"
      metrics: ["orders", "revenue", "ratings", "delivery_time"]
    - name: "Uber Eats"
      type: "delivery"
      metrics: ["orders", "revenue", "customer_feedback"]
    - name: "Grubhub"
      type: "delivery"
      metrics: ["orders", "commission_fees", "customer_ratings"]
  
  inventory_management:
    - name: "Restaurant365"
      type: "inventory_management"
      features: ["stock_levels", "cost_tracking", "waste_monitoring", "vendor_management"]

  reservations:
    - name: "OpenTable"
      type: "reservation_system"
      features: ["bookings", "guest_management", "table_optimization"]

dashboards:
  - name: "Revenue Intelligence"
    widgets: ["total_sales", "profit_margins", "peak_hours", "menu_performance", "delivery_vs_dine_in"]
  - name: "Operations Control"
    widgets: ["inventory_levels", "staff_scheduling", "table_turnover", "kitchen_efficiency"]
  - name: "Customer Intelligence"
    widgets: ["review_sentiment", "repeat_customers", "delivery_ratings", "guest_preferences"]

ai_features:
  - inventory_forecasting: true
  - demand_prediction: true
  - staff_optimization: true
  - menu_analysis: true
  - cost_optimization: true`
}

function generateRetailYAML() {
  return `# OPSAI Retail Intelligence Platform
metadata:
  name: "retail-intelligence"
  displayName: "Retail Business Intelligence"
  description: "Complete retail operations consolidation platform"
  industry: "retail"
  version: "1.0.0"

integrations:
  ecommerce:
    - name: "Shopify"
      type: "ecommerce_platform"
      data_sync: "real_time"
      metrics: ["sales", "inventory", "customers", "abandoned_carts"]
    - name: "WooCommerce"
      type: "ecommerce_platform"
      data_sync: "hourly"
      metrics: ["orders", "products", "customer_data"]
  
  marketing:
    - name: "Mailchimp"
      type: "email_marketing"
      features: ["campaigns", "automation", "analytics", "segmentation"]
    - name: "Facebook Ads"
      type: "advertising"
      metrics: ["spend", "conversions", "roi", "audience_insights"]
    - name: "Google Ads"
      type: "search_advertising"
      metrics: ["clicks", "impressions", "cost_per_click", "conversions"]
  
  analytics:
    - name: "Google Analytics"
      type: "web_analytics"
      features: ["traffic", "conversions", "behavior", "demographics"]

dashboards:
  - name: "Sales Intelligence"
    widgets: ["revenue_trends", "product_performance", "customer_lifetime_value", "conversion_rates"]
  - name: "Marketing ROI"
    widgets: ["campaign_performance", "channel_attribution", "customer_acquisition_cost", "social_engagement"]
  - name: "Inventory Control"
    widgets: ["stock_levels", "reorder_alerts", "turnover_rates", "profit_margins"]

ai_features:
  - demand_forecasting: true
  - customer_segmentation: true
  - price_optimization: true
  - inventory_planning: true
  - personalized_recommendations: true`
}

function generateLegalYAML() {
  return `# OPSAI Legal Intelligence Platform
metadata:
  name: "legal-intelligence"
  displayName: "Law Firm Business Intelligence"
  description: "Complete legal practice management platform"
  industry: "legal"
  version: "1.0.0"

integrations:
  case_management:
    - name: "Clio"
      type: "legal_practice_management"
      data_sync: "real_time"
      features: ["cases", "clients", "documents", "time_tracking", "billing"]
    - name: "MyCase"
      type: "case_management"
      features: ["case_files", "client_communication", "task_management"]
  
  document_management:
    - name: "DocuSign"
      type: "electronic_signature"
      features: ["contracts", "signatures", "document_tracking"]
    - name: "NetDocuments"
      type: "cloud_document_management"
      features: ["document_storage", "version_control", "security"]
  
  financial:
    - name: "QuickBooks"
      type: "accounting"
      features: ["trust_accounting", "billing", "expenses", "financial_reports"]

dashboards:
  - name: "Practice Intelligence"
    widgets: ["active_cases", "billable_hours", "client_satisfaction", "revenue_trends"]
  - name: "Financial Control"
    widgets: ["trust_account_balance", "outstanding_invoices", "profit_margins", "expense_tracking"]
  - name: "Client Intelligence"
    widgets: ["client_acquisition", "case_outcomes", "referral_sources", "client_retention"]

ai_features:
  - case_outcome_prediction: true
  - document_automation: true
  - client_risk_assessment: true
  - billing_optimization: true
  - legal_research_assistance: true`
}

function generateBusinessYAML() {
  return `# OPSAI Business Intelligence Platform
metadata:
  name: "business-intelligence"
  displayName: "Universal Business Intelligence"
  description: "Complete business operations consolidation platform"
  industry: "general_business"
  version: "1.0.0"

integrations:
  crm:
    - name: "HubSpot"
      type: "customer_relationship"
      data_sync: "real_time"
      features: ["contacts", "deals", "activities", "email_tracking"]
    - name: "Salesforce"
      type: "enterprise_crm"
      data_sync: "real_time"
      features: ["leads", "opportunities", "accounts", "reports"]
  
  accounting:
    - name: "QuickBooks"
      type: "accounting"
      features: ["invoicing", "expenses", "financial_reports", "tax_preparation"]
    - name: "Xero"
      type: "cloud_accounting"
      features: ["bank_reconciliation", "tax_tracking", "payroll"]
  
  communication:
    - name: "Slack"
      type: "team_communication"
      features: ["messages", "channels", "integrations", "file_sharing"]
    - name: "Microsoft Teams"
      type: "collaboration"
      features: ["meetings", "files", "chat", "project_collaboration"]

  project_management:
    - name: "Asana"
      type: "project_tracking"
      features: ["tasks", "projects", "team_collaboration", "reporting"]

dashboards:
  - name: "Executive Overview"
    widgets: ["revenue_summary", "key_metrics", "growth_trends", "team_performance"]
  - name: "Sales Pipeline"
    widgets: ["deal_progress", "conversion_rates", "sales_forecasting", "lead_sources"]
  - name: "Financial Intelligence"
    widgets: ["cash_flow", "profit_margins", "expense_tracking", "budget_vs_actual"]

ai_features:
  - revenue_forecasting: true
  - customer_insights: true
  - process_optimization: true
  - automated_reporting: true
  - predictive_analytics: true`
}