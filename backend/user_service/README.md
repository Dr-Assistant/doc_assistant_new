# User Service

This service handles user management for the Dr. Assistant application.

## Features

- User CRUD operations
- User profile management
- User preferences storage and retrieval
- Integration with authentication service

## API Endpoints

### Get all users (Admin only)

```
GET /api/users
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Number of users per page (default: 10)
- `role` - Filter by role (doctor, nurse, admin, receptionist)
- `status` - Filter by status (active, inactive, suspended, pending)
- `search` - Search by name, username, or email
- `sort` - Sort field (full_name, username, email, role, status, createdAt)
- `order` - Sort order (ASC, DESC)

**Headers:**

```
Authorization: Bearer jwt-token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "doctor1",
        "email": "doctor1@example.com",
        "full_name": "Doctor One",
        "role": "doctor",
        "specialty": "Cardiology",
        "phone": "+919876543211",
        "profile_image_url": null,
        "status": "active",
        "last_login_at": "2023-05-01T12:00:00.000Z",
        "createdAt": "2023-05-01T12:00:00.000Z",
        "updatedAt": "2023-05-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Get user by ID (Admin only)

```
GET /api/users/:id
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
      "id": "uuid",
      "username": "doctor1",
      "email": "doctor1@example.com",
      "full_name": "Doctor One",
      "role": "doctor",
      "specialty": "Cardiology",
      "phone": "+919876543211",
      "profile_image_url": null,
      "status": "active",
      "last_login_at": "2023-05-01T12:00:00.000Z",
      "preferences": {},
      "createdAt": "2023-05-01T12:00:00.000Z",
      "updatedAt": "2023-05-01T12:00:00.000Z"
    }
  }
}
```

### Create a new user (Admin only)

```
POST /api/users
```

**Headers:**

```
Authorization: Bearer jwt-token
```

**Request Body:**

```json
{
  "username": "doctor2",
  "email": "doctor2@example.com",
  "full_name": "Doctor Two",
  "role": "doctor",
  "specialty": "Neurology",
  "phone": "+919876543212",
  "status": "active"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "doctor2",
      "email": "doctor2@example.com",
      "full_name": "Doctor Two",
      "role": "doctor",
      "specialty": "Neurology",
      "phone": "+919876543212",
      "profile_image_url": null,
      "status": "active",
      "preferences": {},
      "createdAt": "2023-05-01T12:00:00.000Z",
      "updatedAt": "2023-05-01T12:00:00.000Z"
    }
  }
}
```

### Update user (Admin only)

```
PUT /api/users/:id
```

**Headers:**

```
Authorization: Bearer jwt-token
```

**Request Body:**

```json
{
  "full_name": "Doctor Two Updated",
  "specialty": "Cardiology",
  "status": "inactive"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "doctor2",
      "email": "doctor2@example.com",
      "full_name": "Doctor Two Updated",
      "role": "doctor",
      "specialty": "Cardiology",
      "phone": "+919876543212",
      "profile_image_url": null,
      "status": "inactive",
      "preferences": {},
      "createdAt": "2023-05-01T12:00:00.000Z",
      "updatedAt": "2023-05-01T12:00:00.000Z"
    }
  }
}
```

### Delete user (Admin only)

```
DELETE /api/users/:id
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
    "message": "User deleted successfully"
  }
}
```

### Get current user

```
GET /api/users/me
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
      "id": "uuid",
      "username": "doctor1",
      "email": "doctor1@example.com",
      "full_name": "Doctor One",
      "role": "doctor",
      "specialty": "Cardiology",
      "phone": "+919876543211",
      "profile_image_url": null,
      "status": "active",
      "preferences": {},
      "createdAt": "2023-05-01T12:00:00.000Z",
      "updatedAt": "2023-05-01T12:00:00.000Z"
    }
  }
}
```

### Update current user

```
PUT /api/users/me
```

**Headers:**

```
Authorization: Bearer jwt-token
```

**Request Body:**

```json
{
  "full_name": "Doctor One Updated",
  "specialty": "Neurology",
  "phone": "+919876543213"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "doctor1",
      "email": "doctor1@example.com",
      "full_name": "Doctor One Updated",
      "role": "doctor",
      "specialty": "Neurology",
      "phone": "+919876543213",
      "profile_image_url": null,
      "status": "active",
      "preferences": {},
      "createdAt": "2023-05-01T12:00:00.000Z",
      "updatedAt": "2023-05-01T12:00:00.000Z"
    }
  }
}
```

### Update user preferences

```
PUT /api/users/me/preferences
```

**Headers:**

```
Authorization: Bearer jwt-token
```

**Request Body:**

```json
{
  "theme": "dark",
  "language": "en",
  "notifications": {
    "email": true,
    "sms": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "email": true,
        "sms": false
      }
    }
  }
}
```

### Get user preferences

```
GET /api/users/me/preferences
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
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": {
        "email": true,
        "sms": false
      }
    }
  }
}
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Auth Service running

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and update the values
4. Start the service: `npm run dev`

### Testing

Run tests: `npm test`

### Environment Variables

- `PORT` - Port to run the service on (default: 8002)
- `NODE_ENV` - Environment (development, production, test)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - PostgreSQL database name
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `AUTH_SERVICE_URL` - URL of the Auth Service
- `LOG_LEVEL` - Logging level (error, warn, info, http, debug)
