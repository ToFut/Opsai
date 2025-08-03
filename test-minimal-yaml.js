async function testMinimalYAML() {
  console.log('🧪 Testing minimal YAML app generation...\n');
  
  // Minimal valid YAML
  const yamlString = `vertical:
  name: test-app
  description: Test Application
  version: "1.0.0"
  industry: general
  businessModel: B2B

business:
  name: Test Business
  type: General
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

apis:
  integrations: []

workflows: []

authentication:
  providers: [email]
  roles:
    - name: admin
      description: Administrator
      permissions: [all]

ui:
  theme:
    primaryColor: "#1e40af"
    secondaryColor: "#3b82f6"
    layout: sidebar
  pages:
    - name: dashboard
      path: /
      layout: full-width
      components: [stats-overview]
      permissions: [admin]

deployment:
  platform: vercel
  environment: production
  domains: [test-app.opsai.app]

features:
  authentication: true
  workflows: false
  integrations: false`;

  console.log('📋 YAML length:', yamlString.length);
  console.log('📋 Testing with minimal config');

  try {
    const response = await fetch('http://localhost:3010/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yamlConfig: yamlString,
        appName: 'Minimal Test App'
      }),
    });

    console.log('\n📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ Success! Response:');
    console.log('  App Name:', data.appName);
    console.log('  Output Dir:', data.outputDir);
    console.log('  Port:', data.port);
    console.log('  Message:', data.message);

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the test
testMinimalYAML().catch(console.error);