/**
 * Treatment Model
 * Represents treatments, procedures, and interventions during encounters
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Treatment = sequelize.define('Treatment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Foreign keys
    encounter_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id'
      }
    },
    
    consultation_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'consultations',
        key: 'id'
      }
    },
    
    // Treatment identification
    treatment_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'CPT, SNOMED-CT, or other standard treatment code'
    },
    
    treatment_code_system: {
      type: DataTypes.ENUM('CPT', 'SNOMED-CT', 'ICD-10-PCS', 'LOINC', 'custom'),
      defaultValue: 'CPT',
      comment: 'Coding system used for treatment code'
    },
    
    // Treatment details
    treatment_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Name/description of the treatment'
    },
    
    treatment_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the treatment'
    },
    
    // Treatment classification
    treatment_type: {
      type: DataTypes.ENUM(
        'medication',
        'procedure',
        'surgery',
        'therapy',
        'counseling',
        'education',
        'monitoring',
        'diagnostic_test',
        'preventive_care',
        'rehabilitation',
        'palliative_care'
      ),
      allowNull: false,
      comment: 'Type/category of treatment'
    },
    
    treatment_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Medical category (e.g., cardiovascular, respiratory)'
    },
    
    // Treatment status and timing
    status: {
      type: DataTypes.ENUM(
        'planned',
        'ordered',
        'in_progress',
        'completed',
        'cancelled',
        'on_hold',
        'discontinued',
        'failed'
      ),
      allowNull: false,
      defaultValue: 'planned',
      comment: 'Current status of the treatment'
    },
    
    ordered_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the treatment was ordered'
    },
    
    ordered_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Healthcare provider who ordered the treatment'
    },
    
    scheduled_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the treatment is scheduled to occur'
    },
    
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the treatment actually started'
    },
    
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the treatment was completed'
    },
    
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration of treatment in minutes'
    },
    
    // Treatment provider
    performed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Healthcare provider who performed the treatment'
    },
    
    performing_department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Department where treatment was performed'
    },
    
    // Clinical context
    indication: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Medical indication for the treatment'
    },
    
    related_diagnosis_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Related diagnosis that this treatment addresses'
    },
    
    // Treatment details
    dosage: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Dosage information for medications'
    },
    
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Frequency of treatment (e.g., daily, BID, PRN)'
    },
    
    route: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Route of administration (oral, IV, topical, etc.)'
    },
    
    quantity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Quantity prescribed or administered'
    },
    
    // Treatment parameters
    treatment_parameters: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Specific parameters for the treatment'
    },
    
    equipment_used: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Medical equipment used during treatment'
    },
    
    // Location and setting
    treatment_location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Where the treatment was performed'
    },
    
    treatment_setting: {
      type: DataTypes.ENUM(
        'inpatient',
        'outpatient',
        'emergency',
        'home',
        'clinic',
        'surgery_center',
        'rehabilitation_facility'
      ),
      allowNull: true,
      comment: 'Setting where treatment occurred'
    },
    
    // Outcomes and effectiveness
    outcome: {
      type: DataTypes.ENUM(
        'successful',
        'partially_successful',
        'unsuccessful',
        'complications',
        'adverse_reaction',
        'pending'
      ),
      allowNull: true,
      comment: 'Outcome of the treatment'
    },
    
    effectiveness_rating: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'not_assessed'),
      allowNull: true,
      comment: 'Effectiveness rating of the treatment'
    },
    
    patient_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Patient response to the treatment'
    },
    
    // Complications and adverse events
    complications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Complications that occurred during treatment'
    },
    
    adverse_events: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Adverse events related to the treatment'
    },
    
    side_effects: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Side effects experienced by patient'
    },
    
    // Follow-up and monitoring
    follow_up_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether follow-up is required'
    },
    
    follow_up_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Follow-up instructions for the treatment'
    },
    
    monitoring_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether ongoing monitoring is required'
    },
    
    monitoring_parameters: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Parameters to monitor'
    },
    
    // Cost and billing
    estimated_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Estimated cost of treatment'
    },
    
    actual_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Actual cost of treatment'
    },
    
    billing_codes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Billing codes associated with treatment'
    },
    
    insurance_coverage: {
      type: DataTypes.ENUM('covered', 'partially_covered', 'not_covered', 'pending'),
      allowNull: true,
      comment: 'Insurance coverage status'
    },
    
    // Quality and safety
    quality_measures: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Quality measures and metrics'
    },
    
    safety_checklist_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether safety checklist was completed'
    },
    
    consent_obtained: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether patient consent was obtained'
    },
    
    consent_type: {
      type: DataTypes.ENUM('verbal', 'written', 'electronic', 'implied'),
      allowNull: true,
      comment: 'Type of consent obtained'
    },
    
    // Documentation
    clinical_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinical notes about the treatment'
    },
    
    procedure_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed procedure notes'
    },
    
    patient_education_provided: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether patient education was provided'
    },
    
    // External references
    external_treatment_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'External system treatment identifier'
    },
    
    source_system: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Source system for imported treatments'
    },
    
    // Metadata
    treatment_source: {
      type: DataTypes.ENUM('manual', 'protocol', 'ai_recommended', 'imported'),
      defaultValue: 'manual'
    },
    
    protocol_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Treatment protocol identifier if applicable'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the treatment'
    },
    
    // Audit fields
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who created the treatment record'
    },
    
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who last updated the treatment'
    },
    
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for optimistic locking'
    }
  }, {
    tableName: 'treatments',
    indexes: [
      {
        fields: ['encounter_id']
      },
      {
        fields: ['consultation_id']
      },
      {
        fields: ['treatment_code']
      },
      {
        fields: ['treatment_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['ordered_by']
      },
      {
        fields: ['performed_by']
      },
      {
        fields: ['ordered_date']
      },
      {
        fields: ['scheduled_date']
      },
      {
        fields: ['related_diagnosis_id']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeUpdate: async (treatment) => {
        treatment.version += 1;
        
        // Calculate duration if start and end dates are set
        if (treatment.start_date && treatment.end_date) {
          const startTime = new Date(treatment.start_date);
          const endTime = new Date(treatment.end_date);
          treatment.duration_minutes = Math.round((endTime - startTime) / (1000 * 60));
        }
      }
    }
  });

  // Instance methods
  Treatment.prototype.isActive = function() {
    return ['planned', 'ordered', 'in_progress'].includes(this.status);
  };

  Treatment.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  Treatment.prototype.requiresMonitoring = function() {
    return this.monitoring_required;
  };

  Treatment.prototype.hasComplications = function() {
    return this.complications && this.complications.length > 0;
  };

  Treatment.prototype.calculateDuration = function() {
    if (this.start_date && this.end_date) {
      const startTime = new Date(this.start_date);
      const endTime = new Date(this.end_date);
      return Math.round((endTime - startTime) / (1000 * 60));
    }
    return null;
  };

  // Class methods
  Treatment.findByEncounter = function(encounterId) {
    return this.findAll({
      where: { encounter_id: encounterId },
      order: [['ordered_date', 'DESC']]
    });
  };

  Treatment.findActiveByProvider = function(providerId) {
    return this.findAll({
      where: {
        ordered_by: providerId,
        status: ['planned', 'ordered', 'in_progress']
      },
      order: [['scheduled_date', 'ASC']]
    });
  };

  Treatment.findByType = function(treatmentType, limit = 50) {
    return this.findAll({
      where: { treatment_type: treatmentType },
      order: [['ordered_date', 'DESC']],
      limit
    });
  };

  Treatment.findRequiringFollowUp = function() {
    return this.findAll({
      where: {
        follow_up_required: true,
        status: 'completed'
      },
      order: [['end_date', 'ASC']]
    });
  };

  return Treatment;
};
