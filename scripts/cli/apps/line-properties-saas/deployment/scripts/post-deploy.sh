#!/bin/bash
set -e

echo "🔄 Running post-deployment tasks..."

# Health check
echo "🩺 Performing health check..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -f -s "${HEALTH_CHECK_URL:-http://localhost:3000/health}" > /dev/null; then
    echo "✅ Application is healthy"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "⏳ Waiting for application to be ready... ($attempt/$max_attempts)"
  sleep 10
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Application failed to become healthy"
  exit 1
fi

echo "🎉 Deployment completed successfully!"