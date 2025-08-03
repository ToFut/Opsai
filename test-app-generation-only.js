const fetch = require('node-fetch');
const yaml = require('js-yaml');

async function testAppGenerationOnly() {
  console.log('🧪 Testing app generation with a simple YAML config...\n');
  
  // Create a minimal valid YAML config
  const yamlConfig = {
    vertical: {
      name: 'test-healthcare',
      description: 'Test Healthcare App',
      version: '1.0.0',
      industry: 'healthcare',
      businessModel: 'B2B'
    },
    business: {
      name: 'Test Medical Corp',
      type: 'Healthcare Technology',
      website: 'https://test-medical.com',
      contact: {
        email: 'test@medical.com',
        phone: '+1-555-0123'
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en'
      }
    },
    database: {
      provider: 'postgresql',
      models: [
        {
          name: 'Patient',
          displayName: 'Patient',
          description: 'Patient records',
          fields: [
            { name: 'id', type: 'string', required: true, unique: true },
            { name: 'firstName', type: 'string', required: true },
            { name: 'lastName', type: 'string', required: true },
            { name: 'email', type: 'string', required: true }
          ],
          relationships: [],
          indexes: ['patient_created_at'],
          permissions: {
            read: ['admin', 'staff'],
            write: ['admin', 'staff'],
            delete: ['admin']
          }
        },
        {
          name: 'Appointment',
          displayName: 'Appointment',
          description: 'Medical appointments',
          fields: [
            { name: 'id', type: 'string', required: true, unique: true },
            { name: 'patientId', type: 'string', required: true },
            { name: 'date', type: 'date', required: true },
            { name: 'status', type: 'string', required: true }
          ],
          relationships: [
            { type: 'belongsTo', model: 'Patient', foreignKey: 'patientId' }
          ],
          indexes: ['appointment_date'],
          permissions: {
            read: ['admin', 'staff'],
            write: ['admin', 'staff'],
            delete: ['admin']
          }
        }
      ]
    },
    apis: {
      integrations: []
    },
    workflows: [
      {
        name: 'appointment-reminder',
        description: 'Send appointment reminders',
        trigger: {
          type: 'schedule',
          schedule: '0 9 * * *'
        },
        steps: [
          {
            id: 'step_1',
            name: 'fetch_appointments',
            type: 'query',
            description: 'Get upcoming appointments'
          },
          {
            id: 'step_2',
            name: 'send_reminders',
            type: 'notification',
            description: 'Send email reminders'
          }
        ]
      }
    ],
    authentication: {
      providers: ['email'],
      roles: [
        {
          name: 'admin',
          description: 'System Administrator',
          permissions: ['all']
        },
        {
          name: 'staff',
          description: 'Medical Staff',
          permissions: ['read', 'write']
        }
      ],
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        sessionManagement: {
          sessionTimeout: '24h',
          refreshToken: true
        },
        auditLogging: true
      }
    },
    ui: {
      theme: {
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        layout: 'sidebar'
      },
      pages: [
        {
          name: 'dashboard',
          path: '/',
          layout: 'full-width',
          components: ['stats-overview', 'charts', 'recent-activity'],
          permissions: ['admin', 'staff']
        },
        {
          name: 'patients',
          path: '/patients',
          layout: 'sidebar',
          components: ['data-table', 'filters', 'actions'],
          permissions: ['admin', 'staff']
        },
        {
          name: 'appointments',
          path: '/appointments',
          layout: 'sidebar',
          components: ['calendar', 'list-view'],
          permissions: ['admin', 'staff']
        }
      ]
    },
    deployment: {
      platform: 'vercel',
      environment: 'production',
      resources: {
        api: { memory: '512MB', cpu: '0.5' },
        database: { size: '10GB', connections: 20 }
      },
      domains: ['test-medical.opsai.app'],
      ssl: true,
      monitoring: {
        enabled: true,
        services: ['logs', 'metrics', 'alerts']
      }
    },
    features: {
      authentication: true,
      workflows: true,
      integrations: true,
      fileUpload: true,
      notifications: true,
      analytics: true,
      audit: true
    }
  };

  // Convert to YAML string
  const yamlString = yaml.dump(yamlConfig, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });

  console.log('📋 YAML Config (first 500 chars):');
  console.log(yamlString.substring(0, 500) + '...\n');
  console.log(`📏 Total YAML length: ${yamlString.length} characters\n`);

  try {
    // Call the app generation endpoint directly
    console.log('🚀 Calling /api/generate endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yamlConfig: yamlString,
        appName: 'Test Healthcare App'
      }),
    });

    console.log(`📡 Response status: ${response.status}`);
    
    const responseData = await response.json();
    console.log('📦 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok && responseData.success) {
      console.log('\n✅ SUCCESS! App generated at:');
      console.log(`   📁 Directory: ${responseData.outputDir}`);
      console.log(`   🌐 URL: http://localhost:${responseData.port}`);
      console.log(`   📝 Message: ${responseData.message}`);
    } else {
      console.log('\n❌ FAILED! Error:', responseData.error);
      if (responseData.details) {
        console.log('   Details:', responseData.details);
      }
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error);
  }
}

// Run the test
console.log('========================================');
console.log('    APP GENERATION TEST - DIRECT API    ');
console.log('========================================\n');

testAppGenerationOnly().catch(console.error);