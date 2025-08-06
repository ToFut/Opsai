const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// OAuth state management
const oauthStates = new Map();

// OAuth configurations
const OAUTH_CONFIGS = {
  stripe: {
    type: 'api_key',
    instructions: 'Get your API key from https://dashboard.stripe.com/apikeys'
  },
  quickbooks: {
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scopes: ['com.intuit.quickbooks.accounting'],
    clientId: process.env.QUICKBOOKS_CLIENT_ID || 'demo_client_id',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || 'demo_client_secret'
  },
  shopify: {
    authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    scopes: ['read_products', 'read_orders', 'read_customers'],
    clientId: process.env.SHOPIFY_CLIENT_ID || 'demo_client_id',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || 'demo_client_secret'
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'oauth-integration',
    timestamp: new Date().toISOString()
  });
});

// Initiate OAuth flow
app.post('/api/oauth/initiate', async (req, res) => {
  try {
    const { userId, provider, metadata } = req.body;
    
    console.log(`🔗 Initiating OAuth for user ${userId}, provider ${provider}`);
    
    // Handle API key providers
    if (provider === 'stripe') {
      return res.json({
        type: 'api_key',
        provider: 'stripe',
        message: 'Stripe uses API key authentication',
        instructions: OAUTH_CONFIGS.stripe.instructions
      });
    }
    
    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      return res.status(400).json({ error: `Provider ${provider} not configured` });
    }
    
    // Generate state
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, { userId, provider, timestamp: Date.now() });
    
    // Build OAuth URL
    const redirectUri = `http://localhost:3005/api/oauth/callback`;
    let authUrl = config.authUrl;
    
    // Handle Shopify special case
    if (provider === 'shopify' && metadata?.shopDomain) {
      authUrl = authUrl.replace('{shop}', metadata.shopDomain);
    }
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
      state,
      response_type: 'code'
    });
    
    res.json({
      authUrl: `${authUrl}?${params.toString()}`,
      state,
      message: 'Redirect user to authUrl to complete OAuth'
    });
    
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// OAuth callback handler
app.get('/api/oauth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    // Verify state
    const stateData = oauthStates.get(state);
    if (!stateData) {
      throw new Error('Invalid or expired state');
    }
    
    const { userId, provider } = stateData;
    oauthStates.delete(state);
    
    console.log(`✅ OAuth callback received for user ${userId}, provider ${provider}`);
    
    // For demo purposes, store mock credentials
    const { error: dbError } = await supabase
      .from('oauth_credentials')
      .upsert({
        user_id: userId,
        provider,
        access_token: `demo_token_${provider}_${Date.now()}`,
        refresh_token: `demo_refresh_${provider}_${Date.now()}`,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        scope: OAUTH_CONFIGS[provider]?.scopes?.join(' '),
        metadata: { code, demo: true },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to store credentials: ${dbError.message}`);
    }
    
    // Redirect to success page
    res.redirect(`http://localhost:3000/integrations/success?provider=${provider}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`http://localhost:3000/integrations/error?message=${encodeURIComponent(error.message)}`);
  }
});

// Connect with API key
app.post('/api/oauth/connect-api-key', async (req, res) => {
  try {
    const { userId, provider, apiKey, metadata } = req.body;
    
    console.log(`🔑 Connecting ${provider} with API key for user ${userId}`);
    
    // For Stripe, validate the key format
    if (provider === 'stripe' && !apiKey.startsWith('sk_')) {
      return res.status(400).json({ error: 'Invalid Stripe API key format' });
    }
    
    // Store credentials
    const { error: dbError } = await supabase
      .from('oauth_credentials')
      .upsert({
        user_id: userId,
        provider,
        access_token: apiKey,
        refresh_token: null,
        expires_at: null,
        scope: 'full',
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });
    
    if (dbError) {
      throw new Error(`Failed to store credentials: ${dbError.message}`);
    }
    
    // Trigger Terraform update (mock for now)
    console.log(`📦 Would trigger Terraform update for user ${userId}, provider ${provider}`);
    
    res.json({
      success: true,
      message: `${provider} connected successfully`,
      userId,
      provider
    });
    
  } catch (error) {
    console.error('API key connection error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get connection status
app.get('/api/oauth/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: credentials, error } = await supabase
      .from('oauth_credentials')
      .select('provider, updated_at')
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }
    
    const providers = ['stripe', 'quickbooks', 'shopify', 'netsuite', 'google'];
    const status = providers.map(provider => {
      const cred = credentials?.find(c => c.provider === provider);
      return {
        provider,
        connected: !!cred,
        lastUpdated: cred?.updated_at
      };
    });
    
    res.json({ userId, status });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(400).json({ error: error.message });
  }
});

// List all connections
app.get('/api/connections/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: connections, error } = await supabase
      .from('oauth_credentials')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Failed to fetch connections: ${error.message}`);
    }
    
    res.json({
      userId,
      connections: connections || [],
      count: connections?.length || 0
    });
    
  } catch (error) {
    console.error('Failed to get connections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete connection
app.delete('/api/connections/:userId/:provider', async (req, res) => {
  try {
    const { userId, provider } = req.params;
    
    const { error } = await supabase
      .from('oauth_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);
    
    if (error) {
      throw new Error(`Failed to delete connection: ${error.message}`);
    }
    
    res.json({
      success: true,
      message: `${provider} disconnected successfully`
    });
    
  } catch (error) {
    console.error('Failed to delete connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Demo endpoint to trigger sync
app.post('/api/connections/:userId/:provider/sync', async (req, res) => {
  try {
    const { userId, provider } = req.params;
    
    console.log(`🔄 Triggering sync for user ${userId}, provider ${provider}`);
    
    // In a real implementation, this would trigger Airbyte sync
    // For now, just return success
    res.json({
      success: true,
      message: `Sync triggered for ${provider}`,
      userId,
      provider,
      syncId: `sync_${Date.now()}`
    });
    
  } catch (error) {
    console.error('Failed to trigger sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.INTEGRATION_PORT || 3005;
app.listen(PORT, () => {
  console.log(`
🚀 OAuth Integration Service Running!
====================================
Port: ${PORT}
Health: http://localhost:${PORT}/health

Test Endpoints:
- POST http://localhost:${PORT}/api/oauth/initiate
- POST http://localhost:${PORT}/api/oauth/connect-api-key
- GET  http://localhost:${PORT}/api/oauth/status/:userId
- GET  http://localhost:${PORT}/api/connections/:userId

Ready to handle OAuth connections!
  `);
});