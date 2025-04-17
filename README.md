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
2. Review the system architecture and implementation plan in `/docs/product/product_features/overall_app_implementation`
3. Understand the development tickets in `/docs/development/MVP_Development_Tickets.md`

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Dr-Assistant/doc_assistant.git
   cd doc_assistant
   ```

2. Set up the development environment:
   ```bash
   # Install dependencies for backend services
   cd backend/auth_service
   npm install
   cd ../...

   # Install dependencies for frontend web
   cd frontend/web
   npm install
   cd ../..
   ```

3. Start the development environment:
   ```bash
   # Start the backend services
   docker-compose up -d

   # Start the frontend development server
   cd frontend/web
   npm start
   ```

4. Access the application at `http://localhost:3000`

### Development Workflow

Refer to the [Development Workflow](./docs/product/product_features/overall_app_implementation/Development_Workflow.md) document for detailed information on the development process, including branching strategy, code reviews, and testing procedures.

## Team

- **Rohith**: Product Research, Feature Feasibility, Doctor Interaction, Analytics
- **Anil**: Full Stack AI Engineer (AI Integration, Backend AI)
- **Kushal & Mourya**: Full Stack Engineers (System Design, Architecture, Frontend, Core Backend)