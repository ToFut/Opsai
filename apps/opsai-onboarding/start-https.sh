#!/bin/bash

echo "🚀 Starting OPSAI Onboarding with HTTPS..."
echo ""
echo "⚠️  IMPORTANT: OAuth Redirect URLs"
echo "=================================="
echo ""
echo "You need to update your OAuth apps with this redirect URL:"
echo "👉 https://localhost:7250/api/oauth/callback"
echo ""
echo "Update these OAuth providers:"
echo "1. GitHub: https://github.com/settings/developers"
echo "2. Google: https://console.cloud.google.com/apis/credentials"
echo "3. Stripe: https://dashboard.stripe.com/settings/connect"
echo "4. Shopify: https://partners.shopify.com/"
echo "5. Calendly: Calendly Developer Portal"
echo ""
echo "Press Enter to continue..."
read

# Check if certificates exist
if [ ! -f certificates/localhost.crt ] || [ ! -f certificates/localhost.key ]; then
    echo "📜 Generating HTTPS certificates..."
    bash scripts/setup-https.sh
fi

# Start the HTTPS server
echo "🔐 Starting HTTPS server on https://localhost:7250"
node server-https.js