#!/bin/bash

echo "🚀 Deploying B2B distribution..."

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Build the application
npm run build

echo "✅ B2B distribution is ready for deployment!"
echo "📁 Generated in: /Users/segevbin/Desktop/Opsai/apps/opsai-onboarding/generated-apps/b2b-distribution-1753911890358"
echo "🌐 To deploy to Vercel: vercel --prod"
