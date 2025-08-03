async function testYAMLDirect() {
  console.log('🧪 Testing direct YAML app generation...\n');
  
  // The YAML string exactly as returned by the API
  const yamlString = `vertical:
  name: medtech-solutions
  description: Healthcare Technology management system powered by AI
  version: 1.0.0
  industry: general
  businessModel: Medical Equipment B2B
business:
  name: MedTech Solutions
  type: Healthcare Technology
  contact:
    email: support@medtechsolutions.com
    phone: +1-800-555-0100
  settings:
    timezone: America/New_York
    currency: USD
    language: en
database:
  provider: postgresql
  models:
    - name: Device
      displayName: Device
      description: Medical devices
      fields:
        - name: deviceId
          type: string
          required: true
          unique: false
          validation: null
          ui:
            label: Device Id
            widget: text
            placeholder: Enter deviceId
        - name: deviceName
          type: string
          required: true
          unique: false
          validation: null
          ui:
            label: Device Name
            widget: text
            placeholder: Enter deviceName
      relationships: []
      indexes:
        - device_created_at
      permissions:
        read:
          - admin
          - staff
          - customer
        write:
          - admin
          - staff
        delete:
          - admin
apis:
  integrations: []
workflows: []
authentication:
  providers:
    - email
    - oauth
  roles: []
  security:
    passwordPolicy:
      minLength: 8
      requireUppercase: true
      requireNumbers: true
      requireSpecialChars: true
    sessionManagement:
      sessionTimeout: 24h
      refreshToken: true
    auditLogging: false
ui:
  theme:
    primaryColor: '#1e40af'
    secondaryColor: '#3b82f6'
    layout: sidebar
  pages:
    - name: dashboard
      path: /
      layout: full-width
      components:
        - stats-overview
        - charts
        - recent-activity
      permissions:
        - admin
        - staff
    - name: device
      path: /device
      layout: sidebar
      components:
        - data-table
        - filters
        - actions
      permissions:
        - admin
        - staff
  dashboards:
    executive: false
    operational: true
    customer: false
deployment:
  platform: vercel
  environment: production
  resources:
    api:
      memory: 512MB
      cpu: '0.5'
    database:
      size: 10GB
      connections: 20
  domains:
    - medtech-solutions.opsai.app
  ssl: true
  monitoring:
    enabled: true
    services:
      - logs
      - metrics
      - alerts
features:
  authentication: true
  workflows: true
  integrations: true
  fileUpload: true
  notifications: true
  analytics: true
  audit: false`;

  console.log('📋 YAML length:', yamlString.length);
  console.log('📋 First 200 chars:', yamlString.substring(0, 200));

  try {
    const response = await fetch('http://localhost:3010/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yamlConfig: yamlString,
        appName: 'Direct Test MedTech App'
      }),
    });

    console.log('\n📡 Response status:', response.status);
    
    const text = await response.text();
    console.log('📡 Raw response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('\n📦 Parsed response:');
      console.log('  Success:', data.success);
      console.log('  App Name:', data.appName);
      console.log('  Output Dir:', data.outputDir);
      console.log('  Port:', data.port);
      console.log('  Message:', data.message);
      
      if (!data.success) {
        console.log('  Error:', data.error);
        console.log('  Details:', data.details);
      }
    } catch (e) {
      console.log('❌ Failed to parse response as JSON');
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the test
testYAMLDirect().catch(console.error);