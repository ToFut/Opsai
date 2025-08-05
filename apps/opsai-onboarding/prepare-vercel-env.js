const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key.trim()] = value.trim();
  }
});

// Important variables to set in Vercel
const requiredVars = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'AIRBYTE_API_URL',
  'AIRBYTE_API_KEY',
  'AIRBYTE_CLIENT_ID',
  'AIRBYTE_CLIENT_SECRET',
  'AIRBYTE_WORKSPACE_ID',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SHOPIFY_CLIENT_ID',
  'SHOPIFY_CLIENT_SECRET',
  'STRIPE_CLIENT_ID',
  'STRIPE_CLIENT_SECRET',
  'CALENDLY_CLIENT_ID',
  'CALENDLY_CLIENT_SECRET',
  'VERCEL_API_TOKEN'
];

console.log('📝 Environment variables to set in Vercel:\n');
console.log('Run these commands:\n');

requiredVars.forEach(key => {
  if (envVars[key]) {
    console.log(`vercel env add ${key} production`);
    console.log(`# Then paste: ${envVars[key]}`);
    console.log('');
  }
});

console.log('\n🚨 IMPORTANT: After deployment, update NEXT_PUBLIC_APP_URL:');
console.log('vercel env add NEXT_PUBLIC_APP_URL production');
console.log('# Then paste your Vercel URL: https://your-app.vercel.app');

console.log('\n📋 OAuth Redirect URL will be:');
console.log('https://your-app.vercel.app/api/oauth/callback');