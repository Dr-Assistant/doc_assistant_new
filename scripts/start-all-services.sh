#!/bin/bash

# Dr. Assistant - Start All Services Script (Local Development)
# This script starts databases with Docker and all application services with npm run dev

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_service() {
    echo -e "${PURPLE}[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 $1${NC}"
}

print_info() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# Array to store background process PIDs
declare -a SERVICE_PIDS=()
declare -a SERVICE_NAMES=()

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_success "$service_name is ready on port $port"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "$service_name failed to start on port $port after $max_attempts attempts"
    return 1
}

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3

    print_service "Starting $service_name..."

    # Check if directory exists
    if [ ! -d "$service_path" ]; then
        print_error "Directory $service_path not found. Skipping $service_name."
        return 1
    fi

    # Check if package.json exists
    if [ ! -f "$service_path/package.json" ]; then
        print_error "package.json not found in $service_path. Skipping $service_name."
        return 1
    fi

    # Start the service in background
    cd "$service_path"
    npm run dev > "../logs/${service_name}.log" 2>&1 &
    local pid=$!
    cd - > /dev/null

    # Store PID and name for cleanup
    SERVICE_PIDS+=($pid)
    SERVICE_NAMES+=("$service_name")

    print_info "$service_name started with PID $pid (logs: logs/${service_name}.log)"

    # Wait for service to be ready
    if [ -n "$port" ]; then
        wait_for_service "$service_name" "$port"
    fi
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down services..."

    # Kill all background service processes
    for i in "${!SERVICE_PIDS[@]}"; do
        local pid=${SERVICE_PIDS[$i]}
        local name=${SERVICE_NAMES[$i]}
        if kill -0 $pid 2>/dev/null; then
            print_status "Stopping $name (PID: $pid)..."
            kill $pid 2>/dev/null || true
        fi
    done

    # Stop Docker databases
    print_status "Stopping Docker databases..."
    cd backend/database
    docker-compose down 2>/dev/null || true
    cd - > /dev/null

    print_status "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "🚀 Starting Dr. Assistant Application Services (Local Development Mode)..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Step 1: Start databases with Docker
print_status "📊 Starting databases with Docker..."
cd backend/database
if [ ! -f "docker-compose.yml" ]; then
    print_error "Database docker-compose.yml not found!"
    exit 1
fi

docker-compose up -d
cd - > /dev/null

# Wait for databases to be ready
print_status "⏳ Waiting for databases to be ready..."
wait_for_service "PostgreSQL" 5434
wait_for_service "MongoDB" 27019
wait_for_service "Redis" 6380

print_success "✅ Databases are ready!"

# Step 2: Start backend services with npm run dev
print_status "🔧 Starting backend services..."

# Core backend services
start_service "auth-service" "backend/auth_service" "8001"
start_service "user-service" "backend/user_service" "8002"
start_service "voice-recording-service" "backend/voice_recording_service" "8003"
start_service "schedule-service" "backend/schedule_service" "8004"
start_service "dashboard-service" "backend/dashboard_service" "8005"
start_service "task-service" "backend/task_service" "8006"
start_service "patient-service" "backend/patient_service" "8007"

# Step 3: Start AI services
print_status "🤖 Starting AI services..."
start_service "clinical-note-generation" "ai_services/clinical_note_generation" "9002"
start_service "prescription-generation" "ai_services/prescription_generation" "9003"

# Step 4: Start integration services
print_status "🔗 Starting integration services..."
start_service "abdm-integration" "integration_services/abdm_integration" "8101"

# Step 5: Start frontend
print_status "🌐 Starting frontend..."
start_service "frontend-web" "frontend/web" "3000"

# All services started successfully
print_success "🎉 All services are now running!"
echo ""
print_status "📋 Service URLs:"
echo "  🔐 Auth Service:           http://localhost:8001"
echo "  👤 User Service:           http://localhost:8002"
echo "  🎤 Voice Recording:        http://localhost:8003"
echo "  📅 Schedule Service:       http://localhost:8004"
echo "  📊 Dashboard Service:      http://localhost:8005"
echo "  📋 Task Service:           http://localhost:8006"
echo "  🏥 Patient Service:        http://localhost:8007"
echo "  🤖 Clinical Notes:         http://localhost:9002"
echo "  💊 Prescription Gen:       http://localhost:9003"
echo "  🏛️  ABDM Integration:       http://localhost:8101"
echo "  🌐 Frontend Web App:       http://localhost:3000"
echo ""
print_status "🗄️  Infrastructure:"
echo "  🐘 PostgreSQL:            localhost:5434"
echo "  🍃 MongoDB:               localhost:27019"
echo "  🔴 Redis:                 localhost:6380"
echo ""
print_info "📝 Service logs are available in the 'logs/' directory"
print_info "🔍 Monitor logs: tail -f logs/[service-name].log"
print_warning "⚠️  Press Ctrl+C to stop all services"

# Keep the script running and wait for user to stop
while true; do
    sleep 1
done
