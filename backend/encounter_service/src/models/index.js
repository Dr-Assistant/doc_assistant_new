/**
 * Database Models
 * This module initializes the database connection and models for the Encounter Service
 */

const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// Create Sequelize instance for PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'dr_assistant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5', 10),
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Connect to MongoDB for clinical notes and documents
const connectMongo = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      logger.info('MongoDB connected successfully');
    } else {
      logger.warn('MongoDB URI not provided, skipping MongoDB connection');
    }
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    logger.warn('Continuing without MongoDB - clinical notes features may be limited');
  }
};

// Import PostgreSQL models
const Encounter = require('./encounter.model')(sequelize);
const Consultation = require('./consultation.model')(sequelize);
const VitalSigns = require('./vitalSigns.model')(sequelize);
const Diagnosis = require('./diagnosis.model')(sequelize);
const Treatment = require('./treatment.model')(sequelize);
const EncounterParticipant = require('./encounterParticipant.model')(sequelize);

// Import MongoDB models
const ClinicalNote = require('./clinicalNote.model');
const EncounterDocument = require('./encounterDocument.model');

// Define associations
const defineAssociations = () => {
  // Encounter associations
  Encounter.hasMany(Consultation, {
    foreignKey: 'encounter_id',
    as: 'consultations'
  });
  
  Encounter.hasMany(VitalSigns, {
    foreignKey: 'encounter_id',
    as: 'vitalSigns'
  });
  
  Encounter.hasMany(Diagnosis, {
    foreignKey: 'encounter_id',
    as: 'diagnoses'
  });
  
  Encounter.hasMany(Treatment, {
    foreignKey: 'encounter_id',
    as: 'treatments'
  });
  
  Encounter.hasMany(EncounterParticipant, {
    foreignKey: 'encounter_id',
    as: 'participants'
  });

  // Consultation associations
  Consultation.belongsTo(Encounter, {
    foreignKey: 'encounter_id',
    as: 'encounter'
  });
  
  Consultation.hasMany(VitalSigns, {
    foreignKey: 'consultation_id',
    as: 'vitalSigns'
  });
  
  Consultation.hasMany(Diagnosis, {
    foreignKey: 'consultation_id',
    as: 'diagnoses'
  });
  
  Consultation.hasMany(Treatment, {
    foreignKey: 'consultation_id',
    as: 'treatments'
  });

  // VitalSigns associations
  VitalSigns.belongsTo(Encounter, {
    foreignKey: 'encounter_id',
    as: 'encounter'
  });
  
  VitalSigns.belongsTo(Consultation, {
    foreignKey: 'consultation_id',
    as: 'consultation'
  });

  // Diagnosis associations
  Diagnosis.belongsTo(Encounter, {
    foreignKey: 'encounter_id',
    as: 'encounter'
  });
  
  Diagnosis.belongsTo(Consultation, {
    foreignKey: 'consultation_id',
    as: 'consultation'
  });

  // Treatment associations
  Treatment.belongsTo(Encounter, {
    foreignKey: 'encounter_id',
    as: 'encounter'
  });
  
  Treatment.belongsTo(Consultation, {
    foreignKey: 'consultation_id',
    as: 'consultation'
  });

  // EncounterParticipant associations
  EncounterParticipant.belongsTo(Encounter, {
    foreignKey: 'encounter_id',
    as: 'encounter'
  });
};

// Initialize associations
defineAssociations();

// Export models and database connections
module.exports = {
  sequelize,
  connectMongo,
  
  // PostgreSQL models
  Encounter,
  Consultation,
  VitalSigns,
  Diagnosis,
  Treatment,
  EncounterParticipant,
  
  // MongoDB models
  ClinicalNote,
  EncounterDocument,
  
  // Utility function
  defineAssociations
};
