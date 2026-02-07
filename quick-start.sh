#!/bin/bash

# Anaroo Quick Start Script
# This script sets up the development environment automatically

set -e

echo "🚀 Anaroo Quick Start"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo ""

# Build shared package
echo "🔨 Building shared package..."
npm run build --workspace=packages/shared 
echo ""

# Set up backend environment
if [ ! -f backend/.env ]; then
    echo "⚙️  Setting up backend environment..."
    cd backend
    cp .env.example .env
    
    # Generate JWT secret if openssl is available
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -hex 32)
        # Replace the JWT_SECRET in .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
        else
            # Linux
            sed -i "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
        fi
        echo "✅ Generated secure JWT secret"
    else
        echo "⚠️  OpenSSL not found - using default JWT secret (please change it!)"
    fi
    
    cd ..
    echo "✅ Created backend/.env"
else
    echo "✅ backend/.env already exists"
fi
echo ""

# Start databases
echo "🗄️  Starting MongoDB and Redis..."
docker run -d -p 27017:27017 --name anaroo-mongo mongo:7 2>/dev/null || echo "MongoDB container already exists"
docker start anaroo-mongo 2>/dev/null || true

docker run -d -p 6379:6379 --name anaroo-redis redis:7-alpine 2>/dev/null || echo "Redis container already exists"
docker start anaroo-redis 2>/dev/null || true

echo "✅ Databases started"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "📝 Configuration:"
echo "   - Backend .env: backend/.env"
echo "   - MongoDB: localhost:27017"
echo "   - Redis: localhost:6379"
echo ""
echo "🚀 To start development:"
echo "  1. Open two terminal windows"
echo "  2. In terminal 1, run: npm run dev:backend"
echo "  3. In terminal 2, run: npm run dev:frontend"
echo ""
echo "Or run both in one terminal:"
echo "  npm run dev"
echo ""
echo "📍 Application URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:3001"
echo ""
echo "🔧 For custom .env setup:"
echo "  ./setup-env.sh"
echo ""
echo "🐳 For production with Docker:"
echo "  docker-compose up --build"
echo ""
echo "📚 For more information:"
echo "  - Environment setup: ENV_SETUP.md"
echo "  - Development guide: DEVELOPMENT.md"
echo "  - README: README.md"