# Data Model

## Overview

This document describes the data model for the Dr. Assistant application, including database schemas, entity relationships, and data storage strategies. The data model is designed to support all application features while ensuring data integrity, security, and performance.

## Database Architecture

The Dr. Assistant application uses a polyglot persistence approach with multiple database technologies:

1. **PostgreSQL**: Primary relational database for structured data with complex relationships
2. **MongoDB**: Document database for flexible schema data like clinical notes and AI outputs
3. **Redis**: In-memory data store for caching and real-time features
4. **Elasticsearch**: Search engine for full-text search capabilities
5. **Object Storage**: For large binary files like audio recordings and documents

## Core Entities and Relationships

### Entity Relationship Diagram (ERD)

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│               │       │               │       │               │
│     User      │◄──────┤  Appointment  │───────►    Patient    │
│               │1     *│               │*     1│               │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        │                       │                       │
        │                       │                       │
        │                       ▼                       │
        │               ┌───────────────┐               │
        │               │               │               │
        └──────────────►│   Encounter   │◄──────────────┘
                      *│               │*
                       └───────┬───────┘
                               │
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│ Clinical Note │     │  Prescription │     │    Order      │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Detailed Entity Definitions

### 1. User

Represents doctors, nurses, and administrative staff.

**PostgreSQL Schema:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'doctor', 'nurse', 'admin', etc.
    specialty VARCHAR(50),      -- For doctors
    phone VARCHAR(20),
    profile_image_url VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    preferences JSONB,          -- User preferences and settings
    CONSTRAINT valid_role CHECK (role IN ('doctor', 'nurse', 'admin', 'receptionist'))
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_specialty ON users(specialty) WHERE specialty IS NOT NULL;
```

**Key Relationships:**
- One User can have many Appointments (as the doctor)
- One User can have many Encounters (as the doctor)
- One User can have many Tasks (assigned to or created by)

### 2. Patient

Represents individuals receiving medical care.

**PostgreSQL Schema:**
```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY,
    mrn VARCHAR(50) UNIQUE,     -- Medical Record Number
    abha_id VARCHAR(50) UNIQUE, -- Ayushman Bharat Health Account ID
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address JSONB,
    emergency_contact JSONB,
    blood_group VARCHAR(5),
    allergies TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other'))
);

CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
CREATE INDEX idx_patients_abha ON patients(abha_id) WHERE abha_id IS NOT NULL;
```

**Key Relationships:**
- One Patient can have many Appointments
- One Patient can have many Encounters
- One Patient can have many Clinical Notes
- One Patient can have many Prescriptions
- One Patient can have many Orders

### 3. Appointment

Represents scheduled meetings between doctors and patients.

**PostgreSQL Schema:**
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    appointment_type VARCHAR(20) NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    CONSTRAINT valid_type CHECK (appointment_type IN ('in_person', 'telemedicine', 'follow_up', 'urgent', 'routine'))
);

CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_time ON appointments(start_time, end_time);
CREATE INDEX idx_appointments_status ON appointments(status);
```

**Key Relationships:**
- Many Appointments belong to one User (doctor)
- Many Appointments belong to one Patient
- One Appointment can lead to one Encounter

### 4. Encounter

Represents an actual clinical visit or interaction.

**PostgreSQL Schema:**
```sql
CREATE TABLE encounters (
    id UUID PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    encounter_type VARCHAR(20) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    chief_complaint TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    CONSTRAINT valid_type CHECK (encounter_type IN ('office_visit', 'telemedicine', 'emergency', 'home_visit'))
);

CREATE INDEX idx_encounters_doctor ON encounters(doctor_id);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_encounters_appointment ON encounters(appointment_id);
CREATE INDEX idx_encounters_time ON encounters(start_time);
```

**Key Relationships:**
- Many Encounters belong to one User (doctor)
- Many Encounters belong to one Patient
- One Encounter can have one Clinical Note
- One Encounter can have many Prescriptions
- One Encounter can have many Orders

### 5. Clinical Note

Represents the documentation of a clinical encounter.

**MongoDB Schema:**
```json
{
  "_id": "ObjectId",
  "encounterId": "UUID",
  "patientId": "UUID",
  "doctorId": "UUID",
  "createdAt": "ISODate",
  "updatedAt": "ISODate",
  "status": "String",  // "draft", "signed", "amended"
  "noteType": "String",  // "soap", "progress", "procedure", etc.
  "content": {
    "subjective": "String",
    "objective": "String",
    "assessment": "String",
    "plan": "String"
  },
  "rawTranscription": "String",  // Original voice transcription
  "aiSummary": "String",  // AI-generated summary
  "aiConfidenceScore": "Number",
  "signedBy": "UUID",
  "signedAt": "ISODate",
  "metadata": {
    "recordingDuration": "Number",
    "wordCount": "Number",
    "editCount": "Number"
  },
  "tags": ["String"]
}
```

**Key Relationships:**
- One Clinical Note belongs to one Encounter
- One Clinical Note belongs to one Patient
- One Clinical Note belongs to one User (doctor)

### 6. Prescription

Represents medications prescribed to a patient.

**PostgreSQL Schema:**
```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY,
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    signed_at TIMESTAMP,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    pharmacy_id UUID,
    notes TEXT,
    CONSTRAINT valid_status CHECK (status IN ('draft', 'signed', 'sent', 'dispensed', 'cancelled'))
);

CREATE TABLE prescription_items (
    id UUID PRIMARY KEY,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50),
    quantity VARCHAR(50),
    refills INTEGER DEFAULT 0,
    instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_encounter ON prescriptions(encounter_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
```

**Key Relationships:**
- Many Prescriptions belong to one Encounter
- Many Prescriptions belong to one Patient
- Many Prescriptions belong to one User (doctor)
- One Prescription can have many Prescription Items

### 7. Order

Represents clinical orders such as lab tests or imaging.

**PostgreSQL Schema:**
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    order_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ordered',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ordered_at TIMESTAMP,
    completed_at TIMESTAMP,
    provider_id UUID,  -- External provider (lab, imaging center)
    notes TEXT,
    CONSTRAINT valid_type CHECK (order_type IN ('lab', 'imaging', 'procedure', 'referral')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'ordered', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_encounter ON orders(encounter_id);
CREATE INDEX idx_orders_patient ON orders(patient_id);
CREATE INDEX idx_orders_doctor ON orders(doctor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

**Key Relationships:**
- Many Orders belong to one Encounter
- Many Orders belong to one Patient
- Many Orders belong to one User (doctor)
- One Order can have many Order Items

### 8. Task

Represents work items for users to complete.

**PostgreSQL Schema:**
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    encounter_id UUID REFERENCES encounters(id),
    due_date TIMESTAMP,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    task_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT valid_type CHECK (task_type IN ('documentation', 'review', 'follow_up', 'referral', 'order', 'other'))
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_patient ON tasks(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
```

**Key Relationships:**
- Many Tasks can be assigned to one User
- Many Tasks can be created by one User
- Many Tasks can be related to one Patient
- Many Tasks can be related to one Encounter

### 9. Alert

Represents important notifications for users.

**PostgreSQL Schema:**
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    alert_type VARCHAR(20) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP,
    source VARCHAR(50),
    source_id UUID,
    action_url VARCHAR(255),
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_type CHECK (alert_type IN ('lab_result', 'medication', 'appointment', 'task', 'system', 'other'))
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_patient ON alerts(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_alerts_read ON alerts(is_read);
CREATE INDEX idx_alerts_created ON alerts(created_at);
CREATE INDEX idx_alerts_severity ON alerts(severity);
```

**Key Relationships:**
- Many Alerts belong to one User
- Many Alerts can be related to one Patient

## NoSQL Data Models

### 1. Clinical Notes (MongoDB)

The detailed structure for clinical notes, which have variable structure and content:

```json
{
  "_id": "ObjectId",
  "encounterId": "UUID",
  "patientId": "UUID",
  "doctorId": "UUID",
  "createdAt": "ISODate",
  "updatedAt": "ISODate",
  "status": "String",
  "content": {
    "subjective": {
      "chiefComplaint": "String",
      "historyOfPresentIllness": "String",
      "reviewOfSystems": {
        "constitutional": "String",
        "cardiovascular": "String",
        "respiratory": "String",
        // Other systems
      },
      "pastMedicalHistory": "String",
      "medications": "String",
      "allergies": "String",
      "familyHistory": "String",
      "socialHistory": "String"
    },
    "objective": {
      "vitalSigns": {
        "temperature": "Number",
        "heartRate": "Number",
        "respiratoryRate": "Number",
        "bloodPressure": {
          "systolic": "Number",
          "diastolic": "Number"
        },
        "oxygenSaturation": "Number",
        "weight": "Number",
        "height": "Number",
        "bmi": "Number"
      },
      "physicalExam": {
        "general": "String",
        "heent": "String",
        "cardiovascular": "String",
        "respiratory": "String",
        "gastrointestinal": "String",
        "musculoskeletal": "String",
        "neurological": "String",
        "skin": "String",
        // Other systems
      },
      "labResults": ["Object"],
      "imagingResults": ["Object"]
    },
    "assessment": {
      "diagnoses": ["Object"],
      "differentialDiagnoses": ["String"],
      "clinicalImpression": "String"
    },
    "plan": {
      "diagnostics": ["String"],
      "treatments": ["String"],
      "medications": ["Object"],
      "patientEducation": ["String"],
      "followUp": "String",
      "referrals": ["String"]
    }
  },
  "metadata": {
    "templateUsed": "String",
    "completionTime": "Number",
    "aiAssisted": "Boolean",
    "editHistory": ["Object"]
  },
  "attachments": ["ObjectId"]
}
```

### 2. Voice Recordings (MongoDB with GridFS)

For storing and managing voice recordings:

```json
{
  "_id": "ObjectId",
  "encounterId": "UUID",
  "patientId": "UUID",
  "doctorId": "UUID",
  "createdAt": "ISODate",
  "duration": "Number",
  "fileSize": "Number",
  "mimeType": "String",
  "status": "String",  // "processing", "transcribed", "error"
  "transcriptionId": "ObjectId",
  "metadata": {
    "deviceInfo": "String",
    "quality": "String",
    "processingStats": {
      "transcriptionTime": "Number",
      "wordCount": "Number",
      "confidence": "Number"
    }
  },
  "retentionPolicy": {
    "expiresAt": "ISODate",
    "retentionReason": "String"
  },
  "fileId": "ObjectId"  // Reference to GridFS file
}
```

### 3. User Preferences (Redis)

For fast access to user preferences and settings:

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
  ],
  "defaultViews": {
    "schedule": "day",
    "patientList": "appointments"
  },
  "quickActions": [
    "newPrescription",
    "labOrder",
    "referral"
  ]
}
```

### 4. Session Data (Redis)

For managing user sessions:

```
Key: session:{sessionId}
Value: {
  "userId": "UUID",
  "role": "doctor",
  "created": 1618840400,
  "expires": 1618844000,
  "lastActivity": 1618842600,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "permissions": [
    "read:patients",
    "write:prescriptions",
    "read:encounters",
    "write:encounters"
  ]
}
```

## Data Access Patterns

### Common Query Patterns

1. **Doctor's Daily Dashboard**
   ```sql
   -- Get today's appointments for a doctor
   SELECT a.*, p.first_name, p.last_name, p.date_of_birth
   FROM appointments a
   JOIN patients p ON a.patient_id = p.id
   WHERE a.doctor_id = :doctorId
   AND DATE(a.start_time) = CURRENT_DATE
   ORDER BY a.start_time;
   
   -- Get pending tasks for a doctor
   SELECT t.*
   FROM tasks t
   WHERE t.assigned_to = :doctorId
   AND t.status = 'pending'
   ORDER BY t.priority DESC, t.due_date;
   
   -- Get unread alerts for a doctor
   SELECT a.*
   FROM alerts a
   WHERE a.user_id = :doctorId
   AND a.is_read = FALSE
   ORDER BY a.severity DESC, a.created_at DESC;
   ```

2. **Patient Timeline**
   ```sql
   -- Get all encounters for a patient
   SELECT e.*, u.full_name as doctor_name
   FROM encounters e
   JOIN users u ON e.doctor_id = u.id
   WHERE e.patient_id = :patientId
   ORDER BY e.start_time DESC;
   
   -- Get all prescriptions for a patient
   SELECT p.*, pi.*, u.full_name as doctor_name
   FROM prescriptions p
   JOIN prescription_items pi ON p.id = pi.prescription_id
   JOIN users u ON p.doctor_id = u.id
   WHERE p.patient_id = :patientId
   ORDER BY p.created_at DESC;
   
   -- Get all orders for a patient
   SELECT o.*, oi.*, u.full_name as doctor_name
   FROM orders o
   JOIN order_items oi ON o.id = oi.order_id
   JOIN users u ON o.doctor_id = u.id
   WHERE o.patient_id = :patientId
   ORDER BY o.created_at DESC;
   ```

3. **Clinical Note Retrieval (MongoDB)**
   ```javascript
   // Get the latest clinical note for an encounter
   db.clinicalNotes.findOne(
     { encounterId: "uuid-here" },
     { sort: { createdAt: -1 } }
   );
   
   // Get all clinical notes for a patient
   db.clinicalNotes.find(
     { patientId: "uuid-here" },
     { sort: { createdAt: -1 } }
   );
   ```

### Caching Strategies

1. **User Session Caching**
   - Store active user sessions in Redis
   - Cache user permissions and preferences
   - TTL-based expiration with sliding window refresh

2. **Patient Data Caching**
   - Cache frequently accessed patient demographics
   - Cache recent patient encounters for quick access
   - Invalidate cache on data updates

3. **Schedule Caching**
   - Cache daily and weekly schedules
   - Update cache on appointment changes
   - Separate cache keys by doctor and date

## Data Migration and Versioning

1. **Schema Migrations**
   - Use database migration tools (Flyway, Liquibase)
   - Version control all schema changes
   - Automated migration testing

2. **Data Versioning**
   - Track document versions in MongoDB
   - Maintain audit history for critical data changes
   - Support point-in-time recovery

## Data Security

1. **Encryption**
   - Encrypt sensitive data at rest
   - Use TLS for data in transit
   - Field-level encryption for PHI

2. **Access Control**
   - Row-level security in PostgreSQL
   - Document-level access control in MongoDB
   - Role-based access control throughout

3. **Audit Logging**
   - Track all data access and modifications
   - Log user actions for compliance
   - Maintain immutable audit trail

## Backup and Recovery

1. **Backup Strategy**
   - Daily full backups
   - Continuous incremental backups
   - Point-in-time recovery capability

2. **Disaster Recovery**
   - Cross-region replication
   - Automated failover
   - Regular recovery testing

## Conclusion

This data model provides a comprehensive foundation for the Dr. Assistant application, supporting all required features while ensuring data integrity, security, and performance. The polyglot persistence approach allows for selecting the optimal storage technology for each data type, while maintaining clear relationships between entities across different databases.

The model is designed to be extensible, allowing for future feature additions without major restructuring. Regular review and optimization of the data model will be necessary as the application evolves and scales.
