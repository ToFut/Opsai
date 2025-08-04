#!/bin/bash

# Setup script for Airbyte OAuth with HTTPS

echo "🔧 Setting up Airbyte OAuth with HTTPS..."

# Option 1: Using ngrok (recommended for development)
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok found. Starting HTTPS tunnel..."
    # Start ngrok in background
    ngrok http 7250 > /dev/null &
    sleep 3
    
    # Get ngrok URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4)
    
    if [ -n "$NGROK_URL" ]; then
        echo "🌐 HTTPS tunnel created: $NGROK_URL"
        echo ""
        echo "📝 Update these in your Terraform/Airbyte configuration:"
        echo "   Redirect URL: $NGROK_URL/api/oauth/callback"
        echo ""
        echo "📝 Update .env file:"
        echo "   AIRBYTE_REDIRECT_URL=$NGROK_URL/api/oauth/callback"
    fi
else
    echo "❌ ngrok not found. Install it with: brew install ngrok"
    echo ""
    echo "Alternative: Use Terraform to provision an HTTPS endpoint"
fi

# Option 2: Using Terraform-managed proxy
echo ""
echo "🏗️ For production/Terraform setup:"
echo "1. Use AWS API Gateway or CloudFront to provide HTTPS endpoint"
echo "2. Configure Airbyte OAuth apps with production URLs"
echo "3. Use environment-specific redirect URLs"