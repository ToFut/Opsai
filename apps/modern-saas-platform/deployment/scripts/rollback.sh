#!/bin/bash
set -e

PREVIOUS_VERSION=${1:-"previous"}

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# Implementation depends on deployment platform
case "${DEPLOYMENT_PLATFORM:-docker}" in
  "docker")
    docker-compose -f deployment/docker-compose.prod.yml down
    docker tag techcorp-platform:$PREVIOUS_VERSION techcorp-platform:latest
    docker-compose -f deployment/docker-compose.prod.yml up -d
    ;;
  "kubernetes")
    kubectl rollout undo deployment/techcorp-platform-deployment
    ;;
  *)
    echo "⚠️  Manual rollback required for platform: $DEPLOYMENT_PLATFORM"
    ;;
esac

echo "✅ Rollback completed"