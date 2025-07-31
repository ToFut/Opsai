#!/bin/bash
set -e

echo "🔄 Running pre-deployment checks..."

# Check environment variables
required_vars=("NODE_ENV" "PORT" "DATABASE_URL" "JWT_SECRET")

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

echo "✅ Pre-deployment checks passed"