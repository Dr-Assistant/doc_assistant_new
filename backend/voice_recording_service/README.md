# Voice Recording Service

A secure microservice for handling voice recordings in the Dr. Assistant platform. This service provides secure audio capture, storage with encryption, quality validation, and retention policy management.

## Features

- **Secure Audio Upload**: Encrypted storage using AES-256-GCM
- **Audio Validation**: File type, size, duration, and quality validation
- **GridFS Storage**: MongoDB GridFS for efficient large file storage
- **Retention Policies**: Configurable retention periods with automatic cleanup
- **Access Control**: Role-based access control with JWT authentication
- **Audit Trail**: Comprehensive logging and metadata tracking
- **Health Monitoring**: Built-in health checks and metrics
- **AI Transcription**: Google Speech-to-Text integration with medical terminology optimization
- **Quality Assessment**: Confidence scoring and audio quality metrics
- **Speaker Diarization**: Multi-speaker conversation support

## API Endpoints

### Voice Recordings
- `POST /api/voice-recordings` - Upload and create a new voice recording
- `GET /api/voice-recordings/:id` - Get voice recording by ID
- `GET /api/voice-recordings/encounter/:encounterId` - Get recordings for an encounter
- `PUT /api/voice-recordings/:id/status` - Update recording status
- `DELETE /api/voice-recordings/:id` - Delete voice recording
- `GET /api/voice-recordings/:id/download` - Download audio file

### Retention Management
- `PUT /api/voice-recordings/:id/retention` - Update retention policy
- `PUT /api/voice-recordings/:id/extend-retention` - Extend retention period
- `GET /api/voice-recordings/admin/retention/statistics` - Get retention statistics (admin)
- `POST /api/voice-recordings/admin/retention/cleanup` - Cleanup expired recordings (admin)

### Transcriptions

- `POST /api/transcriptions` - Create and start transcription for a voice recording
- `GET /api/transcriptions/:id` - Get transcription by ID
- `GET /api/transcriptions/voice-recording/:voiceRecordingId` - Get transcription by voice recording ID
- `GET /api/transcriptions/encounter/:encounterId` - Get transcriptions by encounter ID
- `POST /api/transcriptions/:id/retry` - Retry failed transcription
- `GET /api/transcriptions/stats` - Get transcription statistics
- `PUT /api/transcriptions/:id/metadata` - Update transcription metadata
- `GET /api/transcriptions/admin/pending` - Get pending transcriptions (admin)
- `POST /api/transcriptions/admin/process-pending` - Process all pending transcriptions (admin)
- `DELETE /api/transcriptions/:id` - Delete transcription (admin)

### System
- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `GET /api/docs` - API documentation

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the service:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8007 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT secret key | - |
| `ENCRYPTION_KEY` | 32-character encryption key | - |
| `MAX_FILE_SIZE` | Maximum file size | 100MB |
| `ALLOWED_MIME_TYPES` | Allowed audio MIME types | audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg |
| `MAX_DURATION` | Maximum recording duration (seconds) | 3600 |
| `DEFAULT_RETENTION_DAYS` | Default retention period | 90 |

## Audio File Requirements

- **Supported Formats**: MP3, WAV, MP4, WebM, OGG
- **Maximum Size**: 100MB (configurable)
- **Maximum Duration**: 1 hour (configurable)
- **Minimum Duration**: 1 second

## Security Features

- **Encryption**: All audio files are encrypted using AES-256-GCM
- **Authentication**: JWT-based authentication required for all endpoints
- **Authorization**: Role-based access control (doctor, admin)
- **Rate Limiting**: Configurable rate limits for uploads and downloads
- **Audit Logging**: Comprehensive audit trail for all operations
- **Data Integrity**: SHA-256 checksums for file integrity verification

## Retention Policies

The service supports different retention policies:

- **Clinical**: 90 days (default for medical records)
- **Legal**: 365 days (for legal compliance)
- **Research**: 180 days (for research data)
- **Audit**: 365 days (for audit purposes)

Automatic cleanup runs daily in production to remove expired recordings.

## Google Cloud Speech-to-Text Setup

### Prerequisites
1. Create a Google Cloud Project
2. Enable the Speech-to-Text API
3. Create a service account with Speech-to-Text permissions
4. Download the service account key file

### Configuration
Set the following environment variables:
```bash
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

### Transcription Features
- **Medical Terminology**: Enhanced recognition for medical terms
- **Speaker Diarization**: Distinguishes between doctor and patient speech
- **Quality Assessment**: Confidence scoring and audio quality metrics
- **Multiple Formats**: Supports WAV, MP3, WebM, and OGG audio files
- **Automatic Processing**: Transcription starts automatically after audio upload

## Development

### Running Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Code Quality
```bash
npm run lint
npm run lint:fix
```

### Docker Development
```bash
docker build -f Dockerfile.dev -t voice-recording-service:dev .
docker run -p 8007:8007 voice-recording-service:dev
```

## Monitoring

The service provides several monitoring endpoints:

- `/health` - Overall health status
- `/health/ready` - Readiness for traffic
- `/health/live` - Liveness check
- `/health/metrics` - Basic metrics

## Error Handling

The service uses structured error handling with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (resource conflict)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (server errors)

## Logging

Structured logging using Winston with different log levels:

- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages
- `http` - HTTP request logging
- `debug` - Debug information

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow security best practices

## License

MIT License - see LICENSE file for details.
