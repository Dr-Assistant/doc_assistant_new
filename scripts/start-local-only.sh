#!/bin/bash

# Dr. Assistant - Start Local Services Only (Use Existing Databases)
# This script starts all application services with npm run dev using existing Docker databases

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
    # Use PowerShell Test-NetConnection for Windows compatibility
    if powershell.exe -Command "Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet" 2>/dev/null; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=15  # Reduced attempts for faster startup
    local attempt=1

    print_status "Waiting for $service_name to be ready on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_success "$service_name is ready on port $port!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "$service_name may not be ready yet on port $port (continuing with other services)"
    return 1  # Return 1 but don't exit the script
}

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3

    print_service "Starting $service_name..."

    # Check if directory exists
    if [ ! -d "$service_path" ]; then
        print_warning "$service_name directory not found at $service_path. Skipping."
        return 0
    fi

    # Check if package.json exists
    if [ ! -f "$service_path/package.json" ]; then
        print_warning "$service_name package.json not found. Skipping."
        return 0
    fi

    # Start the service in background
    cd "$service_path"

    # Set common environment variables for backend services
    if [ "$service_name" != "frontend-web" ]; then
        export PORT=$port
        export NODE_ENV=development
        export DB_HOST=localhost
        export DB_PORT=${DB_PORT:-5434}
        export DB_NAME=dr_assistant
        export DB_USER=postgres
        export DB_PASSWORD=postgres
        export JWT_SECRET=your_jwt_secret_key_here_for_local_dev
        export REDIS_HOST=localhost
        export REDIS_PORT=${REDIS_PORT:-6380}
        export REDIS_URI=${REDIS_URI:-redis://localhost:6380}
        export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27019/dr_assistant}
        export AUTH_SERVICE_URL=http://localhost:8020
        export USER_SERVICE_URL=http://localhost:8012
        export PATIENT_SERVICE_URL=http://localhost:8017
        export SCHEDULE_SERVICE_URL=http://localhost:8014
        export VOICE_RECORDING_SERVICE_URL=http://localhost:8013
        export DASHBOARD_SERVICE_URL=http://localhost:8015
        export TASK_SERVICE_URL=http://localhost:8016

        # AI Services
        export CLINICAL_NOTE_SERVICE_URL=http://localhost:9002
        export PRESCRIPTION_SERVICE_URL=http://localhost:9003
        export PRE_DIAGNOSIS_SERVICE_URL=http://localhost:9004
        export VOICE_TRANSCRIPTION_SERVICE_URL=http://localhost:9001

        # Integration Services
        export ABDM_INTEGRATION_URL=http://localhost:8101

        # ABDM Integration specific environment variables (dummy values for local dev)
        export ABDM_BASE_URL=https://dev.abdm.gov.in/gateway
        export ABDM_CLIENT_ID=dummy_client_id_for_local_dev
        export ABDM_CLIENT_SECRET=dummy_client_secret_for_local_dev
        export ABDM_AUTH_URL=https://dev.abdm.gov.in/gateway/v0.5/sessions
        export CONSENT_CALLBACK_URL=http://localhost:8101/api/abdm/consent/callback
        export HEALTH_RECORD_CALLBACK_URL=http://localhost:8101/api/abdm/health-records/callback
        export TOKEN_ENCRYPTION_KEY=dummy_token_encryption_key_32_chars
        export DATA_ENCRYPTION_KEY=dummy_data_encryption_key_32_chars

        # API Keys (dummy values for local dev)
        export GOOGLE_SPEECH_API_KEY=dummy_google_speech_api_key
        export GOOGLE_GEMINI_API_KEY=dummy_google_gemini_api_key
        export GEMINI_MODEL=gemini-1.5-pro
    fi

    if [ "$service_name" = "frontend-web" ]; then
        PORT=$port npm start > "../../logs/${service_name}.log" 2>&1 &
    else
        npm run dev > "../../logs/${service_name}.log" 2>&1 &
    fi
    local pid=$!
    cd - > /dev/null

    # Store PID and name for cleanup
    SERVICE_PIDS+=($pid)
    SERVICE_NAMES+=("$service_name")

    print_info "$service_name started with PID $pid (logs: logs/${service_name}.log)"

    # Wait for service to be ready (but continue even if it fails)
    if [ -n "$port" ]; then
        wait_for_service "$service_name" "$port" || true  # Continue even if wait fails
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

    print_status "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "🚀 Starting Dr. Assistant Services Locally (Using Existing Databases)..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if databases are available
print_status "🔍 Checking database availability..."

# Check PostgreSQL (primary port 5434)
if check_port 5434; then
    print_success "PostgreSQL found on port 5434"
    export DB_PORT=5434
elif check_port 5433; then
    print_success "PostgreSQL found on port 5433"
    export DB_PORT=5433
elif check_port 5432; then
    print_success "PostgreSQL found on port 5432"
    export DB_PORT=5432
else
    print_warning "PostgreSQL not found on any expected port (5432, 5433, 5434)"
    print_info "Starting databases with Docker..."
    docker-compose -f docker-compose.databases.yml up -d
    sleep 10
    if check_port 5434; then
        print_success "PostgreSQL started on port 5434"
        export DB_PORT=5434
    else
        print_error "Failed to start PostgreSQL"
        exit 1
    fi
fi

# Check MongoDB (primary port 27019)
if check_port 27019; then
    print_success "MongoDB found on port 27019"
    export MONGODB_PORT=27019
    export MONGODB_URI="mongodb://localhost:27019/dr_assistant"
elif check_port 27018; then
    print_success "MongoDB found on port 27018"
    export MONGODB_PORT=27018
    export MONGODB_URI="mongodb://localhost:27018/dr_assistant"
elif check_port 27017; then
    print_success "MongoDB found on port 27017"
    export MONGODB_PORT=27017
    export MONGODB_URI="mongodb://localhost:27017/dr_assistant"
else
    print_warning "MongoDB not found on expected ports"
fi

# Check Redis (primary port 6380)
if check_port 6380; then
    print_success "Redis found on port 6380"
    export REDIS_PORT=6380
    export REDIS_URI="redis://localhost:6380"
elif check_port 6379; then
    print_success "Redis found on port 6379"
    export REDIS_PORT=6379
    export REDIS_URI="redis://localhost:6379"
else
    print_warning "Redis not found on expected ports"
fi

# Start backend services with npm run dev
print_status "🔧 Starting backend services..."

# Core backend services (using different ports to avoid Docker conflicts)
print_status "Starting core backend services..."
start_service "auth-service" "backend/auth_service" "8020"
start_service "user-service" "backend/user_service" "8012"
start_service "voice-recording-service" "backend/voice_recording_service" "8013"
start_service "schedule-service" "backend/schedule_service" "8014"
start_service "dashboard-service" "backend/dashboard_service" "8015"
start_service "task-service" "backend/task_service" "8016"
start_service "patient-service" "backend/patient_service" "8017"

# Start AI services
print_status "🤖 Starting AI services..."
start_service "clinical-note-generation" "ai_services/clinical_note_generation" "9002"
start_service "prescription-generation" "ai_services/prescription_generation" "9003"

# Start integration services
print_status "🔗 Starting integration services..."
start_service "abdm-integration" "integration_services/abdm_integration" "8101"

# Start frontend
print_status "🌐 Starting frontend..."
start_service "frontend-web" "frontend/web" "3001"

# All services started successfully
print_success "🎉 All services are now running locally!"
echo ""
print_status "📋 Service URLs:"
echo "  🔐 Auth Service:           http://localhost:8020"
echo "  👤 User Service:           http://localhost:8012"
echo "  🎤 Voice Recording:        http://localhost:8013"
echo "  📅 Schedule Service:       http://localhost:8014"
echo "  📊 Dashboard Service:      http://localhost:8015"
echo "  📋 Task Service:           http://localhost:8016"
echo "  🏥 Patient Service:        http://localhost:8017"
echo "  🤖 Clinical Notes:         http://localhost:9002"
echo "  💊 Prescription Gen:       http://localhost:9003"
echo "  🏛️  ABDM Integration:       http://localhost:8101"
echo "  🌐 Frontend Web App:       http://localhost:3001"
echo ""
print_status "🗄️  Using Existing Databases:"
echo "  🐘 PostgreSQL:            Available"
echo "  🍃 MongoDB:               Available"
echo "  🔴 Redis:                 Available"
echo ""
print_info "📝 Service logs are available in the 'logs/' directory"
print_info "🔍 Monitor logs: tail -f logs/[service-name].log"
print_warning "⚠️  Press Ctrl+C to stop all services"

# Keep the script running and wait for user to stop
while true; do
    sleep 1
done
