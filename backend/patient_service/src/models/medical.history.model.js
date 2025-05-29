/**
 * Medical History Model
 * This module defines the Medical History model using Sequelize
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MedicalHistory = sequelize.define('MedicalHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    // Chronic Conditions
    chronic_conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'List of chronic conditions with diagnosis date and status'
    },
    // Family History
    family_history: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Family medical history with conditions and relationships'
    },
    // Surgical History
    surgical_history: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'List of surgeries with dates and details'
    },
    // Medication History
    medication_history: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'List of current and past medications'
    },
    // Immunization History
    immunization_history: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'List of immunizations with dates'
    },
    // Allergies and Adverse Reactions
    allergies: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'List of allergies and adverse reactions'
    },
    // Social History
    social_history: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Social history including smoking, alcohol, occupation'
    },
    // Lifestyle Factors
    lifestyle_factors: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Lifestyle factors like diet, exercise, sleep'
    },
    // Vital Signs History
    vital_signs_history: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Historical vital signs records'
    },
    // Lab Results
    lab_results: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Historical lab results'
    },
    // Imaging Studies
    imaging_studies: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Historical imaging studies'
    },
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Metadata
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User ID who created the record'
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User ID who last updated the record'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'medical_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_medical_history_patient',
        fields: ['patient_id']
      },
      {
        name: 'idx_medical_history_version',
        fields: ['patient_id', 'version']
      }
    ]
  });

  // Instance methods
  MedicalHistory.prototype.getLatestVersion = async function() {
    return await this.constructor.max('version', {
      where: { patient_id: this.patient_id }
    });
  };

  MedicalHistory.prototype.createNewVersion = async function(updates) {
    const latestVersion = await this.getLatestVersion();
    const newVersion = latestVersion + 1;
    
    return await this.constructor.create({
      ...this.toJSON(),
      ...updates,
      version: newVersion,
      id: undefined // Let Sequelize generate new UUID
    });
  };

  return MedicalHistory;
};
