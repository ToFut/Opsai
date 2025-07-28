#!/bin/bash

set -e

echo "🚀 Setting up CORE Platform development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🐳 Starting development services..."
docker-compose up -d postgres redis temporal prometheus grafana

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🗄️ Setting up database..."
# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp env.example .env
    echo "📝 Created .env file from template. Please update with your configuration."
fi

echo "🔧 Generating Prisma client..."
cd packages/database
pnpm db:generate

echo "🔄 Running database migrations..."
pnpm db:migrate

echo "🌱 Seeding database..."
pnpm db:seed

cd ../..

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Run 'pnpm dev' to start development servers"
echo "3. Run 'pnpm cli generate vertical insurance --config=configs/verticals/insurance.yml' to generate your first vertical"
echo ""
echo "🌐 Services available at:"
echo "- Temporal Web UI: http://localhost:8088"
echo "- Grafana: http://localhost:3000 (admin/admin)"
echo "- Prometheus: http://localhost:9090"
echo "- Airbyte: http://localhost:8001" 