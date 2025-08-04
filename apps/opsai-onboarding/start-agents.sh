#!/bin/bash

echo "🚀 Starting OpsAI Agent Service..."

# Check if .env exists
if [ ! -f "agent-service/.env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp agent-service/.env.example agent-service/.env
    echo "📝 Please edit agent-service/.env with your API keys"
    exit 1
fi

# Start services with Docker Compose
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.agents.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo "✅ Checking service status..."
curl -s http://localhost:8000/health || echo "⚠️  Agent service not responding yet"

echo "
🎉 Agent service is starting up!

📍 Endpoints:
   - Agent Service: http://localhost:8000
   - WebSocket: ws://localhost:8000/ws
   - API Docs: http://localhost:8000/docs

📚 Next steps:
   1. Check logs: docker-compose -f docker-compose.agents.yml logs -f
   2. Access the dashboard agents page
   3. Try the example commands below
"