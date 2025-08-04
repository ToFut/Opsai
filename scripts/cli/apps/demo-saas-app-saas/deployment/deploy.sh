#!/bin/bash
set -e

echo "🚀 Deploying Demo SaaS Application..."

# Build application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate

# Start application
echo "▶️  Starting application..."
npm start