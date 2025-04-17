# Authentication Service

This service handles user authentication and authorization for the Dr. Assistant application.

## Features

- User registration
- User login
- Token-based authentication
- Token refresh
- Logout

## API Endpoints

### Register a new user

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "Doctor Name",
  "email": "doctor@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Doctor Name",
      "email": "doctor@example.com",
      "createdAt": "2023-05-01T12:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

### Login

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "doctor@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Doctor Name",
      "email": "doctor@example.com",
      "createdAt": "2023-05-01T12:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

### Get Current User

```
GET /api/auth/me
```

**Headers:**

```
Authorization: Bearer jwt-token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Doctor Name",
      "email": "doctor@example.com",
      "createdAt": "2023-05-01T12:00:00.000Z"
    }
  }
}
```

### Refresh Token

```
POST /api/auth/refresh-token
```

**Request Body:**

```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### Logout

```
POST /api/auth/logout
```

**Headers:**

```
Authorization: Bearer jwt-token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the following variables:

```
PORT=8001
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dr_assistant
```

3. Start the development server:

```bash
npm run dev
```

### Testing

Run tests:

```bash
npm test
```

### Docker

Build and run with Docker:

```bash
docker build -t dr-assistant-auth-service -f Dockerfile.dev .
docker run -p 8001:8001 dr-assistant-auth-service
```

Or use Docker Compose:

```bash
docker-compose up auth_service
```
