#!/bin/bash
set -e

echo "🔄 Running pre-deployment checks..."

# Check environment variables
required_vars=("NODE_ENV" "PORT" "DATABASE_URL" "JWT_SECRET" "GUESTY_CLIENT_ID" "GUESTY_CLIENT_SECRET" "NETLIFY_SITE_ID" "NETLIFY_AUTH_TOKEN" "RESEND_API_KEY" "REDIS_URL")

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

echo "✅ Pre-deployment checks passed"