#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔑 Generating security keys for Opsai Platform...\n');

// Generate JWT Secret (64 bytes, base64 encoded)
const jwtSecret = crypto.randomBytes(64).toString('base64');

// Generate Encryption Key (32 bytes, hex encoded)
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Generate API Keys for different services
const stripeSecretKey = 'sk_test_' + crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
const stripePublishableKey = 'pk_test_' + crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

// Generate Supabase keys (placeholder format)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + crypto.randomBytes(32).toString('base64');
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + crypto.randomBytes(32).toString('base64');

// Generate other API keys
const progressiveApiKey = crypto.randomBytes(32).toString('hex');
const geicoClientId = crypto.randomBytes(16).toString('hex');
const geicoClientSecret = crypto.randomBytes(32).toString('hex');

// Generate Slack webhook URL (placeholder)
const slackWebhookUrl = 'https://hooks.slack.com/services/T' + crypto.randomBytes(8).toString('hex').toUpperCase() + '/B' + crypto.randomBytes(8).toString('hex').toUpperCase() + '/' + crypto.randomBytes(24).toString('hex');

// Generate Twilio credentials
const twilioAccountSid = 'AC' + crypto.randomBytes(16).toString('hex');
const twilioAuthToken = crypto.randomBytes(32).toString('base64');

console.log('✅ Generated security keys:\n');

console.log('🔐 JWT_SECRET:');
console.log(jwtSecret);
console.log('\n🔒 ENCRYPTION_KEY:');
console.log(encryptionKey);
console.log('\n💳 STRIPE_SECRET_KEY:');
console.log(stripeSecretKey);
console.log('\n💳 STRIPE_PUBLISHABLE_KEY:');
console.log(stripePublishableKey);
console.log('\n🏢 SUPABASE_ANON_KEY:');
console.log(supabaseAnonKey);
console.log('\n🏢 SUPABASE_SERVICE_ROLE_KEY:');
console.log(supabaseServiceKey);
console.log('\n🚗 PROGRESSIVE_API_KEY:');
console.log(progressiveApiKey);
console.log('\n🚗 GEICO_CLIENT_ID:');
console.log(geicoClientId);
console.log('\n🚗 GEICO_CLIENT_SECRET:');
console.log(geicoClientSecret);
console.log('\n💬 SLACK_WEBHOOK_URL:');
console.log(slackWebhookUrl);
console.log('\n📱 TWILIO_ACCOUNT_SID:');
console.log(twilioAccountSid);
console.log('\n📱 TWILIO_AUTH_TOKEN:');
console.log(twilioAuthToken);

// Create .env file with generated keys
const envContent = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/opsai_core"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="${supabaseAnonKey}"
SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceKey}"

# Temporal Configuration
TEMPORAL_HOST="localhost:7233"
TEMPORAL_NAMESPACE="default"

# Email Configuration
SMTP_HOST="smtp.resend.com"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-smtp-password"

# File Storage Configuration
STORAGE_PROVIDER="supabase"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Monitoring Configuration
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"

# Development Configuration
NODE_ENV="development"
LOG_LEVEL="debug"
PORT="7250"

# Security Configuration
JWT_SECRET="${jwtSecret}"
ENCRYPTION_KEY="${encryptionKey}"

# API Keys (for integrations)
STRIPE_SECRET_KEY="${stripeSecretKey}"
STRIPE_PUBLISHABLE_KEY="${stripePublishableKey}"

# Third-party API Keys
PROGRESSIVE_API_KEY="${progressiveApiKey}"
GEICO_CLIENT_ID="${geicoClientId}"
GEICO_CLIENT_SECRET="${geicoClientSecret}"

# Slack Configuration (for alerts)
SLACK_WEBHOOK_URL="${slackWebhookUrl}"

# Twilio Configuration (for SMS alerts)
TWILIO_ACCOUNT_SID="${twilioAccountSid}"
TWILIO_AUTH_TOKEN="${twilioAuthToken}"
TWILIO_PHONE_NUMBER="+1234567890"
`;

// Write to .env file
const envPath = path.join(process.cwd(), '.env');
fs.writeFileSync(envPath, envContent);

console.log('\n📝 Generated .env file with all keys!');
console.log(`📍 Location: ${envPath}`);
console.log('\n⚠️  IMPORTANT:');
console.log('- Keep these keys secure and never commit them to version control');
console.log('- Update the placeholder values (database URL, email, etc.) with your actual configuration');
console.log('- For production, use different keys and rotate them regularly');
console.log('\n🚀 You can now run: pnpm dev:setup'); 