# ADR-002: Database Technology Choices

## Status

Accepted

## Context

The Dr. Assistant application needs to store and manage various types of data, including structured data (users, patients, appointments), semi-structured data (clinical notes, AI outputs), and large binary files (voice recordings, documents). We need to select appropriate database technologies that can handle these different data types efficiently while ensuring data integrity, security, and performance.

## Decision

We will adopt a polyglot persistence approach, using different database technologies for different types of data:

### 1. PostgreSQL

**Use Cases:**
- Structured data with complex relationships
- User accounts and profiles
- Patient demographics
- Appointments and scheduling
- Encounters and medical orders
- Prescriptions
- Tasks and alerts

**Rationale:**
- Strong ACID compliance for data integrity
- Rich query capabilities and indexing options
- Excellent support for complex transactions
- JSON/JSONB support for semi-structured data
- Mature ecosystem with good tooling
- Open-source with strong community support

### 2. MongoDB

**Use Cases:**
- Clinical notes with variable structure
- AI-generated content
- Voice transcription results
- Document metadata

**Rationale:**
- Flexible schema for evolving data structures
- Good performance for document-oriented data
- Native support for nested documents and arrays
- GridFS for storing large files
- Horizontal scalability
- Good driver support for Node.js and Python

### 3. Redis

**Use Cases:**
- Session management
- Caching frequently accessed data
- Real-time features (notifications, presence)
- Rate limiting and throttling
- Temporary data storage

**Rationale:**
- Extremely fast in-memory operations
- Support for various data structures
- Built-in expiration mechanisms
- Pub/sub capabilities for real-time features
- Cluster mode for scalability
- Low operational overhead

### 4. Object Storage (AWS S3 or compatible)

**Use Cases:**
- Voice recordings
- Document attachments
- Images and scans
- Backup files

**Rationale:**
- Designed for storing and retrieving large binary files
- Virtually unlimited storage capacity
- High durability and availability
- Cost-effective for large data volumes
- Built-in versioning and lifecycle policies
- Integration with content delivery networks

## Implementation Details

### 1. Data Access Layer

- Each service will have its own data access layer
- Use of ORMs/ODMs for database interaction:
  - Sequelize for PostgreSQL
  - Mongoose for MongoDB
- Connection pooling for optimal performance
- Consistent error handling and retry logic

### 2. Data Migration and Versioning

- Database schema migrations using tools like Sequelize migrations
- Version control for database schemas
- Backward compatibility for schema changes

### 3. Data Consistency

- Use transactions for operations that span multiple entities in PostgreSQL
- Implement compensating transactions for operations across different databases
- Consider eventual consistency where appropriate

### 4. Security

- Encryption at rest for all databases
- TLS for data in transit
- Strong access controls and authentication
- Regular security audits and vulnerability scanning

### 5. Backup and Recovery

- Regular automated backups
- Point-in-time recovery capability
- Disaster recovery planning
- Regular backup verification and recovery testing

## Consequences

### Advantages

1. **Optimal Storage**: Each data type is stored in the most appropriate database
2. **Performance**: Each database technology is optimized for specific use cases
3. **Flexibility**: Different services can use different databases as needed
4. **Scalability**: Each database can scale independently based on demand

### Challenges

1. **Operational Complexity**: Managing multiple database technologies
2. **Data Consistency**: Ensuring consistency across different databases
3. **Transaction Management**: Handling transactions that span multiple databases
4. **Skill Requirements**: Team needs expertise in multiple database technologies
5. **Monitoring and Maintenance**: More complex monitoring and maintenance

### Mitigation Strategies

1. **Clear Boundaries**: Define clear boundaries between data stored in different databases
2. **Automation**: Automate database management tasks as much as possible
3. **Documentation**: Maintain comprehensive documentation of data models and access patterns
4. **Training**: Provide training for team members on different database technologies
5. **Monitoring**: Implement robust monitoring and alerting for all databases

## Implementation Plan

1. Set up PostgreSQL as the primary database for structured data
2. Implement MongoDB for clinical notes and AI outputs
3. Configure Redis for caching and session management
4. Set up object storage for large files
5. Implement data access layers for each service
6. Establish backup and recovery procedures

## References

- Data Model Document
- System Architecture Document
- Security Implementation Plan
