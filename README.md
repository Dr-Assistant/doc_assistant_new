# Dr. Assistant - AI-Powered Healthcare Solution

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

### Documentation

Start by reviewing the documentation in the `/docs` folder to understand the project scope and plans:

1. Read the product vision and features in `/docs/product`
2. Review the system architecture in `/docs/development/architecture`
3. Understand the development tickets in `/docs/development/MVP_Development_Tickets.md`

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- PostgreSQL
- MongoDB (optional for development)
- Redis (optional for development)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Dr-Assistant/doc_assistant.git
   cd doc_assistant
   ```

2. Install dependencies for all services:
   ```bash
   # Use the provided script to install all dependencies
   ./scripts/install-all.sh

   # Or install dependencies for specific services
   cd backend/auth_service
   npm install
   cd ../..

   cd frontend/web
   npm install
   cd ../..
   ```

3. Set up environment variables:
   ```bash
   # Copy example environment files for all services
   cp backend/auth_service/.env.example backend/auth_service/.env
   cp backend/user_service/.env.example backend/user_service/.env
   cp backend/patient_service/.env.example backend/patient_service/.env
   cp backend/schedule_service/.env.example backend/schedule_service/.env
   cp backend/api_gateway/.env.example backend/api_gateway/.env
   cp ai_services/voice_transcription/.env.example ai_services/voice_transcription/.env
   cp ai_services/clinical_note_generation/.env.example ai_services/clinical_note_generation/.env
   cp integration_services/abdm_integration/.env.example integration_services/abdm_integration/.env
   cp frontend/web/.env.example frontend/web/.env

   # Edit .env files with your configuration as needed
   ```

4. Set up the database:
   ```bash
   # Start the database services
   docker-compose up -d postgres mongodb redis

   # Wait for the services to be ready
   # You can check the status with:
   docker-compose ps
   ```

5. Start the development environment:
   ```bash
   # Start all backend services
   docker-compose up -d

   # Or start specific services
   docker-compose up -d auth_service user_service patient_service

   # Start the frontend development server
   cd frontend/web
   npm start
   ```

6. Access the application:
   - Web Application: http://localhost:3000
   - API Gateway: http://localhost:8000
   - Auth Service: http://localhost:8001
   - User Service: http://localhost:8002
   - Patient Service: http://localhost:8003
   - Schedule Service: http://localhost:8004
   - Voice Transcription Service: http://localhost:9001
   - Clinical Note Generation Service: http://localhost:9002
   - ABDM Integration Service: http://localhost:8101

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