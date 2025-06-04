/**
 * Encounter Participant Model
 * Represents healthcare providers and other participants in an encounter
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EncounterParticipant = sequelize.define('EncounterParticipant', {
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
    
    participant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of the participating healthcare provider or person'
    },
    
    // Participant details
    participant_type: {
      type: DataTypes.ENUM(
        'primary_provider',
        'consulting_provider',
        'specialist',
        'nurse',
        'resident',
        'student',
        'technician',
        'therapist',
        'social_worker',
        'interpreter',
        'family_member',
        'caregiver',
        'observer'
      ),
      allowNull: false,
      comment: 'Type/role of the participant'
    },
    
    participant_role: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Specific role or title of the participant'
    },
    
    specialty: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Medical specialty of the participant'
    },
    
    // Participation details
    participation_status: {
      type: DataTypes.ENUM(
        'active',
        'inactive',
        'requested',
        'declined',
        'completed'
      ),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Status of participation'
    },
    
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When participant joined the encounter'
    },
    
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When participant left the encounter'
    },
    
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration of participation in minutes'
    },
    
    // Responsibilities and permissions
    primary_responsibility: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this participant has primary responsibility'
    },
    
    can_document: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether participant can document in the encounter'
    },
    
    can_order: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether participant can place orders'
    },
    
    can_prescribe: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether participant can prescribe medications'
    },
    
    supervision_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether participant requires supervision'
    },
    
    supervising_provider_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of supervising provider if supervision required'
    },
    
    // Participation context
    reason_for_participation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason why this participant was involved'
    },
    
    consultation_type: {
      type: DataTypes.ENUM(
        'routine',
        'urgent',
        'emergency',
        'second_opinion',
        'teaching',
        'research'
      ),
      allowNull: true,
      comment: 'Type of consultation if applicable'
    },
    
    // Communication and interaction
    communication_method: {
      type: DataTypes.ENUM(
        'in_person',
        'telephone',
        'video_call',
        'secure_messaging',
        'email'
      ),
      allowNull: true,
      comment: 'How participant communicated during encounter'
    },
    
    language_used: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Language used for communication'
    },
    
    interpreter_needed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether interpreter was needed'
    },
    
    // Contributions and activities
    activities_performed: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'List of activities performed by participant'
    },
    
    documentation_contributed: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Documentation sections contributed by participant'
    },
    
    orders_placed: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Orders placed by this participant'
    },
    
    procedures_performed: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Procedures performed by participant'
    },
    
    // Quality and education
    teaching_provided: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether participant provided teaching'
    },
    
    teaching_topics: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Topics taught during encounter'
    },
    
    learning_objectives_met: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Learning objectives met (for students/residents)'
    },
    
    // Billing and compensation
    billable_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Billable time in minutes'
    },
    
    billing_provider: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this participant is the billing provider'
    },
    
    compensation_type: {
      type: DataTypes.ENUM(
        'salary',
        'hourly',
        'per_encounter',
        'volunteer',
        'student',
        'not_applicable'
      ),
      allowNull: true,
      comment: 'Type of compensation for participation'
    },
    
    // Location and logistics
    physical_location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Physical location of participant during encounter'
    },
    
    remote_participation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether participant joined remotely'
    },
    
    technology_used: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Technology platforms used for participation'
    },
    
    // Feedback and evaluation
    participant_satisfaction: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10
      },
      comment: 'Participant satisfaction with encounter'
    },
    
    performance_rating: {
      type: DataTypes.ENUM('excellent', 'good', 'satisfactory', 'needs_improvement'),
      allowNull: true,
      comment: 'Performance rating for participant'
    },
    
    feedback_provided: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Feedback provided by or about participant'
    },
    
    // Compliance and credentialing
    credentials_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether credentials were verified'
    },
    
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Professional license number'
    },
    
    license_state: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'State where license is valid'
    },
    
    privileging_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether hospital privileges were verified'
    },
    
    // Contact information
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Contact phone number during encounter'
    },
    
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Contact email address'
    },
    
    emergency_contact: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Emergency contact information'
    },
    
    // Metadata
    participation_source: {
      type: DataTypes.ENUM('scheduled', 'on_call', 'emergency', 'consultation_request'),
      defaultValue: 'scheduled'
    },
    
    invitation_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether invitation was sent to participant'
    },
    
    invitation_accepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether participant accepted invitation'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about participation'
    },
    
    // Audit fields
    added_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who added this participant'
    },
    
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who last updated the participation record'
    },
    
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for optimistic locking'
    }
  }, {
    tableName: 'encounter_participants',
    indexes: [
      {
        fields: ['encounter_id']
      },
      {
        fields: ['participant_id']
      },
      {
        fields: ['participant_type']
      },
      {
        fields: ['participation_status']
      },
      {
        fields: ['primary_responsibility']
      },
      {
        fields: ['billing_provider']
      },
      {
        fields: ['start_time']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['encounter_id', 'participant_id', 'participant_type']
      }
    ],
    hooks: {
      beforeUpdate: async (participant) => {
        participant.version += 1;
        
        // Calculate duration if start and end times are set
        if (participant.start_time && participant.end_time) {
          const startTime = new Date(participant.start_time);
          const endTime = new Date(participant.end_time);
          participant.duration_minutes = Math.round((endTime - startTime) / (1000 * 60));
        }
      }
    }
  });

  // Instance methods
  EncounterParticipant.prototype.isActive = function() {
    return this.participation_status === 'active';
  };

  EncounterParticipant.prototype.isPrimaryProvider = function() {
    return this.participant_type === 'primary_provider' || this.primary_responsibility;
  };

  EncounterParticipant.prototype.canBill = function() {
    return this.billing_provider;
  };

  EncounterParticipant.prototype.requiresSupervision = function() {
    return this.supervision_required;
  };

  EncounterParticipant.prototype.calculateDuration = function() {
    if (this.start_time && this.end_time) {
      const startTime = new Date(this.start_time);
      const endTime = new Date(this.end_time);
      return Math.round((endTime - startTime) / (1000 * 60));
    }
    return null;
  };

  // Class methods
  EncounterParticipant.findByEncounter = function(encounterId) {
    return this.findAll({
      where: { encounter_id: encounterId },
      order: [
        ['primary_responsibility', 'DESC'],
        ['participant_type', 'ASC'],
        ['start_time', 'ASC']
      ]
    });
  };

  EncounterParticipant.findPrimaryProvider = function(encounterId) {
    return this.findOne({
      where: {
        encounter_id: encounterId,
        participant_type: 'primary_provider'
      }
    });
  };

  EncounterParticipant.findActiveParticipants = function(encounterId) {
    return this.findAll({
      where: {
        encounter_id: encounterId,
        participation_status: 'active'
      }
    });
  };

  EncounterParticipant.findByProvider = function(providerId, limit = 20) {
    return this.findAll({
      where: { participant_id: providerId },
      order: [['created_at', 'DESC']],
      limit,
      include: ['encounter']
    });
  };

  return EncounterParticipant;
};
