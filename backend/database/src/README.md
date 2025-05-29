# Database Infrastructure

This module provides the database infrastructure for the Dr. Assistant application, including database connections, repositories, and services.

## Directory Structure

```
src/
├── config/              # Database configuration
│   └── database.js      # Database connection configuration
├── repositories/        # Data access repositories
│   ├── base.repository.js  # Base repository for PostgreSQL
│   └── mongo.repository.js # Base repository for MongoDB
├── services/            # Database services
│   ├── cache.service.js    # Redis caching service
│   └── migration.service.js # Database migration service
├── scripts/             # Database scripts
│   ├── run-migrations.js   # Script to run database migrations
│   └── seed-database.js    # Script to seed the database
├── utils/               # Utility functions
│   └── logger.js        # Logging utility
└── index.js             # Main entry point
```

## Database Technologies

The Dr. Assistant application uses a polyglot persistence approach with multiple database technologies:

1. **PostgreSQL**: Primary relational database for structured data with complex relationships
2. **MongoDB**: Document database for flexible schema data like clinical notes and AI outputs
3. **Redis**: In-memory data store for caching and real-time features

## Configuration

Database configuration is managed through environment variables. See `.env.example` for available configuration options.

## Repositories

The database module provides base repository classes for PostgreSQL and MongoDB:

- **BaseRepository**: Provides CRUD operations for PostgreSQL tables
- **MongoRepository**: Provides CRUD operations for MongoDB collections

## Services

The database module provides the following services:

- **CacheService**: Provides caching functionality using Redis
- **MigrationService**: Provides database migration functionality

## Usage

### Connecting to Databases

```javascript
const { pgPool, connectMongo, redisClient } = require('dr-assistant-database');

// PostgreSQL is automatically connected when the module is loaded
// MongoDB needs to be explicitly connected
await connectMongo();
```

### Using Repositories

```javascript
const { BaseRepository, MongoRepository } = require('dr-assistant-database');

// Create a PostgreSQL repository
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }
  
  // Add custom methods here
}

// Create a MongoDB repository
class ClinicalNoteRepository extends MongoRepository {
  constructor(model) {
    super(model);
  }
  
  // Add custom methods here
}
```

### Using Cache Service

```javascript
const { CacheService } = require('dr-assistant-database');

// Set a value in the cache
await CacheService.set('user:123', { id: 123, name: 'John Doe' }, { ttl: 3600 });

// Get a value from the cache
const user = await CacheService.get('user:123');

// Get a value with fallback
const user = await CacheService.getOrSet('user:123', async () => {
  // Fallback function to fetch user if not in cache
  return await userRepository.findById(123);
}, { ttl: 3600 });
```

### Running Migrations

```bash
# Using npm script
npm run migrate

# Or directly
node src/scripts/run-migrations.js
```

### Seeding the Database

```bash
# Using npm script
npm run seed

# Or directly
node src/scripts/seed-database.js
```

## Development Guidelines

1. **Repository Pattern**: Use the repository pattern for database access
2. **Transactions**: Use transactions for operations that require atomicity
3. **Error Handling**: Handle database errors appropriately
4. **Logging**: Log database operations for debugging and monitoring
5. **Caching**: Use caching for frequently accessed data
6. **Migrations**: Use migrations for schema changes
7. **Testing**: Write tests for database operations

## Testing

The database module includes tests for repositories and services. Run tests using:

```bash
npm test
```
