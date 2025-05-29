/**
 * Database Models Index
 * Initializes Sequelize and defines model relationships
 */

const { Sequelize } = require('sequelize');
const config = require('../config');
const { logger } = require('../utils/logger');

// Initialize Sequelize
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const ConsentRequest = require('./consent-request.model')(sequelize);
const ConsentArtifact = require('./consent-artifact.model')(sequelize);
const ConsentAuditLog = require('./consent-audit-log.model')(sequelize);
const HealthRecordFetchRequest = require('./health-record-fetch-request.model')(sequelize);
const HealthRecord = require('./health-record.model')(sequelize);
const HealthRecordProcessingLog = require('./health-record-processing-log.model')(sequelize);
const HealthRecordAccessLog = require('./health-record-access-log.model')(sequelize);

// Define associations
ConsentRequest.hasMany(ConsentArtifact, {
  foreignKey: 'consentRequestId',
  as: 'artifacts'
});

ConsentArtifact.belongsTo(ConsentRequest, {
  foreignKey: 'consentRequestId',
  as: 'request'
});

ConsentRequest.hasMany(ConsentAuditLog, {
  foreignKey: 'consentRequestId',
  as: 'auditLogs'
});

ConsentArtifact.hasMany(ConsentAuditLog, {
  foreignKey: 'consentArtifactId',
  as: 'auditLogs'
});

// Health Record associations
ConsentArtifact.hasMany(HealthRecordFetchRequest, {
  foreignKey: 'consentArtifactId',
  as: 'fetchRequests'
});

HealthRecordFetchRequest.belongsTo(ConsentArtifact, {
  foreignKey: 'consentArtifactId',
  as: 'consentArtifact'
});

HealthRecordFetchRequest.hasMany(HealthRecord, {
  foreignKey: 'fetchRequestId',
  as: 'healthRecords'
});

HealthRecord.belongsTo(HealthRecordFetchRequest, {
  foreignKey: 'fetchRequestId',
  as: 'fetchRequest'
});

HealthRecordFetchRequest.hasMany(HealthRecordProcessingLog, {
  foreignKey: 'fetchRequestId',
  as: 'processingLogs'
});

HealthRecordProcessingLog.belongsTo(HealthRecordFetchRequest, {
  foreignKey: 'fetchRequestId',
  as: 'fetchRequest'
});

HealthRecord.hasMany(HealthRecordProcessingLog, {
  foreignKey: 'healthRecordId',
  as: 'processingLogs'
});

HealthRecordProcessingLog.belongsTo(HealthRecord, {
  foreignKey: 'healthRecordId',
  as: 'healthRecord'
});

HealthRecord.hasMany(HealthRecordAccessLog, {
  foreignKey: 'healthRecordId',
  as: 'accessLogs'
});

HealthRecordAccessLog.belongsTo(HealthRecord, {
  foreignKey: 'healthRecordId',
  as: 'healthRecord'
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    return false;
  }
};

// Sync models (only in development)
const syncModels = async () => {
  if (config.nodeEnv === 'development') {
    try {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    } catch (error) {
      logger.error('Error synchronizing models:', error);
    }
  }
};

module.exports = {
  sequelize,
  ConsentRequest,
  ConsentArtifact,
  ConsentAuditLog,
  HealthRecordFetchRequest,
  HealthRecord,
  HealthRecordProcessingLog,
  HealthRecordAccessLog,
  testConnection,
  syncModels
};
