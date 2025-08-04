#!/bin/bash

echo "🚀 Starting OpsAI Agent Service..."
echo ""

# Check if we're in the right directory
if [ ! -f "agent-service/main.py" ]; then
    echo "❌ Error: agent-service/main.py not found"
    echo "Please run this script from the opsai-onboarding directory"
    exit 1
fi

cd agent-service

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.11 or higher"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Warning: Redis is not running"
    echo "The agent service requires Redis for memory and caching"
    echo "Please start Redis: redis-server"
    echo ""
fi

# Set environment variables if .env exists
if [ -f ".env" ]; then
    echo "🔐 Loading environment variables..."
    export $(cat .env | xargs)
fi

# Check for required API keys
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
    echo "The agent service requires an OpenAI API key for AI processing"
    echo "Set it in .env file or export OPENAI_API_KEY='your-key'"
    echo ""
fi

echo "🚀 Starting agent service on port 8000..."
echo ""
echo "Available endpoints:"
echo "  - http://localhost:8000/            (Status)"
echo "  - http://localhost:8000/agents/list (Agent capabilities)"
echo "  - http://localhost:8000/docs        (API documentation)"
echo ""

# Start the service
python main.py