# Pre-Diagnosis Summary Service

## Overview

The Pre-Diagnosis Summary Service is an AI-powered microservice that generates comprehensive pre-consultation summaries for healthcare providers. It integrates patient data from multiple sources including local records, ABDM (Ayushman Bharat Digital Mission) health records, and patient questionnaires to create actionable insights for doctors before patient consultations.

## Features

### Core Functionality
- **Multi-Source Data Integration**: Combines local patient records, ABDM health records, and questionnaire responses
- **AI-Powered Analysis**: Uses Google Gemini AI to generate intelligent pre-diagnosis summaries
- **Risk Assessment**: Identifies and prioritizes risk factors based on patient data
- **Urgency Classification**: Automatically determines consultation urgency levels
- **Recommendation Engine**: Provides actionable recommendations for healthcare providers

### Key Components
- **Medical History Processing**: Extracts and analyzes chronic conditions, past medical history
- **Medication Analysis**: Reviews current medications, identifies potential interactions
- **Allergy Management**: Highlights critical allergies and contraindications
- **Vital Signs Integration**: Incorporates latest vital signs and BMI calculations
- **Questionnaire Processing**: Analyzes patient-reported symptoms and concerns

## Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Engine**: Google Gemini 1.5 Pro
- **Authentication**: JWT-based authentication
- **Testing**: Jest with Supertest
- **Containerization**: Docker

### Service Dependencies
- **Auth Service** (port 8001): User authentication and authorization
- **Patient Service** (port 8007): Patient demographics and medical records
- **ABDM Integration Service** (port 8101): Health records from ABDM network
- **MongoDB**: Data persistence and caching

## API Endpoints

### Summary Generation
```
POST /api/pre-diagnosis/generate
```
Generate a new pre-diagnosis summary for a patient.

**Request Body:**
```json
{
  "patientId": "uuid",
  "encounterId": "uuid",
  "appointmentId": "uuid",
  "questionnaireData": {
    "chiefComplaint": "string",
    "symptoms": "string",
    "duration": "string"
  },
  "priority": "low|medium|high|urgent"
}
```

### Summary Retrieval
```
GET /api/pre-diagnosis/:summaryId
GET /api/pre-diagnosis/patient/:patientId
GET /api/pre-diagnosis/doctor/:doctorId
GET /api/pre-diagnosis/my/recent
GET /api/pre-diagnosis/urgent
```

### Summary Management
```
PATCH /api/pre-diagnosis/:summaryId/status
DELETE /api/pre-diagnosis/:summaryId
GET /api/pre-diagnosis/stats/:doctorId
```

## Data Models

### Pre-Diagnosis Summary
```javascript
{
  patientId: String,
  encounterId: String,
  doctorId: String,
  status: "generating|completed|failed|expired",
  medicalHistory: [MedicalHistorySchema],
  currentMedications: [MedicationSchema],
  allergies: [AllergySchema],
  vitalSigns: VitalSignsSchema,
  questionnaireResponses: [QuestionnaireResponseSchema],
  aiSummary: {
    keyFindings: [String],
    riskFactors: [String],
    recommendations: [String],
    urgencyLevel: "low|medium|high|urgent",
    confidenceScore: Number,
    processingTime: Number
  }
}
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Google Gemini API Key
- Docker (for containerized deployment)

### Environment Variables
```bash
# Server Configuration
PORT=9004
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dr_assistant

# AI Configuration
GOOGLE_GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-1.5-pro

# Service URLs
AUTH_SERVICE_URL=http://localhost:8001
PATIENT_SERVICE_URL=http://localhost:8007
ABDM_SERVICE_URL=http://localhost:8101

# Security
JWT_SECRET=your_jwt_secret
```

### Local Development
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Docker Deployment
```bash
# Build image
docker build -f Dockerfile.dev -t pre-diagnosis-summary .

# Run container
docker run -p 9004:9004 --env-file .env pre-diagnosis-summary
```

## Usage Examples

### Generate Summary
```javascript
const response = await fetch('/api/pre-diagnosis/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    patientId: '123e4567-e89b-12d3-a456-426614174000',
    questionnaireData: {
      chiefComplaint: 'Chest pain and shortness of breath',
      duration: '2 days',
      severity: 'moderate'
    },
    priority: 'high'
  })
});
```

### Retrieve Recent Summaries
```javascript
const response = await fetch('/api/pre-diagnosis/my/recent?limit=10', {
  headers: {
    'Authorization': 'Bearer jwt_token'
  }
});
```

## AI Summary Generation

### Prompt Engineering
The service uses carefully crafted prompts that include:
- Patient demographics and medical history
- Current medications and allergies
- Questionnaire responses and symptoms
- Vital signs and clinical measurements
- Data source information and reliability

### Output Structure
```json
{
  "keyFindings": [
    "Patient has uncontrolled hypertension",
    "Recent onset chest pain requires evaluation"
  ],
  "riskFactors": [
    "Age over 65",
    "History of cardiovascular disease",
    "Current smoking status"
  ],
  "recommendations": [
    "Immediate ECG and cardiac enzymes",
    "Blood pressure monitoring",
    "Medication compliance review"
  ],
  "urgencyLevel": "high",
  "confidenceScore": 0.85
}
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

## Monitoring & Logging

### Health Checks
- `/health` - Basic health status
- `/health/detailed` - Comprehensive health with dependencies
- `/health/ready` - Kubernetes readiness probe
- `/health/live` - Kubernetes liveness probe

### Logging
- Structured JSON logging with Winston
- Request/response logging with Morgan
- Error tracking and stack traces
- Performance metrics and timing

### Metrics
- Summary generation success/failure rates
- AI confidence scores and processing times
- Service dependency health status
- API response times and throughput

## Security

### Authentication
- JWT-based authentication required for all endpoints
- Token validation through Auth Service
- Role-based access control

### Data Protection
- Patient data encryption in transit and at rest
- HIPAA-compliant data handling
- Audit logging for all data access
- Secure API communication with other services

## Contributing

### Development Guidelines
1. Follow existing code style and patterns
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Use semantic commit messages
5. Ensure all tests pass before submitting PRs

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Jest for testing
- Husky for pre-commit hooks

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the project repository
- Contact the development team
- Check the project documentation and wiki
