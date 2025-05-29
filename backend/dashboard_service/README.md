# Dashboard Service

This service provides dashboard data for the Dr. Assistant application.

## Features

- API endpoint for today's appointments
- API endpoint for pending tasks
- API endpoint for critical alerts
- API endpoint for practice metrics
- Data aggregation logic
- Performance optimization with caching
- Unit tests

## API Endpoints

### Dashboard Data

- `GET /api/dashboard/complete` - Get complete dashboard data
- `GET /api/dashboard/appointments/today` - Get today's appointments
- `GET /api/dashboard/tasks/pending` - Get pending tasks
- `GET /api/dashboard/alerts/critical` - Get critical alerts
- `GET /api/dashboard/metrics/practice` - Get practice metrics

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration.

4. Start the service:
   ```
   npm start
   ```

5. For development with auto-reload:
   ```
   npm run dev
   ```

## Testing

Run tests:
```
npm test
```

Run tests with coverage:
```
npm run test:coverage
```

## Project Structure

```
src/
├── controllers/        # Request handlers
│   └── dashboard.controller.js
├── middleware/         # Middleware functions
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
├── services/           # Business logic
│   ├── dashboard.service.js
│   ├── integration.service.js
│   └── cache.service.js
├── routes/             # API routes
│   └── dashboard.routes.js
├── utils/              # Utility functions
│   ├── errors.js
│   └── logger.js
└── server.js           # Server entry point
```

## Dependencies

- Express - Web framework
- Redis - Caching
- Axios - HTTP client for service integration
- JWT - Authentication
- Winston - Logging
- Express Validator - Request validation
- Helmet - Security headers
- CORS - Cross-origin resource sharing
- Rate Limit - API rate limiting

## Integration with Other Services

The Dashboard Service integrates with the following services:

- **Auth Service** - For authentication and authorization
- **User Service** - For user data
- **Patient Service** - For patient data
- **Schedule Service** - For appointment data
- **Task Service** (to be implemented in MVP-019) - For task data
- **Alert Service** (to be implemented in MVP-035) - For alert data

## License

This project is proprietary and confidential.
