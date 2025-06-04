/**
 * Diagnosis Model
 * Represents diagnoses made during encounters and consultations
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Diagnosis = sequelize.define('Diagnosis', {
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
    
    // Diagnosis identification
    diagnosis_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'ICD-10 or other standard diagnosis code'
    },
    
    diagnosis_code_system: {
      type: DataTypes.ENUM('ICD-10', 'ICD-11', 'SNOMED-CT', 'CPT', 'LOINC', 'custom'),
      defaultValue: 'ICD-10',
      comment: 'Coding system used for diagnosis code'
    },
    
    // Diagnosis details
    diagnosis_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Primary name/description of the diagnosis'
    },
    
    diagnosis_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the diagnosis'
    },
    
    // Diagnosis classification
    diagnosis_type: {
      type: DataTypes.ENUM(
        'primary',
        'secondary',
        'differential',
        'rule_out',
        'working',
        'provisional',
        'final',
        'chronic',
        'acute'
      ),
      allowNull: false,
      defaultValue: 'primary',
      comment: 'Type/category of diagnosis'
    },
    
    diagnosis_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Medical category (e.g., cardiovascular, respiratory)'
    },
    
    // Clinical context
    onset_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the condition/symptoms first appeared'
    },
    
    diagnosis_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the diagnosis was made'
    },
    
    diagnosed_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Healthcare provider who made the diagnosis'
    },
    
    // Severity and status
    severity: {
      type: DataTypes.ENUM('mild', 'moderate', 'severe', 'critical'),
      allowNull: true,
      comment: 'Severity level of the condition'
    },
    
    status: {
      type: DataTypes.ENUM(
        'active',
        'inactive',
        'resolved',
        'chronic',
        'recurrent',
        'in_remission',
        'ruled_out',
        'confirmed'
      ),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Current status of the diagnosis'
    },
    
    certainty: {
      type: DataTypes.ENUM('confirmed', 'probable', 'possible', 'suspected'),
      allowNull: false,
      defaultValue: 'confirmed',
      comment: 'Level of diagnostic certainty'
    },
    
    // Clinical evidence
    supporting_evidence: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Evidence supporting the diagnosis (symptoms, tests, etc.)'
    },
    
    clinical_findings: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinical findings that support this diagnosis'
    },
    
    diagnostic_tests: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Diagnostic tests that confirmed or support the diagnosis'
    },
    
    // Anatomical location
    body_site: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Anatomical location affected by the condition'
    },
    
    laterality: {
      type: DataTypes.ENUM('left', 'right', 'bilateral', 'unilateral', 'not_applicable'),
      allowNull: true,
      comment: 'Laterality of the condition'
    },
    
    // Staging and grading
    stage: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Disease stage (for cancers, etc.)'
    },
    
    grade: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Disease grade or classification'
    },
    
    // Prognosis
    prognosis: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'grave'),
      allowNull: true,
      comment: 'Expected outcome/prognosis'
    },
    
    expected_duration: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Expected duration of the condition'
    },
    
    // Related conditions
    comorbidities: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Related or comorbid conditions'
    },
    
    complications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Known or potential complications'
    },
    
    // Treatment implications
    treatment_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether treatment is required'
    },
    
    urgency_level: {
      type: DataTypes.ENUM('routine', 'urgent', 'emergent', 'immediate'),
      defaultValue: 'routine',
      comment: 'Urgency level for treatment'
    },
    
    follow_up_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether follow-up is required'
    },
    
    follow_up_timeframe: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Recommended follow-up timeframe'
    },
    
    // Quality and validation
    diagnosis_confidence: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Confidence level in diagnosis (0-1)'
    },
    
    peer_reviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether diagnosis has been peer reviewed'
    },
    
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Provider who reviewed the diagnosis'
    },
    
    review_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of diagnosis review'
    },
    
    // Documentation
    clinical_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinical notes about the diagnosis'
    },
    
    patient_education_provided: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether patient education was provided'
    },
    
    patient_understanding: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'not_assessed'),
      allowNull: true,
      comment: 'Patient understanding of the diagnosis'
    },
    
    // External references
    external_diagnosis_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'External system diagnosis identifier'
    },
    
    source_system: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Source system for imported diagnoses'
    },
    
    // Metadata
    diagnosis_source: {
      type: DataTypes.ENUM('clinical_assessment', 'ai_assisted', 'imported', 'patient_reported'),
      defaultValue: 'clinical_assessment'
    },
    
    ai_confidence_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'AI confidence score if AI-assisted diagnosis'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the diagnosis'
    },
    
    // Audit fields
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who created the diagnosis record'
    },
    
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who last updated the diagnosis'
    },
    
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for optimistic locking'
    }
  }, {
    tableName: 'diagnoses',
    indexes: [
      {
        fields: ['encounter_id']
      },
      {
        fields: ['consultation_id']
      },
      {
        fields: ['diagnosis_code']
      },
      {
        fields: ['diagnosis_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['diagnosed_by']
      },
      {
        fields: ['diagnosis_date']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['urgency_level']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeUpdate: async (diagnosis) => {
        diagnosis.version += 1;
      }
    }
  });

  // Instance methods
  Diagnosis.prototype.isPrimary = function() {
    return this.diagnosis_type === 'primary';
  };

  Diagnosis.prototype.isActive = function() {
    return ['active', 'chronic', 'recurrent'].includes(this.status);
  };

  Diagnosis.prototype.requiresUrgentTreatment = function() {
    return ['urgent', 'emergent', 'immediate'].includes(this.urgency_level);
  };

  Diagnosis.prototype.isConfirmed = function() {
    return this.certainty === 'confirmed' && this.status === 'confirmed';
  };

  // Class methods
  Diagnosis.findByEncounter = function(encounterId) {
    return this.findAll({
      where: { encounter_id: encounterId },
      order: [
        ['diagnosis_type', 'ASC'], // Primary first
        ['diagnosis_date', 'DESC']
      ]
    });
  };

  Diagnosis.findPrimaryDiagnoses = function(encounterId) {
    return this.findAll({
      where: {
        encounter_id: encounterId,
        diagnosis_type: 'primary'
      },
      order: [['diagnosis_date', 'DESC']]
    });
  };

  Diagnosis.findActiveByPatient = function(patientId) {
    return this.findAll({
      include: [{
        model: sequelize.models.Encounter,
        as: 'encounter',
        where: { patient_id: patientId }
      }],
      where: {
        status: ['active', 'chronic', 'recurrent']
      },
      order: [['diagnosis_date', 'DESC']]
    });
  };

  Diagnosis.findByCode = function(diagnosisCode) {
    return this.findAll({
      where: { diagnosis_code: diagnosisCode },
      order: [['diagnosis_date', 'DESC']]
    });
  };

  return Diagnosis;
};
