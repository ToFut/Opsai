#!/bin/bash
set -e

PREVIOUS_VERSION=${1:-"previous"}

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# Implementation depends on deployment platform
case "${DEPLOYMENT_PLATFORM:-docker}" in
  "docker")
    docker-compose -f deployment/docker-compose.prod.yml down
    docker tag demo-saas-app:$PREVIOUS_VERSION demo-saas-app:latest
    docker-compose -f deployment/docker-compose.prod.yml up -d
    ;;
  "kubernetes")
    kubectl rollout undo deployment/demo-saas-app-deployment
    ;;
  *)
    echo "⚠️  Manual rollback required for platform: $DEPLOYMENT_PLATFORM"
    ;;
esac

echo "✅ Rollback completed"