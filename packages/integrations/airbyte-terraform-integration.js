const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Base Terraform directory
const TERRAFORM_DIR = path.join(__dirname, '../../terraform');

/**
 * Main OAuth flow that triggers Terraform
 */
app.post('/api/oauth/connect-with-terraform', async (req, res) => {
  try {
    const { userId, provider, credentials } = req.body;
    
    console.log(`🔗 Connecting ${provider} for user ${userId} via Terraform`);
    
    // Step 1: Update terraform.tfvars with OAuth credentials
    await updateTerraformVars(provider, credentials);
    
    // Step 2: Run Terraform apply
    const terraformResult = await applyTerraform();
    
    // Step 3: Get connection details from Terraform output
    const connectionInfo = await getTerraformOutput();
    
    res.json({
      success: true,
      message: `${provider} connected via Terraform/Airbyte`,
      connectionInfo,
      terraformResult
    });
    
  } catch (error) {
    console.error('Terraform integration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update terraform.tfvars with OAuth credentials
 */
async function updateTerraformVars(provider, credentials) {
  const tfvarsPath = path.join(TERRAFORM_DIR, 'terraform.tfvars');
  
  // Read existing tfvars
  let tfvarsContent = await fs.readFile(tfvarsPath, 'utf8');
  
  // Update based on provider
  const updates = {
    stripe: {
      pattern: /stripe\s*=\s*{[^}]*}/s,
      replacement: `stripe = {
    client_id     = "${credentials.client_id || 'pk_live_'}"
    client_secret = "${credentials.api_key || credentials.client_secret}"
    enabled       = true
  }`
    },
    quickbooks: {
      pattern: /quickbooks\s*=\s*{[^}]*}/s,
      replacement: `quickbooks = {
    client_id     = "${credentials.client_id}"
    client_secret = "${credentials.access_token}"
    refresh_token = "${credentials.refresh_token}"
    realm_id      = "${credentials.realm_id}"
    enabled       = true
  }`
    },
    shopify: {
      pattern: /shopify\s*=\s*{[^}]*}/s,
      replacement: `shopify = {
    shop_domain   = "${credentials.shop_domain}"
    access_token  = "${credentials.access_token}"
    enabled       = true
  }`
    },
    netsuite: {
      pattern: /netsuite\s*=\s*{[^}]*}/s,
      replacement: `netsuite = {
    account_id    = "${credentials.account_id}"
    consumer_key  = "${credentials.consumer_key}"
    consumer_secret = "${credentials.consumer_secret}"
    token_id      = "${credentials.token_id}"
    token_secret  = "${credentials.token_secret}"
    enabled       = true
  }`
    }
  };
  
  if (updates[provider]) {
    tfvarsContent = tfvarsContent.replace(
      updates[provider].pattern, 
      updates[provider].replacement
    );
    
    // Write updated content
    await fs.writeFile(tfvarsPath, tfvarsContent);
    console.log(`✅ Updated terraform.tfvars for ${provider}`);
  }
}

/**
 * Run Terraform apply
 */
async function applyTerraform() {
  console.log('🚀 Running Terraform apply...');
  
  try {
    // Run terraform plan first
    const { stdout: planOut } = await execAsync(
      'terraform plan -out=tfplan',
      { cwd: TERRAFORM_DIR }
    );
    
    console.log('Plan output:', planOut.slice(0, 500));
    
    // Apply the plan
    const { stdout: applyOut } = await execAsync(
      'terraform apply -auto-approve tfplan',
      { 
        cwd: TERRAFORM_DIR,
        timeout: 300000 // 5 minutes
      }
    );
    
    console.log('✅ Terraform apply successful');
    return { success: true, output: applyOut.slice(-1000) };
    
  } catch (error) {
    console.error('Terraform apply failed:', error);
    throw new Error(`Terraform apply failed: ${error.message}`);
  }
}

/**
 * Get Terraform outputs
 */
async function getTerraformOutput() {
  try {
    const { stdout } = await execAsync(
      'terraform output -json',
      { cwd: TERRAFORM_DIR }
    );
    
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Failed to get Terraform output:', error);
    return {};
  }
}

/**
 * Check Airbyte connection status via Terraform state
 */
app.get('/api/terraform/status', async (req, res) => {
  try {
    const { stdout } = await execAsync(
      'terraform state list',
      { cwd: TERRAFORM_DIR }
    );
    
    const resources = stdout.split('\n').filter(r => r);
    
    // Get detailed info for each connection
    const connections = [];
    for (const resource of resources) {
      if (resource.includes('airbyte_connection')) {
        const { stdout: details } = await execAsync(
          `terraform state show ${resource}`,
          { cwd: TERRAFORM_DIR }
        );
        
        // Parse connection details
        const idMatch = details.match(/connection_id\s+=\s+"([^"]+)"/);
        const statusMatch = details.match(/status\s+=\s+"([^"]+)"/);
        
        connections.push({
          resource,
          connectionId: idMatch ? idMatch[1] : null,
          status: statusMatch ? statusMatch[1] : null
        });
      }
    }
    
    res.json({
      terraformResources: resources,
      airbyteConnections: connections
    });
    
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger Airbyte sync via Terraform
 */
app.post('/api/terraform/sync/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    console.log(`🔄 Triggering sync for ${provider} via Terraform`);
    
    // Taint the connection to force recreation (which triggers sync)
    await execAsync(
      `terraform taint airbyte_connection.${provider}_connection`,
      { cwd: TERRAFORM_DIR }
    );
    
    // Apply to recreate
    await applyTerraform();
    
    res.json({
      success: true,
      message: `Sync triggered for ${provider}`
    });
    
  } catch (error) {
    console.error('Sync trigger failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Read current Terraform configuration
 */
app.get('/api/terraform/config', async (req, res) => {
  try {
    const tfvarsPath = path.join(TERRAFORM_DIR, 'terraform.tfvars');
    const tfvarsContent = await fs.readFile(tfvarsPath, 'utf8');
    
    // Parse oauth_providers section
    const oauthMatch = tfvarsContent.match(/oauth_providers\s*=\s*{([^}]*)}/s);
    
    res.json({
      tfvarsPath,
      hasOAuthConfig: !!oauthMatch,
      providers: ['stripe', 'quickbooks', 'shopify', 'netsuite', 'google']
        .map(p => ({
          name: p,
          configured: tfvarsContent.includes(`${p} =`)
        }))
    });
    
  } catch (error) {
    console.error('Config read failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize Terraform if needed
 */
app.post('/api/terraform/init', async (req, res) => {
  try {
    console.log('Initializing Terraform...');
    
    const { stdout, stderr } = await execAsync(
      'terraform init',
      { cwd: TERRAFORM_DIR }
    );
    
    res.json({
      success: true,
      output: stdout,
      warnings: stderr
    });
    
  } catch (error) {
    console.error('Terraform init failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'airbyte-terraform-integration',
    terraformDir: TERRAFORM_DIR,
    timestamp: new Date().toISOString()
  });
});

const PORT = 3006;
app.listen(PORT, () => {
  console.log(`
🚀 Airbyte-Terraform Integration Service
========================================
Port: ${PORT}
Terraform Dir: ${TERRAFORM_DIR}

This service integrates with your existing Terraform setup:
1. Updates terraform.tfvars with OAuth credentials
2. Runs terraform apply to create Airbyte connections
3. Monitors connection status via terraform state

Endpoints:
- POST /api/oauth/connect-with-terraform - Connect provider via Terraform
- GET  /api/terraform/status - Check Terraform/Airbyte status
- POST /api/terraform/sync/:provider - Trigger Airbyte sync
- GET  /api/terraform/config - View current configuration
- POST /api/terraform/init - Initialize Terraform

Ready to manage Airbyte via Terraform!
  `);
});