# Data Access Patterns

This document outlines common data access patterns for the Dr. Assistant application, including query examples, caching strategies, and performance considerations.

## Common Query Patterns

### 1. Doctor's Daily Dashboard

The doctor's daily dashboard requires efficient retrieval of appointments, tasks, and alerts for the current day.

#### Appointments for Today

```sql
-- Get today's appointments for a doctor
SELECT a.*, p.first_name, p.last_name, p.date_of_birth
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.doctor_id = :doctorId
AND DATE(a.start_time) = CURRENT_DATE
ORDER BY a.start_time;
```

#### Pending Tasks

```sql
-- Get pending tasks for a doctor
SELECT t.*, p.first_name, p.last_name
FROM tasks t
LEFT JOIN patients p ON t.patient_id = p.id
WHERE t.assigned_to = :doctorId
AND t.status = 'pending'
ORDER BY t.priority DESC, t.due_date;
```

#### Unread Alerts

```sql
-- Get unread alerts for a doctor
SELECT a.*, p.first_name, p.last_name
FROM alerts a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.user_id = :doctorId
AND a.is_read = FALSE
ORDER BY a.severity DESC, a.created_at DESC;
```

### 2. Patient Timeline

The patient timeline requires retrieval of all clinical data for a specific patient.

#### Patient Encounters

```sql
-- Get all encounters for a patient
SELECT e.*, u.full_name as doctor_name
FROM encounters e
JOIN users u ON e.doctor_id = u.id
WHERE e.patient_id = :patientId
ORDER BY e.start_time DESC;
```

#### Patient Prescriptions

```sql
-- Get all prescriptions for a patient
SELECT p.*, pi.*, u.full_name as doctor_name
FROM prescriptions p
JOIN prescription_items pi ON p.id = pi.prescription_id
JOIN users u ON p.doctor_id = u.id
WHERE p.patient_id = :patientId
ORDER BY p.created_at DESC;
```

#### Patient Orders

```sql
-- Get all orders for a patient
SELECT o.*, oi.*, u.full_name as doctor_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN users u ON o.doctor_id = u.id
WHERE o.patient_id = :patientId
ORDER BY o.created_at DESC;
```

#### Patient Clinical Notes (MongoDB)

```javascript
// Get all clinical notes for a patient
db.clinicalNotes.find(
  { patientId: "uuid-here" },
  { sort: { createdAt: -1 } }
);
```

### 3. Encounter Management

Queries related to managing a specific clinical encounter.

#### Encounter Details

```sql
-- Get encounter details with patient and doctor information
SELECT e.*, 
       p.first_name as patient_first_name, p.last_name as patient_last_name, 
       p.date_of_birth, p.gender, p.mrn, p.abha_id,
       u.full_name as doctor_name, u.specialty
FROM encounters e
JOIN patients p ON e.patient_id = p.id
JOIN users u ON e.doctor_id = u.id
WHERE e.id = :encounterId;
```

#### Encounter Clinical Note (MongoDB)

```javascript
// Get the clinical note for an encounter
db.clinicalNotes.findOne(
  { encounterId: "uuid-here" },
  { sort: { updatedAt: -1 } }
);
```

#### Encounter Prescriptions

```sql
-- Get prescriptions for an encounter
SELECT p.*, pi.*
FROM prescriptions p
JOIN prescription_items pi ON p.id = pi.prescription_id
WHERE p.encounter_id = :encounterId
ORDER BY p.created_at DESC;
```

#### Encounter Orders

```sql
-- Get orders for an encounter
SELECT o.*, oi.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.encounter_id = :encounterId
ORDER BY o.created_at DESC;
```

### 4. User Management

Queries related to user management and authentication.

#### User Authentication

```sql
-- Get user by username for authentication
SELECT id, username, email, full_name, role, password_hash, status
FROM users
WHERE username = :username
AND status = 'active';
```

#### User Profile

```sql
-- Get user profile details
SELECT id, username, email, full_name, role, specialty, phone, profile_image_url, 
       created_at, last_login_at, status, preferences
FROM users
WHERE id = :userId;
```

## Caching Strategies

### 1. User Session Caching (Redis)

```
Key: session:{sessionId}
Value: {
  "userId": "UUID",
  "role": "doctor",
  "created": 1618840400,
  "expires": 1618844000,
  "lastActivity": 1618842600,
  "permissions": [
    "read:patients",
    "write:prescriptions",
    "read:encounters",
    "write:encounters"
  ]
}
```

### 2. User Preferences Caching (Redis)

```
Key: user:{userId}:preferences
Value: {
  "theme": "light",
  "fontSize": "medium",
  "notificationPreferences": {
    "email": true,
    "push": true,
    "sms": false
  },
  "dashboardLayout": [
    "schedule",
    "tasks",
    "alerts",
    "metrics"
  ]
}
```

### 3. Doctor's Daily Schedule Caching (Redis)

```
Key: doctor:{doctorId}:schedule:{date}
Value: [
  {
    "id": "UUID",
    "patientId": "UUID",
    "patientName": "John Doe",
    "startTime": "2023-05-20T09:00:00Z",
    "endTime": "2023-05-20T09:30:00Z",
    "status": "scheduled",
    "appointmentType": "follow_up"
  },
  ...
]
```

### 4. Patient Demographics Caching (Redis)

```
Key: patient:{patientId}:demographics
Value: {
  "id": "UUID",
  "mrn": "MRN12345",
  "abhaId": "ABHA12345",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-01-01",
  "gender": "male",
  "phone": "+919876543210",
  "email": "john.doe@example.com"
}
```

## Performance Considerations

### 1. Query Optimization

- Use appropriate indexes for frequently queried columns
- Limit result sets to necessary columns and rows
- Use pagination for large result sets
- Consider using materialized views for complex, frequently accessed queries

### 2. Database Connection Pooling

- Implement connection pooling for PostgreSQL
- Configure appropriate pool size based on workload
- Monitor connection usage and adjust as needed

### 3. Caching Strategy

- Cache frequently accessed, relatively static data
- Implement cache invalidation on data updates
- Use appropriate TTL (Time To Live) values
- Consider using Redis Pub/Sub for cache invalidation

### 4. MongoDB Query Optimization

- Use appropriate indexes for frequently queried fields
- Limit projection to necessary fields
- Use aggregation pipeline for complex queries
- Consider using MongoDB Atlas Search for full-text search

### 5. Batch Processing

- Use batch operations for bulk inserts, updates, and deletes
- Implement background jobs for time-consuming operations
- Consider using message queues for asynchronous processing

## Data Access Layer Implementation

The application should implement a data access layer (DAL) that abstracts database operations and implements these patterns. The DAL should:

1. Provide a consistent interface for database operations
2. Implement caching strategies
3. Handle connection management
4. Implement error handling and retries
5. Support transactions where needed
6. Log query performance metrics

## Monitoring and Optimization

To ensure optimal performance, the following should be monitored:

1. Query execution time
2. Cache hit/miss ratio
3. Database connection usage
4. Index usage and performance
5. Slow queries
6. Database resource utilization (CPU, memory, disk I/O)

Regular performance reviews should be conducted to identify and address performance bottlenecks.
