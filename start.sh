#!/bin/bash

# Dr. Assistant - Docker Compose Startup Script
# This script provides a simple way to start the application

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_success "Created .env file. Please update it with your API keys if needed."
fi

print_status "🚀 Starting Dr. Assistant with Docker Compose..."

# Start all services
docker-compose up -d

print_success "🎉 All services are starting!"
echo ""
print_status "📋 Service URLs:"
echo "  🌐 Frontend Web App:       http://localhost:3001"
echo "  🔗 API Gateway:            http://localhost:8000"
echo "  🔐 Auth Service:           http://localhost:8020"
echo "  👤 User Service:           http://localhost:8012"
echo "  🎤 Voice Recording:        http://localhost:8013"
echo "  📅 Schedule Service:       http://localhost:8014"
echo "  📊 Dashboard Service:      http://localhost:8015"
echo "  🏥 Encounter Service:      http://localhost:8006"
echo "  🏥 Patient Service:        http://localhost:8017"
echo "  📋 Task Service:           http://localhost:8016"
echo "  🤖 Clinical Notes:         http://localhost:9002"
echo "  💊 Prescription Gen:       http://localhost:9003"
echo "  📋 Pre-Diagnosis:          http://localhost:9004"
echo "  🏛️  ABDM Integration:       http://localhost:8101"
echo ""
print_status "🗄️  Databases:"
echo "  🐘 PostgreSQL:            localhost:5432"
echo "  🍃 MongoDB:               localhost:27017"
echo "  🔴 Redis:                 localhost:6379"
echo ""
print_status "📝 Useful commands:"
echo "  • View logs: npm run logs"
echo "  • Stop services: npm run stop"
echo "  • Check status: npm run status"
echo "  • View this help: npm run start"
echo ""
print_warning "⏳ Services are starting up. Please wait a few moments for all services to be ready."
print_status "🔍 You can monitor the startup progress with: npm run logs"
