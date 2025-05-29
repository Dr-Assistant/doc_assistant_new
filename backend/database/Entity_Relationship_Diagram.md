# Entity Relationship Diagram (ERD)

This document provides a visual representation of the database entities and their relationships for the Dr. Assistant application.

## Core Entities and Relationships

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
└───────────────┘     └───────┬───────┘     └───────┬───────┘
                              │                     │
                              ▼                     ▼
                     ┌───────────────┐     ┌───────────────┐
                     │               │     │               │
                     │ Prescription  │     │  Order Item   │
                     │     Item      │     │               │
                     │               │     │               │
                     └───────────────┘     └───────────────┘
```

## Additional Entities

```
┌───────────────┐       ┌───────────────┐
│               │       │               │
│     User      │◄──────┤     Task      │
│               │1     *│               │
└───────┬───────┘       └───────┬───────┘
        │                       │
        │                       │
        │                       │
        ▼                       │
┌───────────────┐               │
│               │               │
│     Alert     │               │
│               │               │
└───────────────┘               │
                                │
                                │
┌───────────────┐               │
│               │               │
│    Patient    │◄──────────────┘
│               │*
└───────────────┘
```

## MongoDB Collections

```
┌───────────────┐       ┌───────────────┐
│               │       │               │
│   Encounter   │───────►Clinical Note  │
│               │1     1│               │
└───────────────┘       └───────────────┘


┌───────────────┐       ┌───────────────┐
│               │       │               │
│   Encounter   │───────►    Voice      │
│               │1     *│   Recording   │
└───────────────┘       └───────────────┘
```

## Detailed Entity Relationships

### User Relationships
- One User can have many Appointments (as the doctor)
- One User can have many Encounters (as the doctor)
- One User can have many Tasks (assigned to or created by)
- One User can have many Alerts
- One User can have many Prescriptions (as the doctor)
- One User can have many Orders (as the doctor)

### Patient Relationships
- One Patient can have many Appointments
- One Patient can have many Encounters
- One Patient can have many Clinical Notes
- One Patient can have many Prescriptions
- One Patient can have many Orders
- One Patient can be related to many Tasks
- One Patient can be related to many Alerts

### Appointment Relationships
- Many Appointments belong to one User (doctor)
- Many Appointments belong to one Patient
- One Appointment can lead to one Encounter

### Encounter Relationships
- Many Encounters belong to one User (doctor)
- Many Encounters belong to one Patient
- One Encounter can be related to one Appointment
- One Encounter can have one Clinical Note
- One Encounter can have many Prescriptions
- One Encounter can have many Orders
- One Encounter can have many Voice Recordings

### Clinical Note Relationships
- One Clinical Note belongs to one Encounter
- One Clinical Note belongs to one Patient
- One Clinical Note belongs to one User (doctor)

### Prescription Relationships
- Many Prescriptions belong to one Encounter
- Many Prescriptions belong to one Patient
- Many Prescriptions belong to one User (doctor)
- One Prescription can have many Prescription Items

### Order Relationships
- Many Orders belong to one Encounter
- Many Orders belong to one Patient
- Many Orders belong to one User (doctor)
- One Order can have many Order Items

### Task Relationships
- Many Tasks can be assigned to one User
- Many Tasks can be created by one User
- Many Tasks can be related to one Patient
- Many Tasks can be related to one Encounter

### Alert Relationships
- Many Alerts belong to one User
- Many Alerts can be related to one Patient

## Cardinality Notation

- `1` : Exactly one
- `*` : Zero or more
- `1..*` : One or more
- `0..1` : Zero or one

## Database Technologies

- **PostgreSQL**: Used for structured relational data (Users, Patients, Appointments, Encounters, Prescriptions, Orders, Tasks, Alerts)
- **MongoDB**: Used for flexible schema data (Clinical Notes, Voice Recordings)
- **Redis**: Used for caching and session management

## Notes on Implementation

- Foreign keys are used to enforce referential integrity in PostgreSQL
- MongoDB references use string UUIDs to maintain relationships with PostgreSQL entities
- Composite indexes are used for frequently queried combinations of columns
- Partial indexes are used where appropriate to optimize query performance
