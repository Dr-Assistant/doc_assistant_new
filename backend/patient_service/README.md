# Patient Service

This service handles patient management for the Dr. Assistant application.

## Features

- Patient CRUD operations
- Patient search functionality
- Patient demographics storage
- ABHA ID linking capability
- Basic medical history storage
- API documentation
- Unit tests

## API Endpoints

### Patient Management

- `GET /api/patients` - Get all patients with pagination and filtering
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create a new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Medical History Management

- `GET /api/patients/:id/medical-history` - Get patient medical history
- `PUT /api/patients/:id/medical-history` - Update patient medical history

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
│   └── patient.controller.js
├── middleware/         # Middleware functions
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
├── models/             # Data models
│   ├── index.js
│   ├── patient.model.js
│   └── medical.history.model.js
├── repositories/       # Data access layer
│   ├── patient.repository.js
│   └── medical.history.repository.js
├── routes/             # API routes
│   └── patient.routes.js
├── services/           # Business logic
│   └── patient.service.js
├── utils/              # Utility functions
│   ├── errors.js
│   └── logger.js
└── server.js           # Server entry point
```

## Dependencies

- Express - Web framework
- Sequelize - PostgreSQL ORM
- Mongoose - MongoDB ODM
- JWT - Authentication
- Winston - Logging
- Express Validator - Request validation
- Helmet - Security headers
- CORS - Cross-origin resource sharing
- Rate Limit - API rate limiting

## License

This project is proprietary and confidential.
