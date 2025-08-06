import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { supabase, terraformService, airbyteService } from '../server';
import { logger } from '../utils/logger';

const router = Router();

// OAuth state management
const oauthStates = new Map<string, { userId: string; provider: string; timestamp: number }>();

// Clean up old states every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [state, data] of oauthStates.entries()) {
    if (data.timestamp < oneHourAgo) {
      oauthStates.delete(state);
    }
  }
}, 60 * 60 * 1000);

// OAuth Configuration per provider
const OAUTH_CONFIGS = {
  quickbooks: {
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scopes: ['com.intuit.quickbooks.accounting'],
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET
  },
  netsuite: {
    authUrl: 'https://system.netsuite.com/app/login/oauth2/authorize.nl',
    tokenUrl: 'https://system.netsuite.com/app/login/oauth2/token.nl',
    scopes: ['rest_webservices'],
    clientId: process.env.NETSUITE_CLIENT_ID,
    clientSecret: process.env.NETSUITE_CLIENT_SECRET
  },
  shopify: {
    authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    scopes: ['read_products', 'read_orders', 'read_customers'],
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }
};

// Schema validation
const InitiateOAuthSchema = z.object({
  userId: z.string(),
  provider: z.enum(['quickbooks', 'netsuite', 'shopify', 'google', 'stripe']),
  metadata: z.object({
    shopDomain: z.string().optional(),
    accountId: z.string().optional()
  }).optional()
});

const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional()
});

/**
 * POST /api/oauth/initiate
 * Initiate OAuth flow for a provider
 */
router.post('/initiate', async (req, res) => {
  try {
    const body = InitiateOAuthSchema.parse(req.body);
    const { userId, provider, metadata } = body;

    logger.info(`Initiating OAuth for user ${userId}, provider ${provider}`);

    // Special handling for Stripe (uses API key, not OAuth)
    if (provider === 'stripe') {
      return res.json({
        type: 'api_key',
        message: 'Stripe uses API key authentication. Please provide your secret key.',
        instructions: 'Find your API key at https://dashboard.stripe.com/apikeys'
      });
    }

    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    // Generate secure state
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, { userId, provider, timestamp: Date.now() });

    // Build authorization URL
    const redirectUri = `${process.env.APP_URL}/api/oauth/callback`;
    let authUrl = config.authUrl;

    // Handle Shopify's special case
    if (provider === 'shopify' && metadata?.shopDomain) {
      authUrl = authUrl.replace('{shop}', metadata.shopDomain);
    }

    const params = new URLSearchParams({
      client_id: config.clientId!,
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
      state,
      response_type: 'code',
      access_type: provider === 'google' ? 'offline' : 'online',
      prompt: provider === 'google' ? 'consent' : undefined
    } as any);

    const fullAuthUrl = `${authUrl}?${params.toString()}`;

    res.json({
      authUrl: fullAuthUrl,
      state
    });

  } catch (error: any) {
    logger.error('OAuth initiation error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/oauth/callback
 * Handle OAuth callback from provider
 */
router.get('/callback', async (req, res) => {
  try {
    const query = OAuthCallbackSchema.parse(req.query);
    
    if (query.error) {
      throw new Error(`OAuth error: ${query.error}`);
    }

    // Verify state
    const stateData = oauthStates.get(query.state);
    if (!stateData) {
      throw new Error('Invalid or expired state');
    }

    const { userId, provider } = stateData;
    oauthStates.delete(query.state);

    logger.info(`OAuth callback for user ${userId}, provider ${provider}`);

    // Exchange code for tokens
    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
    const redirectUri = `${process.env.APP_URL}/api/oauth/callback`;

    const tokenResponse = await fetch(config!.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: query.code,
        redirect_uri: redirectUri,
        client_id: config!.clientId!,
        client_secret: config!.clientSecret!
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Store credentials in Supabase
    const { error: dbError } = await supabase
      .from('oauth_credentials')
      .upsert({
        user_id: userId,
        provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? 
          new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        scope: tokens.scope,
        metadata: tokens,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (dbError) {
      throw new Error(`Failed to store credentials: ${dbError.message}`);
    }

    // Trigger Terraform update and Airbyte connection
    await terraformService.updateUserConfig(userId, provider, tokens);
    await airbyteService.createConnection(userId, provider);

    // Redirect to success page
    res.redirect(`${process.env.APP_URL}/integrations/success?provider=${provider}`);

  } catch (error: any) {
    logger.error('OAuth callback error:', error);
    res.redirect(`${process.env.APP_URL}/integrations/error?message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * POST /api/oauth/connect-api-key
 * Handle API key based connections (Stripe, etc)
 */
router.post('/connect-api-key', async (req, res) => {
  try {
    const { userId, provider, apiKey, metadata } = req.body;

    logger.info(`Connecting ${provider} with API key for user ${userId}`);

    // Validate the API key by making a test request
    if (provider === 'stripe') {
      const testResponse = await fetch('https://api.stripe.com/v1/charges?limit=1', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!testResponse.ok) {
        throw new Error('Invalid Stripe API key');
      }
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

    // Update Terraform and create Airbyte connection
    await terraformService.updateUserConfig(userId, provider, { access_token: apiKey });
    await airbyteService.createConnection(userId, provider);

    res.json({
      success: true,
      message: `${provider} connected successfully`
    });

  } catch (error: any) {
    logger.error('API key connection error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/oauth/status/:userId
 * Get OAuth connection status for a user
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: credentials, error } = await supabase
      .from('oauth_credentials')
      .select('provider, updated_at')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }

    const providers = ['stripe', 'quickbooks', 'netsuite', 'shopify', 'google'];
    const status = providers.map(provider => {
      const cred = credentials?.find(c => c.provider === provider);
      return {
        provider,
        connected: !!cred,
        lastUpdated: cred?.updated_at
      };
    });

    res.json({ status });

  } catch (error: any) {
    logger.error('Status check error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/oauth/refresh/:userId/:provider
 * Refresh OAuth tokens for a provider
 */
router.post('/refresh/:userId/:provider', async (req, res) => {
  try {
    const { userId, provider } = req.params;

    // Get current credentials
    const { data: creds, error: fetchError } = await supabase
      .from('oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (fetchError || !creds) {
      throw new Error('No credentials found');
    }

    if (!creds.refresh_token) {
      throw new Error('No refresh token available');
    }

    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
    
    // Refresh the token
    const refreshResponse = await fetch(config!.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: creds.refresh_token,
        client_id: config!.clientId!,
        client_secret: config!.clientSecret!
      })
    });

    if (!refreshResponse.ok) {
      throw new Error('Token refresh failed');
    }

    const newTokens = await refreshResponse.json();

    // Update stored credentials
    const { error: updateError } = await supabase
      .from('oauth_credentials')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || creds.refresh_token,
        expires_at: newTokens.expires_in ? 
          new Date(Date.now() + newTokens.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (updateError) {
      throw new Error(`Failed to update credentials: ${updateError.message}`);
    }

    res.json({
      success: true,
      message: 'Tokens refreshed successfully'
    });

  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(400).json({ error: error.message });
  }
});

export const OAuthRouter = router;