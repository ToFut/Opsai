#!/bin/bash
set -e

PREVIOUS_VERSION=${1:-"previous"}

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# Implementation depends on deployment platform
case "${DEPLOYMENT_PLATFORM:-docker}" in
  "docker")
    docker-compose -f deployment/docker-compose.prod.yml down
    docker tag test-platform:$PREVIOUS_VERSION test-platform:latest
    docker-compose -f deployment/docker-compose.prod.yml up -d
    ;;
  "kubernetes")
    kubectl rollout undo deployment/test-platform-deployment
    ;;
  *)
    echo "⚠️  Manual rollback required for platform: $DEPLOYMENT_PLATFORM"
    ;;
esac

echo "✅ Rollback completed"