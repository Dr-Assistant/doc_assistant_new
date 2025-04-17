# Project Structure Blueprint

## Overview

This document outlines the complete project structure for the Dr. Assistant application, serving as a blueprint for development. It defines the organization of code, configuration, documentation, and resources to support the application's architecture and development workflow.

## Project Structure

```
doc_assistant/                      # Root directory
│
├── .github/                        # GitHub specific files
│   ├── workflows/                  # CI/CD workflow definitions
│   │   ├── ci.yml                  # Continuous Integration workflow
│   │   ├── cd-staging.yml          # Continuous Deployment to staging
│   │   └── cd-production.yml       # Continuous Deployment to production
│   └── ISSUE_TEMPLATE/             # Templates for GitHub issues
│
├── docs/                           # Documentation
│   ├── development/                # Development documentation
│   ├── market_research/            # Market research and analysis
│   └── product/                    # Product documentation
│       ├── product_features/       # Feature documentation
│       └── product_vision/         # Product vision and strategy
│
├── frontend/                       # Frontend applications
│   ├── web/                        # Web application (React)
│   │   ├── public/                 # Static assets
│   │   ├── src/                    # Source code
│   │   │   ├── assets/             # Images, fonts, etc.
│   │   │   ├── components/         # Reusable UI components
│   │   │   │   ├── common/         # Common components
│   │   │   │   ├── dashboard/      # Dashboard components
│   │   │   │   ├── patient/        # Patient-related components
│   │   │   │   ├── schedule/       # Schedule components
│   │   │   │   ├── consultation/   # Consultation components
│   │   │   │   └── settings/       # Settings components
│   │   │   ├── contexts/           # React contexts
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── layouts/            # Page layouts
│   │   │   ├── pages/              # Page components
│   │   │   │   ├── auth/           # Authentication pages
│   │   │   │   ├── dashboard/      # Dashboard pages
│   │   │   │   ├── patients/       # Patient management pages
│   │   │   │   ├── schedule/       # Schedule management pages
│   │   │   │   ├── consultation/   # Consultation pages
│   │   │   │   └── settings/       # Settings pages
│   │   │   ├── services/           # API service clients
│   │   │   ├── store/              # State management
│   │   │   ├── styles/             # Global styles
│   │   │   ├── types/              # TypeScript type definitions
│   │   │   ├── utils/              # Utility functions
│   │   │   ├── App.tsx             # Main App component
│   │   │   ├── index.tsx           # Entry point
│   │   │   └── routes.tsx          # Application routes
│   │   ├── .eslintrc.js            # ESLint configuration
│   │   ├── package.json            # Dependencies and scripts
│   │   ├── tsconfig.json           # TypeScript configuration
│   │   └── README.md               # Frontend documentation
│   │
│   └── mobile/                     # Mobile application (React Native)
│       ├── android/                # Android-specific files
│       ├── ios/                    # iOS-specific files
│       ├── src/                    # Source code (similar structure to web)
│       ├── package.json            # Dependencies and scripts
│       └── README.md               # Mobile app documentation
│
├── backend/                        # Backend services
│   ├── api_gateway/                # API Gateway service
│   │   ├── src/                    # Source code
│   │   ├── Dockerfile              # Docker configuration
│   │   └── README.md               # Service documentation
│   │
│   ├── auth_service/               # Authentication service
│   │   ├── src/                    # Source code
│   │   │   ├── controllers/        # Request handlers
│   │   │   ├── middleware/         # Middleware functions
│   │   │   ├── models/             # Data models
│   │   │   ├── routes/             # API routes
│   │   │   ├── services/           # Business logic
│   │   │   ├── utils/              # Utility functions
│   │   │   ├── app.js              # Application setup
│   │   │   └── server.js           # Server entry point
│   │   ├── tests/                  # Unit and integration tests
│   │   ├── Dockerfile              # Docker configuration
│   │   ├── package.json            # Dependencies and scripts
│   │   └── README.md               # Service documentation
│   │
│   ├── user_service/               # User management service
│   ├── patient_service/            # Patient management service
│   ├── schedule_service/           # Schedule management service
│   ├── encounter_service/          # Encounter/consultation service
│   ├── task_service/               # Task management service
│   ├── notification_service/       # Notification service
│   ├── document_service/           # Document management service
│   ├── search_service/             # Search service
│   └── analytics_service/          # Analytics service
│
├── ai_services/                    # AI-related services
│   ├── voice_transcription/        # Voice transcription service
│   │   ├── src/                    # Source code
│   │   ├── models/                 # ML models or model configs
│   │   ├── tests/                  # Tests
│   │   ├── Dockerfile              # Docker configuration
│   │   └── README.md               # Service documentation
│   │
│   ├── clinical_note_generation/   # Clinical note generation service
│   ├── prescription_generation/    # Prescription generation service
│   ├── pre_diagnosis_summary/      # Pre-diagnosis summary service
│   └── ai_orchestrator/            # AI orchestration service
│
├── integration_services/           # External integration services
│   ├── abdm_integration/           # ABDM integration service
│   ├── ehr_integration/            # EHR integration service
│   ├── lab_integration/            # Lab system integration service
│   └── pharmacy_integration/       # Pharmacy integration service
│
├── infrastructure/                 # Infrastructure as Code
│   ├── terraform/                  # Terraform configurations
│   │   ├── environments/           # Environment-specific configs
│   │   │   ├── dev/                # Development environment
│   │   │   ├── staging/            # Staging environment
│   │   │   └── prod/               # Production environment
│   │   └── modules/                # Reusable Terraform modules
│   │
│   ├── kubernetes/                 # Kubernetes configurations
│   │   ├── base/                   # Base configurations
│   │   └── overlays/               # Environment-specific overlays
│   │       ├── dev/                # Development environment
│   │       ├── staging/            # Staging environment
│   │       └── prod/               # Production environment
│   │
│   └── monitoring/                 # Monitoring configurations
│       ├── prometheus/             # Prometheus configurations
│       ├── grafana/                # Grafana dashboards
│       └── loki/                   # Loki configurations
│
├── scripts/                        # Utility scripts
│   ├── setup/                      # Setup scripts
│   ├── deployment/                 # Deployment scripts
│   └── database/                   # Database migration scripts
│
├── shared/                         # Shared code and resources
│   ├── models/                     # Shared data models
│   ├── utils/                      # Shared utility functions
│   ├── constants/                  # Shared constants
│   └── types/                      # Shared type definitions
│
├── .gitignore                      # Git ignore file
├── .editorconfig                   # Editor configuration
├── docker-compose.yml              # Local development environment
├── docker-compose.prod.yml         # Production Docker configuration
├── README.md                       # Project overview
└── LICENSE                         # License information
```

## Key Components Description

### 1. Frontend Applications

#### Web Application (`frontend/web/`)

The web application is built using React and TypeScript, providing a responsive interface for desktop use in clinics.

- **Key Technologies**: React, TypeScript, React Router, Styled Components/Tailwind CSS
- **State Management**: Context API or Redux (depending on complexity)
- **API Communication**: Axios or Fetch API with custom hooks
- **Component Structure**: Follows Atomic Design principles with reusable components

#### Mobile Application (`frontend/mobile/`)

The mobile application is built using React Native, providing a native experience for iOS and Android devices.

- **Key Technologies**: React Native, TypeScript, React Navigation
- **State Management**: Context API or Redux (consistent with web app)
- **Platform-Specific Code**: Minimal, with most logic shared between platforms
- **Offline Support**: Local storage for critical functionality

### 2. Backend Services

Each backend service follows a microservice architecture pattern, with its own database and API. Services communicate through well-defined interfaces.

#### Common Service Structure

Each service follows a similar structure:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Models**: Define data structures and database schemas
- **Routes**: Define API endpoints
- **Middleware**: Handle cross-cutting concerns (authentication, logging, etc.)
- **Utils**: Utility functions
- **Tests**: Unit and integration tests

#### Key Services

- **API Gateway**: Routes requests to appropriate services, handles authentication
- **Auth Service**: Manages user authentication and authorization
- **User Service**: Manages doctor profiles and preferences
- **Patient Service**: Handles patient demographics and medical history
- **Schedule Service**: Manages appointments and doctor availability
- **Encounter Service**: Handles patient visits, clinical notes, and prescriptions
- **Task Service**: Manages pending tasks and follow-up items
- **Notification Service**: Manages notifications across channels
- **Document Service**: Handles document storage and retrieval
- **Search Service**: Provides search functionality across the application
- **Analytics Service**: Collects and processes usage and performance metrics

### 3. AI Services

Specialized services that implement AI-powered features of the application.

- **Voice Transcription**: Converts doctor-patient conversations to text
- **Clinical Note Generation**: Creates structured SOAP notes from transcriptions
- **Prescription Generation**: Extracts and formats prescription details
- **Pre-Diagnosis Summary**: Generates patient summaries from historical data
- **AI Orchestrator**: Coordinates workflows across AI services

### 4. Integration Services

Services that connect with external systems and APIs.

- **ABDM Integration**: Interfaces with India's ABDM health data network
- **EHR Integration**: Connects with hospital/clinic EHR systems
- **Lab Integration**: Connects with laboratory information systems
- **Pharmacy Integration**: Interfaces with pharmacy management systems

### 5. Infrastructure

Infrastructure as Code (IaC) configurations for deploying and managing the application.

- **Terraform**: Provisions cloud resources (VMs, databases, networking)
- **Kubernetes**: Orchestrates containerized services
- **Monitoring**: Configures observability tools (Prometheus, Grafana, Loki)

### 6. Shared Resources

Code and resources shared across multiple services.

- **Models**: Common data models and DTOs
- **Utils**: Shared utility functions
- **Constants**: Application-wide constants
- **Types**: Shared TypeScript type definitions

## Database Schema Overview

The application uses multiple databases for different services:

### PostgreSQL (Relational Data)

Used for structured data with well-defined relationships:

- Users and authentication
- Patients and demographics
- Appointments and scheduling
- Tasks and follow-ups

### MongoDB (Document Store)

Used for semi-structured data with flexible schemas:

- Clinical notes
- AI-generated summaries
- Prescriptions
- Patient questionnaire responses

### Redis (Cache)

Used for:

- Session management
- Frequently accessed data caching
- Rate limiting
- Temporary data storage

### Object Storage

Used for:

- Audio recordings of consultations
- Document attachments
- Images and scans
- Backup files

## Development Workflow

### Local Development

1. Clone the repository
2. Run `docker-compose up` to start all services locally
3. Access the web application at `http://localhost:3000`
4. Access service APIs at their respective ports

### Testing

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user flows
- **Performance Tests**: Test system performance under load

### Continuous Integration/Continuous Deployment (CI/CD)

1. Push code to feature branch
2. CI pipeline runs tests and quality checks
3. Create pull request for code review
4. Merge to main branch triggers deployment to staging
5. Manual approval promotes to production

## Security Considerations

- **Authentication**: OAuth 2.0 / OpenID Connect
- **Authorization**: Role-Based Access Control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **API Security**: Rate limiting, input validation, CORS
- **Audit Logging**: Comprehensive logging of all actions
- **Compliance**: HIPAA, DPDP Act (India)

## Scalability Approach

- **Horizontal Scaling**: Add more instances of stateless services
- **Database Scaling**: Replication, sharding, and read replicas
- **Caching Strategy**: Multi-level caching for frequently accessed data
- **Asynchronous Processing**: Use message queues for background tasks
- **CDN**: Distribute static assets globally

## Monitoring and Observability

- **Metrics**: Service and business metrics collection
- **Logging**: Centralized, structured logging
- **Tracing**: Distributed tracing across services
- **Alerting**: Automated alerts for system issues
- **Dashboards**: Real-time monitoring dashboards

## Conclusion

This project structure provides a comprehensive blueprint for developing the Dr. Assistant application. It follows modern best practices for microservices architecture, frontend development, and DevOps, while addressing the specific requirements of a healthcare application with AI capabilities.

The structure is designed to be modular and scalable, allowing teams to work independently on different components while maintaining a cohesive overall system. It also provides a solid foundation for future expansion and feature development.
