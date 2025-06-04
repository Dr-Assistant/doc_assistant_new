/**
 * Consultation Model
 * Represents individual consultations within an encounter
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Consultation = sequelize.define('Consultation', {
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
    
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Healthcare provider conducting this consultation'
    },
    
    // Consultation identification
    consultation_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Unique consultation identifier within encounter'
    },
    
    // Consultation type and specialty
    consultation_type: {
      type: DataTypes.ENUM(
        'primary_care',
        'specialist',
        'emergency',
        'follow_up',
        'second_opinion',
        'multidisciplinary',
        'telemedicine',
        'nursing',
        'therapy'
      ),
      allowNull: false,
      defaultValue: 'primary_care'
    },
    
    specialty: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Medical specialty for this consultation'
    },
    
    // Status and timing
    status: {
      type: DataTypes.ENUM(
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'no_show',
        'rescheduled'
      ),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When consultation started'
    },
    
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When consultation ended'
    },
    
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration of consultation in minutes'
    },
    
    // Clinical content
    chief_complaint: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Primary complaint for this consultation'
    },
    
    history_present_illness: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'History of present illness'
    },
    
    review_of_systems: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Structured review of systems data'
    },
    
    physical_examination: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Physical examination findings'
    },
    
    assessment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinical assessment and impression'
    },
    
    plan: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Treatment plan and recommendations'
    },
    
    // Clinical decision making
    differential_diagnosis: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'List of differential diagnoses considered'
    },
    
    clinical_reasoning: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinical reasoning and decision-making process'
    },
    
    // Orders and referrals
    orders_placed: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Laboratory, imaging, and other orders placed'
    },
    
    referrals_made: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Referrals to other providers or services'
    },
    
    prescriptions_written: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Medications prescribed during consultation'
    },
    
    // Patient education and counseling
    patient_education: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Education provided to patient'
    },
    
    counseling_provided: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Counseling and advice given'
    },
    
    // Follow-up and care coordination
    follow_up_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Follow-up instructions for patient'
    },
    
    next_appointment_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether next appointment is recommended'
    },
    
    recommended_follow_up_timeframe: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Recommended timeframe for follow-up'
    },
    
    // Quality metrics
    complexity_level: {
      type: DataTypes.ENUM('low', 'moderate', 'high'),
      allowNull: true,
      comment: 'Clinical complexity level of consultation'
    },
    
    decision_making_complexity: {
      type: DataTypes.ENUM('straightforward', 'moderate', 'high'),
      allowNull: true,
      comment: 'Complexity of medical decision making'
    },
    
    // Documentation and billing
    documentation_complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether documentation is complete'
    },
    
    billing_codes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'CPT and other billing codes for consultation'
    },
    
    // Patient interaction
    patient_satisfaction: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10
      },
      comment: 'Patient satisfaction score for this consultation'
    },
    
    communication_barriers: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Any communication barriers encountered'
    },
    
    interpreter_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether interpreter services were used'
    },
    
    // Technology and tools used
    telemedicine_platform: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Platform used for telemedicine consultation'
    },
    
    ai_tools_used: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'AI tools or decision support systems used'
    },
    
    // Clinical notes reference
    clinical_notes_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Reference to clinical notes in MongoDB'
    },
    
    // Metadata
    consultation_source: {
      type: DataTypes.ENUM('manual', 'template', 'voice_transcription', 'ai_assisted'),
      defaultValue: 'manual'
    },
    
    template_used: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Documentation template used'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the consultation'
    },
    
    // Audit fields
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who created the consultation record'
    },
    
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who last updated the consultation'
    },
    
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for optimistic locking'
    }
  }, {
    tableName: 'consultations',
    indexes: [
      {
        fields: ['encounter_id']
      },
      {
        fields: ['provider_id']
      },
      {
        fields: ['consultation_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_time']
      },
      {
        fields: ['specialty']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: async (consultation) => {
        // Generate consultation number if not provided
        if (!consultation.consultation_number) {
          const timestamp = Date.now().toString();
          const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          consultation.consultation_number = `CONS-${timestamp}-${random}`;
        }
      },
      
      beforeUpdate: async (consultation) => {
        // Update version for optimistic locking
        consultation.version += 1;
        
        // Calculate duration if both start and end times are set
        if (consultation.start_time && consultation.end_time) {
          const startTime = new Date(consultation.start_time);
          const endTime = new Date(consultation.end_time);
          consultation.duration_minutes = Math.round((endTime - startTime) / (1000 * 60));
        }
      }
    }
  });

  // Instance methods
  Consultation.prototype.calculateDuration = function() {
    if (this.start_time && this.end_time) {
      const startTime = new Date(this.start_time);
      const endTime = new Date(this.end_time);
      return Math.round((endTime - startTime) / (1000 * 60));
    }
    return null;
  };

  Consultation.prototype.isActive = function() {
    return this.status === 'in_progress';
  };

  Consultation.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  // Class methods
  Consultation.findByProvider = function(providerId, limit = 20) {
    return this.findAll({
      where: { provider_id: providerId },
      order: [['start_time', 'DESC']],
      limit,
      include: ['encounter']
    });
  };

  Consultation.findActiveConsultations = function(providerId) {
    return this.findAll({
      where: {
        provider_id: providerId,
        status: 'in_progress'
      },
      include: ['encounter']
    });
  };

  return Consultation;
};
