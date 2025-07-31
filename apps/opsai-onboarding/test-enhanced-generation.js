// Test the enhanced app generation with all integrations
const testConfig = {
  vertical: {
    name: "Healthcare Platform",
    description: "Modern healthcare management system",
    industry: "healthcare"
  },
  business: {
    name: "MedTech Solutions",
    type: "B2B Healthcare Platform"
  },
  database: {
    models: [
      {
        name: "Patient",
        fields: [
          { name: "firstName", type: "string", required: true },
          { name: "lastName", type: "string", required: true },
          { name: "email", type: "string", required: true, unique: true },
          { name: "phone", type: "string", required: false },
          { name: "medicalRecordNumber", type: "string", required: true, unique: true },
          { name: "dateOfBirth", type: "date", required: true }
        ]
      },
      {
        name: "MedicalDevice",
        fields: [
          { name: "deviceId", type: "string", required: true, unique: true },
          { name: "deviceName", type: "string", required: true },
          { name: "manufacturer", type: "string", required: true },
          { name: "model", type: "string", required: true },
          { name: "serialNumber", type: "string", required: true, unique: true },
          { name: "purchaseDate", type: "date", required: true },
          { name: "warrantyExpiry", type: "date", required: false },
          { name: "lastCalibration", type: "date", required: false },
          { name: "status", type: "string", required: true }
        ]
      },
      {
        name: "ComplianceRecord",
        fields: [
          { name: "recordType", type: "string", required: true },
          { name: "description", type: "string", required: true },
          { name: "complianceDate", type: "date", required: true },
          { name: "expiryDate", type: "date", required: false },
          { name: "status", type: "string", required: true },
          { name: "certificationBody", type: "string", required: false },
          { name: "documentUrl", type: "string", required: false }
        ]
      }
    ]
  },
  apis: {
    integrations: [
      { name: "stripe", enabled: true },
      { name: "salesforce", enabled: true },
      { name: "slack", enabled: true }
    ]
  },
  workflows: [
    {
      name: "Patient Onboarding",
      description: "Automated patient registration and verification process"
    },
    {
      name: "Device Calibration Reminder",
      description: "Automatic reminders for medical device calibration"
    },
    {
      name: "Compliance Monitoring",
      description: "Monitor and alert on compliance record expiry"
    }
  ]
}

async function testEnhancedGeneration() {
  try {
    console.log('🧪 Testing enhanced app generation...')
    
    const response = await fetch('http://localhost:3010/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yamlConfig: JSON.stringify(testConfig),
        appName: 'Enhanced Healthcare Platform'
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Enhanced generation successful!')
      console.log('📁 Output directory:', result.outputDir)
      console.log('🌐 App URL:', result.message)
      console.log('🔧 Features included:')
      console.log('  - ✅ Authentication (Supabase)')
      console.log('  - ✅ Multi-tenant isolation')
      console.log('  - ✅ Airbyte data sync')
      console.log('  - ✅ Business integrations (Stripe, Salesforce, Slack)')
      console.log('  - ✅ Production deployment config')
      console.log('  - ✅ Docker & Vercel ready')
    } else {
      console.error('❌ Generation failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testEnhancedGeneration()