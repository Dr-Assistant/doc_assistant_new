# Dr. Assistant - AI-Powered Healthcare Solution( in-progress )

Dr. Assistant is an AI-powered application designed to streamline doctor workflows, reduce administrative burden, and improve patient care in the Indian healthcare system. The platform uses voice recognition, AI summarization, and intelligent scheduling to help doctors focus more on patients and less on paperwork.

## Project Overview

This repository contains documentation and development plans for the Dr. Assistant platform, which aims to address key challenges in the Indian healthcare system:

- High patient volumes and limited doctor time
- Excessive documentation burden
- Inefficient workflows and scheduling
- Limited access to comprehensive patient history

## Repository Structure

### Documentation

#### `/docs/product`
- **Doctor_App_Features.md**: Detailed description of the doctor-facing application features and UX
- **Product_Development_Plan.md**: Comprehensive product development plan including vision, goals, target audience, MVP definition, and timeline
- **product_features/overall_app_implementation/**: Comprehensive implementation documentation including system architecture, project structure, and development workflow

#### `/docs/development`
- **MVP_Development_Tickets.md**: Actionable development tickets for the MVP implementation

#### `/docs/market_research`
- **AI_Healthcare_Startup_Playbook.md**: Strategic analysis of the AI healthcare startup landscape in India

### Application Code

#### `/frontend`
- **web/**: React-based web application for desktop use
- **mobile/**: React Native mobile application for iOS and Android

#### `/backend`
- **api_gateway/**: API Gateway service for routing requests
- **auth_service/**: Authentication and authorization service
- **user_service/**: User management service
- **patient_service/**: Patient management service
- **schedule_service/**: Appointment scheduling service
- **encounter_service/**: Clinical encounter management service
- **task_service/**: Task management service
- **notification_service/**: Notification delivery service
- **document_service/**: Document management service
- **search_service/**: Search functionality service
- **analytics_service/**: Analytics and reporting service

#### `/ai_services`
- **voice_transcription/**: Voice-to-text transcription service
- **clinical_note_generation/**: AI-powered clinical note generation
- **prescription_generation/**: AI-powered prescription generation
- **pre_diagnosis_summary/**: Patient summary generation service
- **ai_orchestrator/**: Coordination service for AI workflows

#### `/integration_services`
- **abdm_integration/**: Integration with India's ABDM health data network
- **ehr_integration/**: Integration with EHR systems
- **lab_integration/**: Integration with laboratory systems
- **pharmacy_integration/**: Integration with pharmacy systems

#### `/infrastructure`
- **terraform/**: Infrastructure as Code configurations
- **kubernetes/**: Kubernetes deployment configurations
- **monitoring/**: Monitoring and observability configurations

#### `/scripts`
- **setup/**: Environment setup scripts
- **deployment/**: Deployment automation scripts
- **database/**: Database migration scripts

#### `/shared`
- **models/**: Shared data models
- **utils/**: Shared utility functions
- **constants/**: Shared constants
- **types/**: Shared type definitions

## Core Features

1. **Daily Dashboard**: At-a-glance view of schedule, pending tasks, and alerts
2. **Schedule & Appointment Management**: Calendar views and appointment details
3. **Pre-Consultation Preparation**: AI-generated patient summary before visits
4. **Voice-Assisted EMR & Prescription**: Automated documentation during consultations
5. **Patient Record Access**: Comprehensive view of patient history
6. **Post-Consultation Actions**: Digital signature and follow-up management
7. **Analytics & Insights**: Practice patterns and performance metrics

## Getting Started

### Prerequisites

**Only Docker is required!** No need to install Node.js, PostgreSQL, MongoDB, or any other dependencies locally.

- **Docker Desktop** - [Download here](https://docs.docker.com/desktop/)
- **Git** - For cloning the repository

### 🚀 Quick Start (Docker - Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd doc_assistant_new

# Start the application (one command!)
npm run start

# Or use the platform-specific scripts
# For Linux/Mac:
bash start.sh

# For Windows:
start.bat
```

This will automatically:
- ✅ Create .env file from template
- ✅ Start all databases (PostgreSQL, MongoDB, Redis)
- ✅ Start all backend services
- ✅ Start AI services
- ✅ Start frontend application
- ✅ Set up networking between services

### Alternative: Local Development (Advanced)

If you prefer to run services locally with npm:

```bash
# Start only databases with Docker
npm run start:databases

# Start services locally (requires Node.js 18+)
npm run dev:local
```

### Service URLs

Once started, access the application at:

- **🌐 Frontend Web App**: http://localhost:3001
- **🔗 API Gateway**: http://localhost:8000

#### Backend Services
- **🔐 Auth Service**: http://localhost:8020
- **👤 User Service**: http://localhost:8012
- **🎤 Voice Recording**: http://localhost:8013
- **📅 Schedule Service**: http://localhost:8014
- **📊 Dashboard Service**: http://localhost:8015
- **🏥 Encounter Service**: http://localhost:8006
- **🏥 Patient Service**: http://localhost:8017
- **📋 Task Service**: http://localhost:8016

#### AI Services
- **🤖 Clinical Notes**: http://localhost:9002
- **💊 Prescription Gen**: http://localhost:9003
- **📋 Pre-Diagnosis**: http://localhost:9004

#### Integration Services
- **🏛️ ABDM Integration**: http://localhost:8101

#### Databases
- **🐘 PostgreSQL**: localhost:5432
- **🍃 MongoDB**: localhost:27017
- **🔴 Redis**: localhost:6379

### 🛠️ Development Commands

#### Main Commands
```bash
# Start all services
npm run start

# Stop all services
npm run stop

# Restart all services
npm run restart

# Start with fresh builds
npm run start:build

# View status of all services
npm run status
```

#### Selective Service Management
```bash
# Start only databases
npm run start:databases

# Start backend services (includes databases)
npm run start:backend

# Start AI services
npm run start:ai

# Start frontend
npm run start:frontend
```

#### Logs and Monitoring
```bash
# View all logs
npm run logs

# View database logs
npm run logs:databases

# View backend service logs
npm run logs:backend

# View AI service logs
npm run logs:ai

# View frontend logs
npm run logs:frontend

# Check health of core services
npm run health
```

#### Cleanup Commands
```bash
# Clean containers and images
npm run clean

# Clean including volumes (removes all data)
npm run clean:volumes

# Complete cleanup (containers, images, volumes, node_modules)
npm run clean:all
```

#### Development Tools
```bash
# Run tests across all services
npm test

# Run linting across all services
npm run lint

# Build all services
npm run build
```

### Running Tests

```bash
# Run tests for a specific service
cd backend/auth_service
npm test

# Run frontend tests
cd frontend/web
npm test
```

### Troubleshooting

#### Database Connection Issues

If you encounter database connection issues:

1. Check if the database services are running:
   ```bash
   docker-compose ps
   ```

2. Verify the database credentials in your .env files match those in docker-compose.yml

3. For PostgreSQL issues:
   ```bash
   # Connect to the PostgreSQL container
   docker-compose exec postgres psql -U postgres -d dr_assistant

   # Check if the database exists
   \l

   # Check if tables exist
   \dt
   ```

4. For MongoDB issues:
   ```bash
   # Connect to the MongoDB container
   docker-compose exec mongodb mongo -u mongo -p mongo --authenticationDatabase admin dr_assistant

   # Check collections
   show collections
   ```

#### Service Startup Issues

If services fail to start:

1. Check the logs:
   ```bash
   docker-compose logs auth_service
   ```

2. Verify all dependencies are installed:
   ```bash
   cd backend/auth_service
   npm install
   ```

3. Check if required environment variables are set in your .env files

#### Frontend Build Issues

If the frontend fails to build:

1. Check for TypeScript errors:
   ```bash
   cd frontend/web
   npm run lint
   ```

2. Verify dependencies are installed:
   ```bash
   npm install
   ```

3. Clear the build cache:
   ```bash
   npm run clean
   ```

### Development Workflow

Refer to the [Development Workflow](./docs/product/product_features/overall_app_implementation/Development_Workflow.md) document for detailed information on the development process, including branching strategy, code reviews, and testing procedures.

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **Continuous Integration**: Runs linting, testing, and building on every pull request and push to main/develop branches
- **Continuous Deployment to Development**: Automatically deploys to the development environment when code is pushed to the develop branch
- **Continuous Deployment to Production**: Automatically deploys to the production environment when code is pushed to the main branch

For more information, see the [CI/CD Pipeline Documentation](./docs/development/CI_CD_Pipeline.md).

## Team

- **Rohith**: Product Research, Feature Feasibility, Doctor Interaction, Analytics
- **Anil**: Full Stack AI Engineer (AI Integration, Backend AI)
- **Kushal & Mourya**: Full Stack Engineers (System Design, Architecture, Frontend, Core Backend)
