/**
 * Encounter Model
 * Represents a patient encounter/visit in the healthcare system
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Encounter = sequelize.define('Encounter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Patient and provider information
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to patient from patient service'
    },
    
    primary_provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Primary healthcare provider for this encounter'
    },
    
    // Encounter identification
    encounter_number: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      comment: 'Unique encounter number for tracking'
    },
    
    // Encounter classification
    encounter_class: {
      type: DataTypes.ENUM(
        'inpatient',
        'outpatient',
        'emergency',
        'urgent_care',
        'home_health',
        'virtual',
        'observation',
        'day_surgery'
      ),
      allowNull: false,
      defaultValue: 'outpatient'
    },
    
    encounter_type: {
      type: DataTypes.ENUM(
        'initial_consultation',
        'follow_up',
        'routine_checkup',
        'emergency_visit',
        'specialist_consultation',
        'procedure',
        'diagnostic',
        'preventive_care',
        'chronic_care_management',
        'telemedicine'
      ),
      allowNull: false,
      defaultValue: 'initial_consultation'
    },
    
    // Encounter status and timing
    status: {
      type: DataTypes.ENUM(
        'planned',
        'arrived',
        'triaged',
        'in_progress',
        'on_hold',
        'finished',
        'cancelled',
        'entered_in_error'
      ),
      allowNull: false,
      defaultValue: 'planned'
    },
    
    priority: {
      type: DataTypes.ENUM('routine', 'urgent', 'asap', 'stat'),
      defaultValue: 'routine'
    },
    
    // Timing information
    planned_start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Scheduled start time for the encounter'
    },
    
    actual_start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Actual start time when encounter began'
    },
    
    actual_end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Actual end time when encounter finished'
    },
    
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Total duration of encounter in minutes'
    },
    
    // Location and facility information
    facility_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Healthcare facility where encounter takes place'
    },
    
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Department or unit within the facility'
    },
    
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Room or location identifier'
    },
    
    // Chief complaint and reason
    chief_complaint: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Primary reason for the encounter'
    },
    
    reason_for_visit: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed reason or purpose of the visit'
    },
    
    // Clinical information
    presenting_problem: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the presenting clinical problem'
    },
    
    history_of_present_illness: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed history of the current illness'
    },
    
    // Encounter outcome and disposition
    disposition: {
      type: DataTypes.ENUM(
        'discharged_home',
        'admitted',
        'transferred',
        'left_ama',
        'expired',
        'referred',
        'follow_up_scheduled',
        'observation'
      ),
      allowNull: true,
      comment: 'Final disposition of the patient'
    },
    
    discharge_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Instructions given to patient at discharge'
    },
    
    // Administrative information
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to associated appointment'
    },
    
    pre_diagnosis_summary_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to pre-diagnosis summary if available'
    },
    
    // Insurance and billing
    insurance_authorization: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Insurance authorization number'
    },
    
    billing_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Primary billing/procedure code'
    },
    
    // Quality and safety
    patient_satisfaction_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10
      },
      comment: 'Patient satisfaction score (0-10)'
    },
    
    safety_incidents: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of safety incidents during encounter'
    },
    
    // Metadata
    encounter_source: {
      type: DataTypes.ENUM('manual', 'ehr_import', 'api', 'mobile_app'),
      defaultValue: 'manual'
    },
    
    external_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'External system identifier'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional administrative notes'
    },
    
    // Audit fields
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who created the encounter'
    },
    
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who last updated the encounter'
    },
    
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for optimistic locking'
    }
  }, {
    tableName: 'encounters',
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['primary_provider_id']
      },
      {
        fields: ['encounter_number'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['encounter_class']
      },
      {
        fields: ['encounter_type']
      },
      {
        fields: ['planned_start_time']
      },
      {
        fields: ['actual_start_time']
      },
      {
        fields: ['appointment_id']
      },
      {
        fields: ['facility_id']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: async (encounter) => {
        // Generate encounter number if not provided
        if (!encounter.encounter_number) {
          const timestamp = Date.now().toString();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          encounter.encounter_number = `ENC-${timestamp}-${random}`;
        }
      },
      
      beforeUpdate: async (encounter) => {
        // Update version for optimistic locking
        encounter.version += 1;
        
        // Calculate duration if both start and end times are set
        if (encounter.actual_start_time && encounter.actual_end_time) {
          const startTime = new Date(encounter.actual_start_time);
          const endTime = new Date(encounter.actual_end_time);
          encounter.duration_minutes = Math.round((endTime - startTime) / (1000 * 60));
        }
      }
    }
  });

  // Instance methods
  Encounter.prototype.calculateDuration = function() {
    if (this.actual_start_time && this.actual_end_time) {
      const startTime = new Date(this.actual_start_time);
      const endTime = new Date(this.actual_end_time);
      return Math.round((endTime - startTime) / (1000 * 60));
    }
    return null;
  };

  Encounter.prototype.isActive = function() {
    return ['arrived', 'triaged', 'in_progress', 'on_hold'].includes(this.status);
  };

  Encounter.prototype.isCompleted = function() {
    return ['finished', 'cancelled'].includes(this.status);
  };

  // Class methods
  Encounter.findActiveEncounters = function(providerId) {
    return this.findAll({
      where: {
        primary_provider_id: providerId,
        status: ['arrived', 'triaged', 'in_progress', 'on_hold']
      },
      order: [['planned_start_time', 'ASC']]
    });
  };

  Encounter.findByPatient = function(patientId, limit = 10) {
    return this.findAll({
      where: { patient_id: patientId },
      order: [['created_at', 'DESC']],
      limit
    });
  };

  return Encounter;
};
