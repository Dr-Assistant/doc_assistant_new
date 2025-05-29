# Clinical Note Generation Service

AI-powered clinical note generation service using Google Gemini for converting doctor-patient conversation transcriptions into structured SOAP notes.

## Features

- **AI-Powered Generation**: Uses Google Gemini 1.5 Pro for intelligent clinical note generation
- **SOAP Note Structure**: Generates comprehensive Subjective, Objective, Assessment, and Plan sections
- **Medical Terminology**: Enhanced with medical vocabulary and ICD-10 code suggestions
- **Quality Assessment**: Confidence scoring and quality metrics for generated notes
- **Review Workflow**: Support for review, approval, and digital signing of notes
- **Audit Trail**: Complete tracking of edits and changes with user attribution
- **Compliance**: Built-in compliance flags and quality checks
- **Multi-format Support**: Handles various note types (SOAP, progress, procedure, etc.)

## Architecture

```
Clinical Note Generation Service
├── AI Processing (Google Gemini)
│   ├── Prompt Engineering
│   ├── Medical Context Enhancement
│   ├── SOAP Note Parsing
│   └── Quality Assessment
├── Data Management
│   ├── Clinical Note Storage
│   ├── Edit History Tracking
│   ├── Audit Trail
│   └── Compliance Monitoring
└── API Layer
    ├── Generation Endpoints
    ├── Review Workflow
    ├── Statistics & Analytics
    └── Admin Functions
```

## API Endpoints

### Clinical Notes

- `POST /api/clinical-notes/generate` - Generate clinical note from transcription
- `GET /api/clinical-notes/:id` - Get clinical note by ID
- `GET /api/clinical-notes/encounter/:encounterId` - Get clinical note by encounter ID
- `PUT /api/clinical-notes/:id` - Update clinical note
- `POST /api/clinical-notes/:id/review` - Review clinical note
- `POST /api/clinical-notes/:id/approve` - Approve clinical note
- `POST /api/clinical-notes/:id/sign` - Sign clinical note
- `GET /api/clinical-notes/patient/:patientId` - Get clinical notes by patient
- `GET /api/clinical-notes/doctor/:doctorId` - Get clinical notes by doctor
- `GET /api/clinical-notes/pending` - Get pending clinical notes for review
- `GET /api/clinical-notes/stats` - Get clinical note statistics
- `POST /api/clinical-notes/:id/regenerate` - Regenerate clinical note

### Health & Monitoring

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information

## Installation

1. **Clone the repository**
   ```bash
   cd ai_services/clinical_note_generation
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
PORT=9002
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dr_assistant

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_TEMPERATURE=0.3
GEMINI_MAX_OUTPUT_TOKENS=8192

# Authentication
JWT_SECRET=your_jwt_secret_key

# Service URLs
AUTH_SERVICE_URL=http://localhost:8001
VOICE_RECORDING_SERVICE_URL=http://localhost:8003
PATIENT_SERVICE_URL=http://localhost:8002
```

### Optional Configuration

```bash
# AI Configuration
GEMINI_TOP_P=0.8
GEMINI_TOP_K=40
MAX_RETRIES=3
CONFIDENCE_THRESHOLD=0.7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Google Gemini Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Generative AI API**
   - Navigate to APIs & Services
   - Enable the Generative Language API

3. **Get API Key**
   - Go to Credentials section
   - Create API Key
   - Restrict the key to Generative Language API

4. **Configure Environment**
   ```bash
   GOOGLE_GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-1.5-pro
   ```

## Usage Examples

### Generate Clinical Note

```javascript
POST /api/clinical-notes/generate
{
  "transcriptionId": "507f1f77bcf86cd799439011",
  "context": {
    "noteType": "soap",
    "priority": "normal",
    "specialty": "Internal Medicine"
  }
}
```

### Update Clinical Note

```javascript
PUT /api/clinical-notes/507f1f77bcf86cd799439012
{
  "subjective": {
    "chiefComplaint": "Updated chief complaint"
  },
  "status": "review"
}
```

### Review Clinical Note

```javascript
POST /api/clinical-notes/507f1f77bcf86cd799439012/review
{
  "comments": "Please verify medication dosages"
}
```

## SOAP Note Structure

The service generates structured SOAP notes with the following sections:

### Subjective
- Chief Complaint
- History of Present Illness
- Review of Systems
- Past Medical History
- Medications
- Allergies
- Family History
- Social History

### Objective
- Vital Signs
- Physical Examination
- Diagnostic Results

### Assessment
- Primary Diagnosis (with ICD-10 codes)
- Secondary Diagnoses
- Differential Diagnoses
- Clinical Impression

### Plan
- Diagnostic Tests
- Treatments
- Medications
- Patient Education
- Follow-up Instructions
- Referrals

## Quality Features

### AI Quality Assessment
- **Completeness**: Checks for required sections
- **Accuracy**: Validates medical terminology
- **Relevance**: Ensures content relevance
- **Clarity**: Assesses content clarity

### Confidence Scoring
- Overall confidence score (0-1)
- Section-specific confidence
- Medical terminology alignment
- Quality metrics tracking

### Compliance Monitoring
- Missing section detection
- Content length validation
- Medical terminology verification
- Audit trail maintenance

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
- API usage statistics

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
