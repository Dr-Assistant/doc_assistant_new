# ABDM Integration Service

This service handles integration with the Ayushman Bharat Digital Mission (ABDM) ecosystem, enabling Dr. Assistant to connect with the national health data exchange.

## Features

- ABDM Gateway authentication
- Health ID verification and linking
- Consent management for health records
- Health record fetching and processing
- FHIR resource processing and validation
- Comprehensive audit logging
- Data integrity verification
- Compliance with ABDM security requirements

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- ABDM Sandbox credentials

### Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `ABDM_BASE_URL`: ABDM Gateway base URL
- `ABDM_CLIENT_ID`: Your ABDM client ID
- `ABDM_CLIENT_SECRET`: Your ABDM client secret
- `ABDM_AUTH_URL`: ABDM authentication URL

### Installation

```bash
npm install
```

### Running the Service

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

### Database Setup

The service requires PostgreSQL for storing consent management data. Make sure to run the database migrations:

```bash
# Run migrations (from the main project root)
cd backend/database
npm run migrate
```

### Testing

```bash
npm test
```

Run specific test suites:

```bash
# Test consent service
npm test -- consent.service.test.js

# Test consent API
npm test -- consent.api.test.js
```

## ABDM Sandbox Registration

To register with the ABDM Sandbox:

1. Visit the [ABDM Sandbox Portal](https://sandbox.abdm.gov.in/)
2. Create an account and register as a Health Information User (HIU)
3. Complete the registration process and obtain client credentials
4. Update your `.env` file with the provided credentials

## API Endpoints

### System Status
- `GET /api/abdm/status`: Check ABDM connectivity status
- `GET /api/abdm/config`: Get ABDM configuration (non-sensitive)

### Consent Management
- `POST /api/abdm/consent/request`: Request patient consent for health record access
- `GET /api/abdm/consent/:id/status`: Get consent request status
- `GET /api/abdm/consent/active?patientId=:id`: List active consents for a patient
- `POST /api/abdm/consent/:id/revoke`: Revoke an existing consent
- `POST /api/abdm/consent/callback`: Handle consent callbacks from ABDM (webhook)
- `GET /api/abdm/consent/:id/audit`: Get consent audit trail

### Health Record Management
- `POST /api/abdm/health-records/fetch`: Fetch health records using consent
- `GET /api/abdm/health-records/status/:requestId`: Get fetch request status
- `GET /api/abdm/health-records/patient/:patientId`: Get health records for a patient
- `GET /api/abdm/health-records/:recordId`: Get detailed health record
- `POST /api/abdm/health-records/callback`: Handle health information callbacks from ABDM (webhook)
- `GET /api/abdm/health-records/status/:requestId/logs`: Get fetch processing logs
- `POST /api/abdm/health-records/status/:requestId/cancel`: Cancel fetch request

### Future Endpoints
- Health ID verification

## Docker

Build the Docker image:

```bash
docker build -t abdm-integration-service -f Dockerfile.dev .
```

Run the container:

```bash
docker run -p 8101:8101 --env-file .env abdm-integration-service
```

## References

- [ABDM Sandbox Documentation](https://sandbox.abdm.gov.in/docs/)
- [Health ID API Specifications](https://sandbox.abdm.gov.in/docs/healthid)
- [ABDM Consent Manager Specifications](https://sandbox.abdm.gov.in/docs/consent-manager)
