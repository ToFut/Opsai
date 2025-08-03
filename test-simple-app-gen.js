async function testSimpleAppGen() {
  console.log('🧪 Testing simple app generation...\n');
  
  // Very simple YAML string
  const yamlString = `vertical:
  name: test-app
  description: Test Application
  version: "1.0.0"
  industry: general
  businessModel: B2B

business:
  name: Test Business
  type: General
  website: https://test.com
  contact:
    email: test@test.com
    phone: "+1234567890"
  settings:
    timezone: America/New_York
    currency: USD
    language: en

database:
  provider: postgresql
  models:
    - name: User
      displayName: User
      description: User model
      fields:
        - name: id
          type: string
          required: true
          unique: true
        - name: email
          type: string
          required: true
          unique: true
        - name: name
          type: string
          required: true
      relationships: []
      indexes: [user_created_at]
      permissions:
        read: [admin, staff]
        write: [admin]
        delete: [admin]

apis:
  integrations: []

workflows: []

authentication:
  providers: [email]
  roles:
    - name: admin
      description: Administrator
      permissions: [all]
    - name: staff
      description: Staff
      permissions: [read, write]
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
    primaryColor: "#1e40af"
    secondaryColor: "#3b82f6"
    layout: sidebar
  pages:
    - name: dashboard
      path: /
      layout: full-width
      components: [stats-overview, charts, recent-activity]
      permissions: [admin, staff]

deployment:
  platform: vercel
  environment: production
  resources:
    api:
      memory: 512MB
      cpu: "0.5"
    database:
      size: 10GB
      connections: 20
  domains: [test-app.opsai.app]
  ssl: true
  monitoring:
    enabled: true
    services: [logs, metrics, alerts]

features:
  authentication: true
  workflows: false
  integrations: false
  fileUpload: false
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
        appName: 'Simple Test App'
      }),
    });

    console.log('\n📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    const text = await response.text();
    console.log('📡 Raw response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('\n📦 Parsed response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('❌ Failed to parse response as JSON');
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the test
testSimpleAppGen().catch(console.error);