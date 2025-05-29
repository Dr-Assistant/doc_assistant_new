# Schedule Service

This service handles appointment scheduling and doctor availability for the Dr. Assistant application.

## Features

- Appointment CRUD operations
- Doctor availability management
- Date range query functionality
- Appointment status tracking
- Schedule conflict prevention
- API documentation
- Unit tests

## API Endpoints

### Appointment Management

- `GET /api/appointments` - Get all appointments with pagination and filtering
- `GET /api/appointments/date-range` - Get appointments by date range
- `GET /api/appointments/today` - Get today's appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `PATCH /api/appointments/:id/status` - Update appointment status

### Doctor Availability Management

- `GET /api/availability/doctor/:doctorId` - Get all availabilities for a doctor
- `GET /api/availability/:id` - Get availability by ID
- `GET /api/availability/doctor/:doctorId/time-slots` - Get available time slots for a doctor on a specific date
- `POST /api/availability` - Create a new availability
- `PUT /api/availability/:id` - Update availability
- `DELETE /api/availability/:id` - Delete availability

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
│   ├── appointment.controller.js
│   └── availability.controller.js
├── middleware/         # Middleware functions
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
├── models/             # Data models
│   ├── index.js
│   ├── appointment.model.js
│   └── availability.model.js
├── repositories/       # Data access layer
│   ├── appointment.repository.js
│   └── availability.repository.js
├── routes/             # API routes
│   ├── appointment.routes.js
│   └── availability.routes.js
├── services/           # Business logic
│   ├── appointment.service.js
│   ├── availability.service.js
│   └── cache.service.js
├── utils/              # Utility functions
│   ├── errors.js
│   └── logger.js
└── server.js           # Server entry point
```

## Dependencies

- Express - Web framework
- Sequelize - PostgreSQL ORM
- Redis - Caching
- JWT - Authentication
- Winston - Logging
- Express Validator - Request validation
- Helmet - Security headers
- CORS - Cross-origin resource sharing
- Rate Limit - API rate limiting

## License

This project is proprietary and confidential.
