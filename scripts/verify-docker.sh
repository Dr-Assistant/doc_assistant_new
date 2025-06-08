#!/bin/bash

# Dr. Assistant - Docker Verification Script
# This script verifies Docker installation and setup

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

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

print_status "🐳 Verifying Docker installation..."

# Check if Docker is installed
if command -v docker >/dev/null 2>&1; then
    print_success "Docker is installed"
    docker --version
else
    print_error "Docker is not installed or not in PATH"
    print_info "Please install Docker Desktop from: https://docs.docker.com/desktop/windows/install/"
    exit 1
fi

# Check if Docker Compose is available
if command -v docker-compose >/dev/null 2>&1; then
    print_success "Docker Compose is available"
    docker-compose --version
else
    print_warning "Docker Compose not found as separate command, checking if it's integrated..."
    if docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose is integrated with Docker CLI"
        docker compose version
    else
        print_error "Docker Compose is not available"
        exit 1
    fi
fi

# Check if Docker daemon is running
print_status "Checking if Docker daemon is running..."
if docker info >/dev/null 2>&1; then
    print_success "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    print_info "Please start Docker Desktop"
    exit 1
fi

# Test Docker functionality
print_status "Testing Docker functionality..."
if docker run --rm hello-world >/dev/null 2>&1; then
    print_success "Docker is working correctly"
else
    print_error "Docker test failed"
    print_info "Please check Docker Desktop settings and try again"
    exit 1
fi

# Check available resources
print_status "Checking Docker resources..."
DOCKER_INFO=$(docker system info 2>/dev/null)

if echo "$DOCKER_INFO" | grep -q "Total Memory"; then
    MEMORY=$(echo "$DOCKER_INFO" | grep "Total Memory" | awk '{print $3 $4}')
    print_info "Available memory: $MEMORY"
fi

if echo "$DOCKER_INFO" | grep -q "CPUs"; then
    CPUS=$(echo "$DOCKER_INFO" | grep "CPUs" | awk '{print $2}')
    print_info "Available CPUs: $CPUS"
fi

# Check if our project networks/volumes exist
print_status "Checking for existing project resources..."

if docker network ls | grep -q "dr_assistant_network"; then
    print_info "Project network 'dr_assistant_network' already exists"
else
    print_info "Project network 'dr_assistant_network' will be created when needed"
fi

if docker volume ls | grep -q "postgres_data"; then
    print_info "PostgreSQL volume already exists"
fi

if docker volume ls | grep -q "mongodb_data"; then
    print_info "MongoDB volume already exists"
fi

if docker volume ls | grep -q "redis_data"; then
    print_info "Redis volume already exists"
fi

print_success "🎉 Docker verification completed successfully!"
echo ""
print_info "Docker is ready for Dr. Assistant development"
print_info "You can now run: npm run start:databases"
