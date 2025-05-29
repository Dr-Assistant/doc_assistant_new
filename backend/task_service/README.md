# Task Service

This service manages doctor tasks, reminders, and pending actions for the Dr. Assistant application.

## Features

- Task CRUD operations
- Task assignment functionality
- Task prioritization (low, medium, high, urgent)
- Task status tracking (pending, in_progress, completed, cancelled)
- Due date management
- Task type categorization (documentation, review, follow_up, referral, order, other)
- Integration with User, Patient, and Encounter services
- Comprehensive audit logging

## API Endpoints

### Task Management

- `POST /api/tasks` - Create a new task
- `GET /api/tasks` - Get tasks with filtering and pagination
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status
- `PATCH /api/tasks/:id/assign` - Assign task to user

### Task Queries

- `GET /api/tasks/pending` - Get pending tasks
- `GET /api/tasks/assigned/:userId` - Get tasks assigned to a user
- `GET /api/tasks/created/:userId` - Get tasks created by a user
- `GET /api/tasks/patient/:patientId` - Get tasks related to a patient
- `GET /api/tasks/overdue` - Get overdue tasks
- `GET /api/tasks/due-today` - Get tasks due today

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Environment variables configured

### Installation

```bash
npm install
```

### Environment Variables

Copy the example environment file and update with your configuration:

```bash
cp .env.example .env
```

Required environment variables:

- `PORT` - Service port (default: 8004)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret for token verification
- `AUTH_SERVICE_URL` - Authentication service URL
- `USER_SERVICE_URL` - User service URL
- `PATIENT_SERVICE_URL` - Patient service URL

### Running the Service

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

### Testing

Run all tests:

```bash
npm test
```

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

Watch mode:

```bash
npm run test:watch
```

## Task Types

- **documentation** - Tasks related to completing documentation
- **review** - Tasks for reviewing patient records, lab results, etc.
- **follow_up** - Follow-up tasks for patient care
- **referral** - Tasks for patient referrals
- **order** - Tasks for ordering tests, medications, etc.
- **other** - General tasks

## Task Priorities

- **low** - Low priority tasks
- **medium** - Medium priority tasks (default)
- **high** - High priority tasks
- **urgent** - Urgent tasks requiring immediate attention

## Task Statuses

- **pending** - Task is pending (default)
- **in_progress** - Task is currently being worked on
- **completed** - Task has been completed
- **cancelled** - Task has been cancelled

## Integration

This service integrates with:

- **Authentication Service** - For user authentication and authorization
- **User Service** - For user information and validation
- **Patient Service** - For patient-related tasks
- **Encounter Service** - For encounter-related tasks

## Docker

Build the Docker image:

```bash
docker build -t task-service -f Dockerfile.dev .
```

Run the container:

```bash
docker run -p 8004:8004 --env-file .env task-service
```
