# Prescription Generation Service

AI-powered prescription generation service using Google Gemini for extracting medication information from clinical notes and transcriptions, with built-in drug interaction checking and dosage validation.

## Features

- **AI-Powered Extraction**: Uses Google Gemini 1.5 Pro for intelligent medication extraction
- **Multiple Input Sources**: Supports clinical notes, transcriptions, and direct text input
- **Drug Interaction Checking**: Built-in database of drug interactions with severity levels
- **Dosage Validation**: Automatic validation against maximum daily doses and age-appropriate dosing
- **Medication Database**: Comprehensive database of 15+ common medications with dosing guidelines
- **Safety Monitoring**: Automated safety checks and compliance monitoring
- **Review Workflow**: Support for review, approval, and digital signing of prescriptions
- **Audit Trail**: Complete tracking of edits and changes with user attribution
- **Quality Assessment**: Confidence scoring and quality metrics for generated prescriptions

## Architecture

```
Prescription Generation Service
├── AI Processing (Google Gemini)
│   ├── Medication Extraction
│   ├── Dosage Parsing
│   ├── Drug Interaction Checking
│   └── Quality Assessment
├── Data Management
│   ├── Prescription Storage
│   ├── Medication Database
│   ├── Edit History Tracking
│   └── Safety Monitoring
└── API Layer
    ├── Generation Endpoints
    ├── Review Workflow
    ├── Statistics & Analytics
    └── Admin Functions
```

## API Endpoints

### Prescription Generation

- `POST /api/prescriptions/generate/clinical-note` - Generate prescription from clinical note
- `POST /api/prescriptions/generate/transcription` - Generate prescription from transcription
- `POST /api/prescriptions/generate/text` - Generate prescription from text input

### Prescription Management

- `GET /api/prescriptions/:id` - Get prescription by ID
- `GET /api/prescriptions/encounter/:encounterId` - Get prescription by encounter ID
- `PUT /api/prescriptions/:id` - Update prescription
- `POST /api/prescriptions/:id/review` - Review prescription
- `POST /api/prescriptions/:id/approve` - Approve prescription
- `POST /api/prescriptions/:id/sign` - Sign prescription
- `POST /api/prescriptions/:id/send` - Send prescription to pharmacy

### Analytics & Reporting

- `GET /api/prescriptions/patient/:patientId` - Get prescriptions by patient
- `GET /api/prescriptions/doctor/:doctorId` - Get prescriptions by doctor
- `GET /api/prescriptions/pending` - Get pending prescriptions for review
- `GET /api/prescriptions/stats` - Get prescription statistics

### Health & Monitoring

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information

## Installation

1. **Clone the repository**
   ```bash
   cd ai_services/prescription_generation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the service**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Configuration

### Required Environment Variables

```bash
# Server Configuration
PORT=9003
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dr_assistant

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=4096

# Authentication
JWT_SECRET=your_jwt_secret_key

# Service URLs
AUTH_SERVICE_URL=http://localhost:8001
CLINICAL_NOTE_SERVICE_URL=http://localhost:9002
PATIENT_SERVICE_URL=http://localhost:8002
```

### Optional Configuration

```bash
# Prescription Features
ENABLE_DRUG_INTERACTION_CHECK=true
ENABLE_DOSAGE_VALIDATION=true
MAX_MEDICATIONS_PER_PRESCRIPTION=20
CONFIDENCE_THRESHOLD=0.7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AI_GENERATION_RATE_LIMIT=10

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Usage Examples

### Generate Prescription from Clinical Note

```javascript
POST /api/prescriptions/generate/clinical-note
{
  "clinicalNoteId": "507f1f77bcf86cd799439011",
  "context": {
    "priority": "normal",
    "specialty": "Internal Medicine"
  }
}
```

### Generate Prescription from Text

```javascript
POST /api/prescriptions/generate/text
{
  "text": "Patient needs metoprolol 50mg twice daily for hypertension and lisinopril 10mg once daily for blood pressure control.",
  "context": {
    "patientId": "patient-123",
    "encounterId": "encounter-456"
  }
}
```

### Update Prescription

```javascript
PUT /api/prescriptions/507f1f77bcf86cd799439012
{
  "medications": [
    {
      "medicationName": "metoprolol",
      "dosage": {
        "amount": 25,
        "unit": "mg"
      },
      "frequency": {
        "times": 2,
        "period": "daily",
        "abbreviation": "bid"
      },
      "instructions": "Take with food"
    }
  ]
}
```

## Medication Database

The service includes a comprehensive medication database with:

### Supported Medications
- **Cardiovascular**: metoprolol, lisinopril, amlodipine
- **Diabetes**: metformin, glipizide
- **Antibiotics**: amoxicillin, azithromycin
- **Pain Management**: ibuprofen, acetaminophen
- **Respiratory**: albuterol
- **Psychiatric**: sertraline

### Drug Interaction Matrix
- Major interactions (contraindicated)
- Moderate interactions (monitor closely)
- Minor interactions (caution advised)

### Dosage Guidelines
- Maximum daily doses
- Age-specific adjustments
- Weight-based dosing (pediatric)
- Renal/hepatic adjustments

## Safety Features

### Drug Interaction Checking
```javascript
// Automatic detection of interactions
{
  "medication1": "metoprolol",
  "medication2": "verapamil",
  "severity": "major",
  "description": "Increased risk of bradycardia and heart block",
  "recommendation": "Avoid concurrent use"
}
```

### Dosage Validation
```javascript
// Automatic dosage validation
{
  "medication": "metoprolol",
  "alertType": "overdose",
  "description": "Daily dose (1000mg) exceeds maximum (400mg)",
  "recommendation": "Consider reducing dose to maximum 400mg"
}
```

### Quality Assessment
- **Completeness**: Required fields present
- **Accuracy**: Medication recognition and validation
- **Clarity**: Clear instructions and dosing
- **Safety**: Reasonable dosages and no obvious issues

## Development

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Code Quality
```bash
npm run lint           # Check code style
npm run lint:fix       # Fix code style issues
```

### Development Mode
```bash
npm run dev           # Start with nodemon
```

## Monitoring

### Health Checks
- Database connectivity
- Gemini API availability
- Memory usage monitoring
- Service dependencies

### Logging
- Structured JSON logging
- Request/response tracking
- Error monitoring
- Performance metrics

### Metrics
- Generation success rate
- Average processing time
- Confidence score distribution
- Drug interaction detection rate

## Security

- JWT-based authentication
- Role-based access control
- Rate limiting protection
- Input validation
- Audit trail logging
- CORS configuration

## Error Handling

The service provides comprehensive error handling with:
- Structured error responses
- Appropriate HTTP status codes
- Detailed error logging
- Retry mechanisms for transient failures

## Contributing

1. Follow the existing code style
2. Write comprehensive tests
3. Update documentation
4. Ensure all tests pass
5. Follow semantic versioning

## License

MIT License - see LICENSE file for details
