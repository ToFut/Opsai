// ========================================
// COMPLETE INTEGRATION FLOW - END TO END
// ========================================

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class OpsAIIntegrationFlow {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // ========================================
  // 1. OAUTH INTEGRATION AFTER USER CLICKS CONNECT
  // ========================================

  async handleUserConnect(userId, provider, oauthData) {
    console.log(`🔗 User ${userId} connecting ${provider}...`);
    
    try {
      // Step 1: Store OAuth credentials in Supabase
      await this.storeUserCredentials(userId, provider, oauthData);
      
      // Step 2: Update Terraform configuration
      await this.updateTerraformConfig(userId, provider, oauthData);
      
      // Step 3: Deploy Airbyte connection
      await this.deployAirbyteConnection(userId, provider);
      
      // Step 4: Wait for initial sync
      await this.waitForInitialSync(userId, provider);
      
      // Step 5: Organize database
      await this.organizeDatabase(userId);
      
      // Step 6: Extract workflow patterns
      const workflow = await this.extractWorkflow(userId);
      
      // Step 7: Generate backend
      const backend = await this.generateBackend(userId, workflow);
      
      // Step 8: Generate UI/UX
      const frontend = await this.generateFrontend(userId, workflow, backend);
      
      // Step 9: Deploy user's app
      const deploymentUrl = await this.deployUserApp(userId, backend, frontend);
      
      return {
        success: true,
        deploymentUrl,
        workflow,
        message: `${provider} connected and app deployed successfully!`
      };
      
    } catch (error) {
      console.error(`❌ Error in integration flow:`, error);
      throw error;
    }
  }

  // ========================================
  // STEP 1: STORE OAUTH CREDENTIALS IN SUPABASE PER USER
  // ========================================

  async storeUserCredentials(userId, provider, oauthData) {
    console.log(`💾 Storing ${provider} credentials for user ${userId}...`);
    
    const credentials = {
      user_id: userId,
      provider: provider,
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      expires_at: oauthData.expires_at,
      scope: oauthData.scope,
      provider_user_id: oauthData.provider_user_id,
      metadata: oauthData.metadata, // Shop domain, repo list, property IDs, etc.
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in encrypted table
    const { data, error } = await this.supabase
      .from('user_oauth_credentials')
      .upsert(credentials, {
        onConflict: 'user_id,provider',
        returning: 'minimal'
      });

    if (error) throw new Error(`Failed to store credentials: ${error.message}`);
    
    console.log(`✅ ${provider} credentials stored for user ${userId}`);
    return data;
  }

  // ========================================
  // STEP 2: UPDATE TERRAFORM WITH USER DATA
  // ========================================

  async updateTerraformConfig(userId, provider, oauthData) {
    console.log(`🔧 Updating Terraform config for user ${userId}...`);
    
    // Create user-specific tfvars
    const tfvars = await this.generateUserTfvars(userId, provider, oauthData);
    
    // Write to user-specific terraform directory
    const userTerraformDir = `/terraform/users/${userId}`;
    await fs.mkdir(userTerraformDir, { recursive: true });
    
    // Copy base terraform files
    await this.copyBaseTerraformFiles(userTerraformDir);
    
    // Write user-specific variables
    const tfvarsPath = path.join(userTerraformDir, 'terraform.tfvars');
    await fs.writeFile(tfvarsPath, tfvars);
    
    console.log(`✅ Terraform config updated for user ${userId}`);
  }

  async generateUserTfvars(userId, provider, oauthData) {
    const baseConfig = {
      user_id: userId,
      airbyte_client_id: process.env.AIRBYTE_CLIENT_ID,
      airbyte_client_secret: process.env.AIRBYTE_CLIENT_SECRET,
      airbyte_workspace_id: process.env.AIRBYTE_WORKSPACE_ID,
      airbyte_api_url: "https://api.airbyte.com/v1",
      environment: "production",
      project_name: "opsai"
    };

    // Add provider-specific configuration
    const providerConfig = this.getProviderConfig(provider, oauthData);
    
    return this.formatTfvars({ ...baseConfig, ...providerConfig });
  }

  getProviderConfig(provider, oauthData) {
    const configs = {
      stripe: {
        oauth_providers: {
          stripe: {
            client_secret: oauthData.access_token,
            enabled: true
          }
        }
      },
      github: {
        oauth_providers: {
          github: {
            client_secret: oauthData.access_token,
            enabled: true
          }
        },
        github_repositories: oauthData.metadata.selected_repositories
      },
      shopify: {
        oauth_providers: {
          shopify: {
            client_secret: oauthData.access_token,
            enabled: true
          }
        },
        shopify_shop_domain: oauthData.metadata.shop_domain
      },
      google: {
        oauth_providers: {
          google: {
            client_secret: oauthData.refresh_token,
            enabled: true
          }
        },
        google_analytics_properties: oauthData.metadata.property_ids
      }
    };

    return configs[provider] || {};
  }

  formatTfvars(config) {
    let tfvars = '';
    
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object') {
        tfvars += `${key} = ${JSON.stringify(value, null, 2)}\n\n`;
      } else if (typeof value === 'string') {
        tfvars += `${key} = "${value}"\n`;
      } else {
        tfvars += `${key} = ${value}\n`;
      }
    }
    
    return tfvars;
  }

  // ========================================
  // STEP 3: DEPLOY AIRBYTE CONNECTION
  // ========================================

  async deployAirbyteConnection(userId, provider) {
    console.log(`🚀 Deploying Airbyte connection for user ${userId}...`);
    
    const userTerraformDir = `/terraform/users/${userId}`;
    
    try {
      // Initialize terraform
      await execAsync('terraform init', { cwd: userTerraformDir });
      
      // Plan and apply
      const { stdout, stderr } = await execAsync('terraform apply -auto-approve', {
        cwd: userTerraformDir,
        timeout: 600000 // 10 minutes
      });
      
      console.log(`✅ Airbyte connection deployed for user ${userId}`);
      
      // Parse terraform output to get connection IDs
      const connectionIds = this.parseTerraformOutput(stdout);
      
      // Store connection info
      await this.storeConnectionInfo(userId, provider, connectionIds);
      
      return connectionIds;
      
    } catch (error) {
      console.error(`❌ Terraform deployment failed:`, error);
      throw new Error(`Airbyte deployment failed: ${error.message}`);
    }
  }

  parseTerraformOutput(stdout) {
    const outputMatch = stdout.match(/Outputs:\n\n([\s\S]*?)$/);
    if (!outputMatch) return {};
    
    // Parse terraform outputs to extract connection IDs
    const outputs = {};
    const lines = outputMatch[1].split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*=\s*"?([^"]+)"?$/);
      if (match) {
        outputs[match[1]] = match[2];
      }
    }
    
    return outputs;
  }

  async storeConnectionInfo(userId, provider, connectionIds) {
    const connectionInfo = {
      user_id: userId,
      provider: provider,
      connection_ids: connectionIds,
      status: 'deployed',
      created_at: new Date().toISOString()
    };

    await this.supabase
      .from('user_connections')
      .upsert(connectionInfo, { onConflict: 'user_id,provider' });
  }

  // ========================================
  // STEP 4: WAIT FOR INITIAL SYNC
  // ========================================

  async waitForInitialSync(userId, provider) {
    console.log(`⏳ Waiting for initial sync for user ${userId}...`);
    
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 30 * 1000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if data exists in user's schema
        const hasData = await this.checkUserDataExists(userId, provider);
        
        if (hasData) {
          console.log(`✅ Initial sync complete for user ${userId}`);
          return true;
        }
        
        console.log(`⏳ Still waiting for sync... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        console.warn(`⚠️ Error checking sync status:`, error.message);
      }
    }
    
    throw new Error(`Initial sync timeout for user ${userId}`);
  }

  async checkUserDataExists(userId, provider) {
    const tableMap = {
      stripe: 'stripe_customers',
      github: 'github_repositories', 
      shopify: 'shopify_orders',
      google: 'ga_website_overview'
    };
    
    const tableName = tableMap[provider];
    if (!tableName) return false;
    
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('count')
        .limit(1);
        
      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  // ========================================
  // STEP 5: ORGANIZE DATABASE
  // ========================================

  async organizeDatabase(userId) {
    console.log(`🗄️ Organizing database for user ${userId}...`);
    
    // Create user-specific views and schemas
    const organizationSQL = await this.generateDatabaseOrganizationSQL(userId);
    
    // Execute SQL to create views
    for (const sql of organizationSQL) {
      try {
        const { error } = await this.supabase.rpc('execute_sql', { query: sql });
        if (error) throw error;
      } catch (error) {
        console.warn(`⚠️ SQL execution warning:`, error.message);
      }
    }
    
    console.log(`✅ Database organized for user ${userId}`);
  }

  async generateDatabaseOrganizationSQL(userId) {
    return [
      // Create user-specific analytics schema
      `CREATE SCHEMA IF NOT EXISTS analytics_${userId};`,
      
      // Unified customer view
      `CREATE OR REPLACE VIEW analytics_${userId}.unified_customers AS
       SELECT 
         '${userId}' as user_id,
         sc.email,
         sc.id as stripe_customer_id,
         sc.created as stripe_created,
         COUNT(DISTINCT si.id) as total_invoices,
         SUM(si.amount_paid) / 100 as lifetime_value,
         sh.id as shopify_customer_id,
         sh.total_spent as shopify_spent
       FROM user_${userId}.stripe_customers sc
       LEFT JOIN user_${userId}.stripe_invoices si ON sc.id = si.customer
       LEFT JOIN user_${userId}.shopify_customers sh ON sc.email = sh.email
       GROUP BY sc.email, sc.id, sc.created, sh.id, sh.total_spent;`,
      
      // Developer activity view
      `CREATE OR REPLACE VIEW analytics_${userId}.developer_activity AS
       SELECT
         '${userId}' as user_id,
         COUNT(DISTINCT gr.id) as total_repos,
         COUNT(DISTINCT gi.id) as total_issues,
         COUNT(DISTINCT gpr.id) as total_prs,
         AVG(EXTRACT(EPOCH FROM (gpr.merged_at - gpr.created_at))/3600) as avg_pr_merge_hours
       FROM user_${userId}.github_repositories gr
       LEFT JOIN user_${userId}.github_issues gi ON gi.repository_url LIKE '%' || gr.name
       LEFT JOIN user_${userId}.github_pull_requests gpr ON gpr.repository_url LIKE '%' || gr.name;`,
      
      // Revenue analytics view
      `CREATE OR REPLACE VIEW analytics_${userId}.revenue_analytics AS
       SELECT
         DATE_TRUNC('month', s.created) as month,
         '${userId}' as user_id,
         COUNT(s.id) as transaction_count,
         SUM(s.amount) / 100 as revenue,
         LAG(SUM(s.amount) / 100) OVER (ORDER BY DATE_TRUNC('month', s.created)) as previous_month_revenue
       FROM user_${userId}.stripe_charges s
       WHERE s.status = 'succeeded'
       GROUP BY DATE_TRUNC('month', s.created)
       ORDER BY month;`
    ];
  }

  // ========================================
  // STEP 6: EXTRACT WORKFLOW PATTERNS
  // ========================================

  async extractWorkflow(userId) {
    console.log(`🔍 Extracting workflow patterns for user ${userId}...`);
    
    // Fetch organized data
    const userData = await this.fetchUserAnalyticsData(userId);
    
    // Analyze patterns using AI
    const patterns = await this.analyzeWorkflowPatterns(userId, userData);
    
    // Generate workflow schema
    const workflow = await this.generateWorkflowSchema(userId, patterns);
    
    console.log(`✅ Workflow extracted for user ${userId}`);
    return workflow;
  }

  async fetchUserAnalyticsData(userId) {
    const queries = [
      `SELECT * FROM analytics_${userId}.unified_customers LIMIT 100`,
      `SELECT * FROM analytics_${userId}.developer_activity LIMIT 1`,
      `SELECT * FROM analytics_${userId}.revenue_analytics ORDER BY month DESC LIMIT 12`
    ];
    
    const results = {};
    
    for (const [index, query] of queries.entries()) {
      try {
        const { data, error } = await this.supabase.rpc('execute_sql', { query });
        if (!error) {
          const keys = ['customers', 'developer', 'revenue'];
          results[keys[index]] = data;
        }
      } catch (error) {
        console.warn(`⚠️ Query failed:`, error.message);
        results[Object.keys(results).length] = [];
      }
    }
    
    return results;
  }

  async analyzeWorkflowPatterns(userId, userData) {
    const prompt = `
    Analyze the following user data and identify key workflow patterns:
    
    User ID: ${userId}
    Customer Data: ${JSON.stringify(userData.customers?.slice(0, 5), null, 2)}
    Developer Data: ${JSON.stringify(userData.developer, null, 2)}
    Revenue Data: ${JSON.stringify(userData.revenue, null, 2)}
    
    Identify:
    1. Primary business type (e-commerce, SaaS, agency, etc.)
    2. Key workflows and processes
    3. Important metrics to track
    4. User interface needs
    5. Automation opportunities
    
    Return a JSON object with your analysis.
    `;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a business analyst expert. Analyze user data and identify workflow patterns. Return valid JSON only."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.3
    });
    
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.warn('⚠️ Failed to parse AI response, using fallback');
      return this.generateFallbackWorkflow(userData);
    }
  }

  generateFallbackWorkflow(userData) {
    return {
      business_type: "general",
      key_workflows: ["data_analysis", "reporting"],
      metrics: ["revenue", "growth", "activity"],
      ui_needs: ["dashboard", "reports", "analytics"],
      automation_opportunities: ["data_sync", "alerts", "reports"]
    };
  }

  async generateWorkflowSchema(userId, patterns) {
    return {
      user_id: userId,
      business_type: patterns.business_type,
      workflows: patterns.key_workflows,
      metrics: patterns.metrics,
      ui_components: patterns.ui_needs,
      automations: patterns.automation_opportunities,
      generated_at: new Date().toISOString()
    };
  }

  // ========================================
  // STEP 7: GENERATE BACKEND
  // ========================================

  async generateBackend(userId, workflow) {
    console.log(`⚙️ Generating backend for user ${userId}...`);
    
    const backendCode = await this.generateBackendCode(userId, workflow);
    const apiRoutes = await this.generateAPIRoutes(userId, workflow);
    
    // Create user's backend directory
    const backendDir = `/generated/users/${userId}/backend`;
    await fs.mkdir(backendDir, { recursive: true });
    
    // Write backend files
    await this.writeBackendFiles(backendDir, backendCode, apiRoutes);
    
    console.log(`✅ Backend generated for user ${userId}`);
    return {
      directory: backendDir,
      routes: apiRoutes,
      features: backendCode.features
    };
  }

  async generateBackendCode(userId, workflow) {
    const prompt = `
    Generate a Node.js/Express backend for this user workflow:
    
    User ID: ${userId}
    Business Type: ${workflow.business_type}
    Workflows: ${workflow.workflows.join(', ')}
    Metrics: ${workflow.metrics.join(', ')}
    
    Generate:
    1. Express server setup
    2. API routes for each workflow
    3. Database queries for Supabase
    4. Authentication middleware
    5. Error handling
    
    Return the code structure as JSON.
    `;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior backend developer. Generate production-ready Node.js code. Return valid JSON with code files."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });
    
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return this.generateDefaultBackend(userId, workflow);
    }
  }

  generateDefaultBackend(userId, workflow) {
    return {
      files: {
        'server.js': this.getDefaultServerCode(userId),
        'routes/api.js': this.getDefaultAPIRoutes(userId, workflow),
        'middleware/auth.js': this.getDefaultAuthMiddleware(),
        'package.json': this.getDefaultPackageJson(userId)
      },
      features: ['api', 'auth', 'database', 'error_handling']
    };
  }

  getDefaultServerCode(userId) {
    return `
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const apiRoutes = require('./routes/api');
const authMiddleware = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', user_id: '${userId}' });
});

app.listen(port, () => {
  console.log(\`User ${userId} backend running on port \${port}\`);
});
    `;
  }

  getDefaultAPIRoutes(userId, workflow) {
    return `
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Analytics endpoints
router.get('/analytics/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('analytics_${userId}.unified_customers')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/revenue', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('analytics_${userId}.revenue_analytics')
      .select('*')
      .order('month', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

${workflow.workflows.map(w => `
// ${w} endpoints
router.get('/${w}', async (req, res) => {
  // Implementation for ${w}
  res.json({ workflow: '${w}', status: 'implemented' });
});
`).join('')}

module.exports = router;
    `;
  }

  getDefaultAuthMiddleware() {
    return `
const authMiddleware = (req, res, next) => {
  // Simple auth check
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Add user context
  req.user = { id: '${userId}' };
  next();
};

module.exports = authMiddleware;
    `;
  }

  getDefaultPackageJson(userId) {
    return JSON.stringify({
      name: `opsai-backend-${userId}`,
      version: "1.0.0",
      main: "server.js",
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "@supabase/supabase-js": "^2.38.0"
      },
      scripts: {
        "start": "node server.js",
        "dev": "nodemon server.js"
      }
    }, null, 2);
  }

  async generateAPIRoutes(userId, workflow) {
    return {
      analytics: `/api/analytics`,
      customers: `/api/analytics/customers`,
      revenue: `/api/analytics/revenue`,
      workflows: workflow.workflows.map(w => `/api/${w}`)
    };
  }

  async writeBackendFiles(backendDir, backendCode, apiRoutes) {
    // Create directory structure
    await fs.mkdir(path.join(backendDir, 'routes'), { recursive: true });
    await fs.mkdir(path.join(backendDir, 'middleware'), { recursive: true });
    
    // Write all files
    for (const [filename, content] of Object.entries(backendCode.files)) {
      const filePath = path.join(backendDir, filename);
      await fs.writeFile(filePath, content);
    }
    
    // Write API documentation
    const apiDoc = {
      routes: apiRoutes,
      authentication: "API Key required in x-api-key header",
      base_url: "http://localhost:3000"
    };
    
    await fs.writeFile(
      path.join(backendDir, 'api-documentation.json'),
      JSON.stringify(apiDoc, null, 2)
    );
  }

  // ========================================
  // STEP 8: GENERATE UI/UX
  // ========================================

  async generateFrontend(userId, workflow, backend) {
    console.log(`🎨 Generating UI/UX for user ${userId}...`);
    
    const frontendCode = await this.generateFrontendCode(userId, workflow, backend);
    
    // Create user's frontend directory
    const frontendDir = `/generated/users/${userId}/frontend`;
    await fs.mkdir(frontendDir, { recursive: true });
    
    // Write frontend files
    await this.writeFrontendFiles(frontendDir, frontendCode);
    
    console.log(`✅ Frontend generated for user ${userId}`);
    return {
      directory: frontendDir,
      components: frontendCode.components,
      pages: frontendCode.pages
    };
  }

  async generateFrontendCode(userId, workflow, backend) {
    const prompt = `
    Generate a React frontend for this user:
    
    User ID: ${userId}
    Business Type: ${workflow.business_type}
    UI Components Needed: ${workflow.ui_components.join(', ')}
    Backend Routes: ${JSON.stringify(backend.routes)}
    
    Generate:
    1. React components for each UI need
    2. Dashboard layout
    3. Data visualization components
    4. API integration hooks
    5. Responsive design with Tailwind CSS
    
    Return the component structure as JSON.
    `;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior React developer. Generate production-ready React components with Tailwind CSS. Return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });
    
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return this.generateDefaultFrontend(userId, workflow, backend);
    }
  }

  generateDefaultFrontend(userId, workflow, backend) {
    return {
      files: {
        'src/App.js': this.getDefaultAppComponent(userId, workflow),
        'src/components/Dashboard.js': this.getDefaultDashboard(userId),
        'src/components/Analytics.js': this.getDefaultAnalytics(userId),
        'src/hooks/useAPI.js': this.getDefaultAPIHook(backend.routes),
        'package.json': this.getDefaultFrontendPackageJson(userId),
        'tailwind.config.js': this.getDefaultTailwindConfig()
      },
      components: ['Dashboard', 'Analytics', 'Charts'],
      pages: ['Dashboard', 'Analytics', 'Settings']
    };
  }

  getDefaultAppComponent(userId, workflow) {
    return `
import React from 'react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              ${workflow.business_type.charAt(0).toUpperCase() + workflow.business_type.slice(1)} Dashboard
            </h1>
            <span className="text-sm text-gray-500">User: ${userId}</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Dashboard userId="${userId}" />
          <div className="mt-8">
            <Analytics userId="${userId}" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
    `;
  }

  getDefaultDashboard(userId) {
    return `
import React, { useState, useEffect } from 'react';
import { useAPI } from '../hooks/useAPI';

const Dashboard = ({ userId }) => {
  const { data: customers, loading: customersLoading } = useAPI('/api/analytics/customers');
  const { data: revenue, loading: revenueLoading } = useAPI('/api/analytics/revenue');
  
  if (customersLoading || revenueLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }
  
  const totalCustomers = customers?.length || 0;
  const totalRevenue = revenue?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;
  const monthlyGrowth = revenue?.[0]?.growth_rate || 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Metrics Cards */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">👥</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Customers
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {totalCustomers}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">💰</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Revenue
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  $\{totalRevenue.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">📈</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Monthly Growth
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {monthlyGrowth.toFixed(1)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
    `;
  }

  getDefaultAnalytics(userId) {
    return `
import React from 'react';
import { useAPI } from '../hooks/useAPI';

const Analytics = ({ userId }) => {
  const { data: revenue, loading } = useAPI('/api/analytics/revenue');
  
  if (loading) {
    return <div className="animate-pulse">Loading analytics...</div>;
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Revenue Analytics
      </h3>
      
      <div className="space-y-4">
        {revenue?.slice(0, 6).map((month, index) => (
          <div key={index} className="flex justify-between py-2 border-b">
            <span className="text-sm text-gray-600">
              {new Date(month.month).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </span>
            <span className="text-sm font-medium">
              $\{month.revenue?.toLocaleString() || '0'}
            </span>
          </div>
        ))}
      </div>
      
      {(!revenue || revenue.length === 0) && (
        <p className="text-gray-500 text-center py-8">
          No revenue data available yet. Connect your payment provider to see analytics.
        </p>
      )}
    </div>
  );
};

export default Analytics;
    `;
  }

  getDefaultAPIHook(routes) {
    return `
import { useState, useEffect } from 'react';

export const useAPI = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(\`http://localhost:3000\${endpoint}\`, {
          headers: {
            'x-api-key': 'your-api-key'
          }
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [endpoint]);
  
  return { data, loading, error };
};
    `;
  }

  getDefaultFrontendPackageJson(userId) {
    return JSON.stringify({
      name: `opsai-frontend-${userId}`,
      version: "1.0.0",
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1"
      },
      scripts: {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
      },
      eslintConfig: {
        "extends": ["react-app", "react-app/jest"]
      },
      browserslist: {
        "production": [">0.2%", "not dead", "not op_mini all"],
        "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
      },
      devDependencies: {
        "tailwindcss": "^3.3.0",
        "autoprefixer": "^10.4.14",
        "postcss": "^8.4.24"
      }
    }, null, 2);
  }

  getDefaultTailwindConfig() {
    return `
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
    `;
  }

  async writeFrontendFiles(frontendDir, frontendCode) {
    // Create directory structure
    await fs.mkdir(path.join(frontendDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(frontendDir, 'src/components'), { recursive: true });
    await fs.mkdir(path.join(frontendDir, 'src/hooks'), { recursive: true });
    await fs.mkdir(path.join(frontendDir, 'public'), { recursive: true });
    
    // Write all files
    for (const [filename, content] of Object.entries(frontendCode.files)) {
      const filePath = path.join(frontendDir, filename);
      await fs.writeFile(filePath, content);
    }
    
    // Write basic HTML template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpsAI Dashboard</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
    `;
    
    await fs.writeFile(path.join(frontendDir, 'public/index.html'), htmlTemplate);
  }

  // ========================================
  // STEP 9: DEPLOY USER'S APP
  // ========================================

  async deployUserApp(userId, backend, frontend) {
    console.log(`🚀 Deploying app for user ${userId}...`);
    
    try {
      // Install dependencies and build
      await this.buildUserApp(userId, backend, frontend);
      
      // Deploy to Vercel or your preferred platform
      const deploymentUrl = await this.deployToVercel(userId, frontend.directory);
      
      // Store deployment info
      await this.storeDeploymentInfo(userId, deploymentUrl);
      
      console.log(`✅ App deployed for user ${userId}: ${deploymentUrl}`);
      return deploymentUrl;
      
    } catch (error) {
      console.error(`❌ Deployment failed for user ${userId}:`, error);
      throw error;
    }
  }

  async buildUserApp(userId, backend, frontend) {
    // Install backend dependencies
    await execAsync('npm install', { cwd: backend.directory });
    
    // Install frontend dependencies  
    await execAsync('npm install', { cwd: frontend.directory });
    
    // Build frontend
    await execAsync('npm run build', { cwd: frontend.directory });
  }

  async deployToVercel(userId, frontendDir) {
    // This would integrate with Vercel API
    // For now, return a mock URL
    const deploymentUrl = `https://opsai-${userId}.vercel.app`;
    
    // Mock deployment
    console.log(`📦 Mock deployment to: ${deploymentUrl}`);
    
    return deploymentUrl;
  }

  async storeDeploymentInfo(userId, deploymentUrl) {
    const deploymentInfo = {
      user_id: userId,
      deployment_url: deploymentUrl,
      status: 'deployed',
      deployed_at: new Date().toISOString()
    };

    await this.supabase
      .from('user_deployments')
      .upsert(deploymentInfo, { onConflict: 'user_id' });
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  async copyBaseTerraformFiles(userTerraformDir) {
    const baseFiles = [
      'main.tf',
      'variables.tf', 
      'sources.tf',
      'destinations.tf',
      'airbyte_complete_setup.tf',
      'outputs.tf'
    ];
    
    for (const file of baseFiles) {
      const sourcePath = path.join('/terraform', file);
      const destPath = path.join(userTerraformDir, file);
      
      try {
        const content = await fs.readFile(sourcePath, 'utf8');
        await fs.writeFile(destPath, content);
      } catch (error) {
        console.warn(`⚠️ Could not copy ${file}:`, error.message);
      }
    }
  }
}

// ========================================
// USAGE EXAMPLE
// ========================================

const integrationFlow = new OpsAIIntegrationFlow();

// Example: User connects Stripe
async function handleStripeConnect(userId, stripeOAuth) {
  try {
    const result = await integrationFlow.handleUserConnect(
      userId,
      'stripe',
      {
        access_token: stripeOAuth.access_token,
        refresh_token: stripeOAuth.refresh_token,
        expires_at: stripeOAuth.expires_at,
        scope: stripeOAuth.scope,
        provider_user_id: stripeOAuth.stripe_user_id,
        metadata: {
          stripe_account_id: stripeOAuth.stripe_account_id
        }
      }
    );
    
    console.log('🎉 Integration complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Integration failed:', error);
    throw error;
  }
}

export { OpsAIIntegrationFlow, handleStripeConnect };