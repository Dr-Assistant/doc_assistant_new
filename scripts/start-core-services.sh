#!/bin/bash

# Dr. Assistant - Start Core Services Script
# This script starts only the core implemented services

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

print_status "Starting Dr. Assistant Core Services..."

# Check if we're in the right directory
if [ ! -f "docker-compose.dev.yml" ]; then
    print_error "docker-compose.dev.yml not found. Please run this script from the project root directory."
    exit 1
fi

# Start core services
print_status "Starting core services..."
docker-compose -f docker-compose.dev.yml up -d postgres mongodb redis auth_service user_service patient_service schedule_service dashboard_service task_service frontend_web

print_success "🎉 Core services are starting up!"
echo ""
print_status "Service URLs:"
echo "  🔐 Auth Service:      http://localhost:8001"
echo "  👤 User Service:      http://localhost:8002"
echo "  🏥 Patient Service:   http://localhost:8003"
echo "  📅 Schedule Service:  http://localhost:8004"
echo "  📊 Dashboard Service: http://localhost:8005"
echo "  📋 Task Service:      http://localhost:8006"
echo "  🌐 Frontend Web App:  http://localhost:3000"
echo ""
print_status "Infrastructure:"
echo "  🐘 PostgreSQL:       localhost:5433"
echo "  🍃 MongoDB:          localhost:27018"
echo "  🔴 Redis:            localhost:6379"
echo ""
print_status "Check status: docker-compose -f docker-compose.dev.yml ps"
print_status "View logs: docker-compose -f docker-compose.dev.yml logs -f [service_name]"
print_status "Stop services: ./scripts/stop-all-services.sh"
