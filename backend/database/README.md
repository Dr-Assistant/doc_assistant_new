# Database Schema and Migrations

This directory contains the database schema definitions and migration scripts for the Dr. Assistant application.

## Directory Structure

```
database/
├── migrations/              # Database migration scripts
│   ├── V1__initial_schema.sql
│   ├── V2__prescriptions_orders_tasks.sql
│   ├── V3__alerts.sql
│   └── mongodb_init.js
├── schemas/                 # Database schema definitions
│   ├── mongodb/             # MongoDB schema definitions
│   │   ├── clinical_notes.js
│   │   └── voice_recordings.js
│   └── postgresql/          # PostgreSQL schema definitions
│       ├── 01_users.sql
│       ├── 02_patients.sql
│       ├── 03_appointments.sql
│       ├── 04_encounters.sql
│       ├── 05_prescriptions.sql
│       ├── 06_orders.sql
│       ├── 07_tasks.sql
│       └── 08_alerts.sql
├── Data_Access_Patterns.md  # Documentation of data access patterns
├── Entity_Relationship_Diagram.md  # Entity relationship diagram
└── README.md                # This file
```

## Database Technologies

The Dr. Assistant application uses a polyglot persistence approach with multiple database technologies:

1. **PostgreSQL**: Primary relational database for structured data with complex relationships
2. **MongoDB**: Document database for flexible schema data like clinical notes and AI outputs
3. **Redis**: In-memory data store for caching and real-time features

## PostgreSQL Schema

The PostgreSQL schema includes the following tables:

1. **users**: Doctors, nurses, and administrative staff
2. **patients**: Individuals receiving medical care
3. **appointments**: Scheduled meetings between doctors and patients
4. **encounters**: Actual clinical visits or interactions
5. **prescriptions**: Medications prescribed to patients
6. **prescription_items**: Individual medication items within a prescription
7. **orders**: Clinical orders such as lab tests or imaging
8. **order_items**: Individual items within an order
9. **tasks**: Work items for users to complete
10. **alerts**: Important notifications for users

## MongoDB Schema

The MongoDB schema includes the following collections:

1. **clinicalNotes**: Documentation of clinical encounters
2. **voiceRecordings**: Voice recordings of doctor-patient conversations
3. **fs.files** and **fs.chunks**: GridFS collections for storing large binary files

## Migration Scripts

The migration scripts are designed to be run in sequence to set up the database schema:

1. **V1__initial_schema.sql**: Creates the initial PostgreSQL schema with users, patients, appointments, and encounters tables
2. **V2__prescriptions_orders_tasks.sql**: Adds prescriptions, orders, and tasks tables
3. **V3__alerts.sql**: Adds alerts table
4. **mongodb_init.js**: Initializes MongoDB collections and indexes

## Running Migrations

### PostgreSQL Migrations

PostgreSQL migrations can be run using Flyway or a similar database migration tool:

```bash
# Using Flyway CLI
flyway -url=jdbc:postgresql://localhost:5432/dr_assistant \
       -user=postgres \
       -password=postgres \
       -locations=filesystem:./migrations \
       migrate
```

### MongoDB Migrations

MongoDB migrations can be run using the MongoDB shell:

```bash
# Using MongoDB shell
mongo -u mongo -p mongo --authenticationDatabase admin dr_assistant mongodb_init.js
```

## Entity Relationship Diagram

See [Entity_Relationship_Diagram.md](./Entity_Relationship_Diagram.md) for a visual representation of the database entities and their relationships.

## Data Access Patterns

See [Data_Access_Patterns.md](./Data_Access_Patterns.md) for documentation of common data access patterns, caching strategies, and performance considerations.

## Development Guidelines

1. **Schema Changes**: All schema changes should be made through migration scripts
2. **Indexes**: Appropriate indexes should be created for frequently queried columns
3. **Constraints**: Use constraints to enforce data integrity
4. **Comments**: Add comments to tables and columns to document their purpose
5. **Naming Conventions**: Follow consistent naming conventions for tables, columns, and indexes
6. **Versioning**: Use sequential version numbers for migration scripts
7. **Testing**: Test migrations on a development database before applying to production
8. **Rollback**: Provide rollback scripts for migrations where possible

## Database Connection

Connection to the database is managed through environment variables:

```
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dr_assistant
DB_USER=postgres
DB_PASSWORD=postgres

# MongoDB
MONGODB_URI=mongodb://mongo:mongo@localhost:27017/dr_assistant

# Redis
REDIS_URI=redis://localhost:6379
```

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Flyway Documentation](https://flywaydb.org/documentation/)
