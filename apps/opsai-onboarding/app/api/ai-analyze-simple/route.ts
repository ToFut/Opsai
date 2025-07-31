import { NextRequest, NextResponse } from 'next/server'

// Temporary simple analysis without OpenAI to test the flow
export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, websiteContent, businessProfile } = await request.json()

    if (!websiteContent || !businessProfile) {
      return NextResponse.json({ error: 'Website content and business profile are required' }, { status: 400 })
    }

    console.log(`🤖 Starting simplified analysis for: ${websiteUrl}`)

    // Mock AI analysis response that follows the same structure
    const mockAnalysis = {
      businessIntelligence: {
        industryCategory: businessProfile.businessType || "Restaurant",
        businessModel: "B2C Food Service Platform",
        revenueStreams: ["Food Sales", "Delivery Fees", "Online Orders"],
        targetAudience: "Local customers seeking convenient food delivery and pickup options",
        competitiveAdvantages: ["Fast delivery", "Wide menu selection", "Online ordering"],
        operationalComplexity: "medium",
        scalabilityRequirements: "regional"
      },
      
      technicalRequirements: {
        dataModels: [
          {
            name: "Customer",
            description: "Customer profiles and preferences",
            priority: "critical",
            relationships: ["Order", "Review"],
            estimatedRecords: "10K-100K",
            fields: [
              { name: "id", type: "string", required: true, unique: true, businessReason: "Unique customer identification" },
              { name: "name", type: "string", required: true, businessReason: "Customer identification for orders" },
              { name: "email", type: "string", required: true, unique: true, businessReason: "Communication and login" },
              { name: "phone", type: "string", required: true, businessReason: "Order confirmations and delivery coordination" },
              { name: "address", type: "json", required: false, businessReason: "Delivery location storage" },
              { name: "loyaltyPoints", type: "number", required: false, businessReason: "Customer retention program" }
            ]
          },
          {
            name: "Order",
            description: "Food orders and transaction records",
            priority: "critical",
            relationships: ["Customer", "MenuItem"],
            estimatedRecords: "50K-500K",
            fields: [
              { name: "id", type: "string", required: true, unique: true, businessReason: "Order tracking" },
              { name: "customerId", type: "string", required: true, businessReason: "Link to customer account" },
              { name: "items", type: "json", required: true, businessReason: "Order contents and customizations" },
              { name: "total", type: "number", required: true, businessReason: "Payment processing" },
              { name: "status", type: "enum", required: true, businessReason: "Order lifecycle tracking" },
              { name: "deliveryAddress", type: "json", required: false, businessReason: "Delivery coordination" },
              { name: "orderType", type: "enum", required: true, businessReason: "Pickup vs delivery handling" }
            ]
          },
          {
            name: "MenuItem",
            description: "Food items and menu management",
            priority: "important",
            relationships: ["Order", "Category"],
            estimatedRecords: "1K-5K",
            fields: [
              { name: "id", type: "string", required: true, unique: true, businessReason: "Menu item identification" },
              { name: "name", type: "string", required: true, businessReason: "Customer-facing item name" },
              { name: "description", type: "string", required: false, businessReason: "Customer information" },
              { name: "price", type: "number", required: true, businessReason: "Pricing and revenue calculation" },
              { name: "category", type: "string", required: true, businessReason: "Menu organization" },
              { name: "available", type: "boolean", required: true, businessReason: "Inventory management" }
            ]
          }
        ],
        
        integrationOpportunities: [
          {
            service: "Stripe",
            category: "payments",
            priority: "critical",
            businessValue: "Secure payment processing for online orders",
            complexity: "low",
            estimatedSetupTime: "2-4 hours"
          },
          {
            service: "DoorDash",
            category: "delivery",
            priority: "important",
            businessValue: "Expand delivery reach and customer base",
            complexity: "medium",
            estimatedSetupTime: "1-2 days"
          },
          {
            service: "Uber Eats",
            category: "delivery",
            priority: "important",
            businessValue: "Additional delivery platform for wider coverage",
            complexity: "medium",
            estimatedSetupTime: "1-2 days"
          },
          {
            service: "QuickBooks",
            category: "accounting",
            priority: "important",
            businessValue: "Automated financial tracking and tax preparation",
            complexity: "medium",
            estimatedSetupTime: "4-6 hours"
          },
          {
            service: "Mailchimp",
            category: "marketing",
            priority: "nice-to-have",
            businessValue: "Customer retention through email campaigns",
            complexity: "low",
            estimatedSetupTime: "2-3 hours"
          }
        ],
        
        workflowRequirements: [
          {
            name: "Order Processing",
            description: "Automated order validation, payment, and kitchen notification",
            trigger: "api_call",
            frequency: "real-time",
            complexity: "medium",
            businessImpact: "high",
            steps: [
              { name: "validate_order", type: "validation", description: "Check item availability and pricing", automationPotential: "high" },
              { name: "process_payment", type: "api_call", description: "Charge customer payment method", automationPotential: "high" },
              { name: "notify_kitchen", type: "notification", description: "Send order to kitchen display", automationPotential: "high" },
              { name: "update_customer", type: "notification", description: "Send confirmation to customer", automationPotential: "high" }
            ]
          }
        ]
      },
      
      userManagement: {
        userTypes: [
          {
            role: "customer",
            description: "End customers placing orders",
            permissions: ["place_order", "view_order_history", "update_profile"],
            authenticationMethod: "email_password",
            estimatedUsers: "1000-10000"
          },
          {
            role: "staff",
            description: "Restaurant staff managing orders and operations",
            permissions: ["view_orders", "update_order_status", "manage_menu"],
            authenticationMethod: "email_password",
            estimatedUsers: "5-20"
          },
          {
            role: "admin",
            description: "Business owners with full system access",
            permissions: ["full_access", "manage_users", "view_analytics", "system_settings"],
            authenticationMethod: "multi_factor",
            estimatedUsers: "1-3"
          }
        ],
        securityRequirements: {
          dataClassification: "confidential",
          complianceNeeds: ["PCI-DSS", "GDPR"],
          auditRequirements: true,
          encryptionLevel: "high"
        }
      },
      
      uiuxRecommendations: {
        primaryUserJourney: "Browse menu → Customize items → Add to cart → Checkout → Track order",
        criticalFeatures: ["Menu browsing", "Order customization", "Payment processing", "Order tracking", "Customer accounts"],
        designComplexity: "moderate",
        mobileRequirements: "mobile_first",
        dashboardNeeds: {
          executiveDashboard: true,
          operationalDashboard: true,
          customerDashboard: true,
          keyMetrics: ["Daily revenue", "Order volume", "Average order value", "Customer retention", "Delivery times"]
        }
      }
    }

    console.log('✅ Simplified Analysis completed')
    return NextResponse.json({
      success: true,
      analysis: mockAnalysis,
      stage: 'business_analysis',
      nextStep: 'confirm_and_generate_yaml'
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze business',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}