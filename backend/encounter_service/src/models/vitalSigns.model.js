/**
 * Vital Signs Model
 * Represents vital signs measurements during encounters and consultations
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VitalSigns = sequelize.define('VitalSigns', {
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
    
    // Measurement timing and context
    measured_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When vital signs were measured'
    },
    
    measured_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Healthcare provider who took the measurements'
    },
    
    measurement_method: {
      type: DataTypes.ENUM('manual', 'automated', 'patient_reported'),
      defaultValue: 'manual',
      comment: 'How the measurements were obtained'
    },
    
    // Basic vital signs
    systolic_bp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 50,
        max: 300
      },
      comment: 'Systolic blood pressure in mmHg'
    },
    
    diastolic_bp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 30,
        max: 200
      },
      comment: 'Diastolic blood pressure in mmHg'
    },
    
    heart_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 30,
        max: 250
      },
      comment: 'Heart rate in beats per minute'
    },
    
    respiratory_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 8,
        max: 60
      },
      comment: 'Respiratory rate in breaths per minute'
    },
    
    temperature: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 90.0,
        max: 115.0
      },
      comment: 'Body temperature in Fahrenheit'
    },
    
    temperature_celsius: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 32.0,
        max: 46.0
      },
      comment: 'Body temperature in Celsius'
    },
    
    temperature_site: {
      type: DataTypes.ENUM('oral', 'rectal', 'axillary', 'tympanic', 'temporal', 'forehead'),
      allowNull: true,
      comment: 'Site where temperature was measured'
    },
    
    // Oxygen saturation
    oxygen_saturation: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 70.0,
        max: 100.0
      },
      comment: 'Oxygen saturation percentage'
    },
    
    oxygen_saturation_method: {
      type: DataTypes.ENUM('pulse_oximetry', 'arterial_blood_gas'),
      allowNull: true,
      comment: 'Method used to measure oxygen saturation'
    },
    
    // Physical measurements
    height: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 20.0,
        max: 300.0
      },
      comment: 'Height in centimeters'
    },
    
    height_inches: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 8.0,
        max: 120.0
      },
      comment: 'Height in inches'
    },
    
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      validate: {
        min: 1.0,
        max: 1000.0
      },
      comment: 'Weight in kilograms'
    },
    
    weight_pounds: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      validate: {
        min: 2.0,
        max: 2200.0
      },
      comment: 'Weight in pounds'
    },
    
    bmi: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 10.0,
        max: 100.0
      },
      comment: 'Body Mass Index'
    },
    
    // Pain assessment
    pain_scale: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 10
      },
      comment: 'Pain scale rating (0-10)'
    },
    
    pain_location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Location of pain if reported'
    },
    
    pain_quality: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Quality/description of pain'
    },
    
    // Additional measurements
    head_circumference: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Head circumference in centimeters (pediatric)'
    },
    
    waist_circumference: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Waist circumference in centimeters'
    },
    
    // Blood glucose (if measured)
    blood_glucose: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 20,
        max: 800
      },
      comment: 'Blood glucose in mg/dL'
    },
    
    glucose_timing: {
      type: DataTypes.ENUM('fasting', 'random', 'post_meal', 'bedtime'),
      allowNull: true,
      comment: 'Timing of glucose measurement'
    },
    
    // Mental status
    consciousness_level: {
      type: DataTypes.ENUM('alert', 'drowsy', 'lethargic', 'stuporous', 'comatose'),
      allowNull: true,
      comment: 'Level of consciousness'
    },
    
    glasgow_coma_scale: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 3,
        max: 15
      },
      comment: 'Glasgow Coma Scale score'
    },
    
    // Equipment and conditions
    equipment_used: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Medical equipment used for measurements'
    },
    
    measurement_conditions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Conditions during measurement (position, activity, etc.)'
    },
    
    // Quality indicators
    measurement_quality: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      defaultValue: 'good',
      comment: 'Quality of the measurements'
    },
    
    abnormal_flags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Flags for abnormal values'
    },
    
    // Clinical context
    patient_position: {
      type: DataTypes.ENUM('sitting', 'standing', 'lying', 'semi_fowler', 'fowler'),
      allowNull: true,
      comment: 'Patient position during measurement'
    },
    
    patient_activity: {
      type: DataTypes.ENUM('resting', 'post_exercise', 'post_meal', 'stressed'),
      allowNull: true,
      comment: 'Patient activity level before measurement'
    },
    
    // Notes and observations
    clinical_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinical notes about the vital signs'
    },
    
    measurement_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes about the measurement process'
    },
    
    // Metadata
    data_source: {
      type: DataTypes.ENUM('manual_entry', 'device_import', 'patient_portal', 'mobile_app'),
      defaultValue: 'manual_entry'
    },
    
    device_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID of device used for measurement'
    },
    
    // Audit fields
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who recorded the vital signs'
    },
    
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who last updated the record'
    },
    
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for optimistic locking'
    }
  }, {
    tableName: 'vital_signs',
    indexes: [
      {
        fields: ['encounter_id']
      },
      {
        fields: ['consultation_id']
      },
      {
        fields: ['measured_at']
      },
      {
        fields: ['measured_by']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeSave: async (vitalSigns) => {
        // Calculate BMI if height and weight are provided
        if (vitalSigns.height && vitalSigns.weight) {
          const heightInMeters = vitalSigns.height / 100;
          vitalSigns.bmi = parseFloat((vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(2));
        }
        
        // Convert temperature between Celsius and Fahrenheit
        if (vitalSigns.temperature && !vitalSigns.temperature_celsius) {
          vitalSigns.temperature_celsius = parseFloat(((vitalSigns.temperature - 32) * 5/9).toFixed(2));
        } else if (vitalSigns.temperature_celsius && !vitalSigns.temperature) {
          vitalSigns.temperature = parseFloat((vitalSigns.temperature_celsius * 9/5 + 32).toFixed(2));
        }
        
        // Convert height between cm and inches
        if (vitalSigns.height && !vitalSigns.height_inches) {
          vitalSigns.height_inches = parseFloat((vitalSigns.height / 2.54).toFixed(2));
        } else if (vitalSigns.height_inches && !vitalSigns.height) {
          vitalSigns.height = parseFloat((vitalSigns.height_inches * 2.54).toFixed(2));
        }
        
        // Convert weight between kg and pounds
        if (vitalSigns.weight && !vitalSigns.weight_pounds) {
          vitalSigns.weight_pounds = parseFloat((vitalSigns.weight * 2.20462).toFixed(2));
        } else if (vitalSigns.weight_pounds && !vitalSigns.weight) {
          vitalSigns.weight = parseFloat((vitalSigns.weight_pounds / 2.20462).toFixed(2));
        }
      },
      
      beforeUpdate: async (vitalSigns) => {
        vitalSigns.version += 1;
      }
    }
  });

  // Instance methods
  VitalSigns.prototype.calculateBMI = function() {
    if (this.height && this.weight) {
      const heightInMeters = this.height / 100;
      return parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
    }
    return null;
  };

  VitalSigns.prototype.getBloodPressureCategory = function() {
    if (!this.systolic_bp || !this.diastolic_bp) return null;
    
    if (this.systolic_bp < 120 && this.diastolic_bp < 80) return 'normal';
    if (this.systolic_bp < 130 && this.diastolic_bp < 80) return 'elevated';
    if (this.systolic_bp < 140 || this.diastolic_bp < 90) return 'stage_1_hypertension';
    if (this.systolic_bp >= 140 || this.diastolic_bp >= 90) return 'stage_2_hypertension';
    if (this.systolic_bp >= 180 || this.diastolic_bp >= 120) return 'hypertensive_crisis';
    
    return 'unknown';
  };

  VitalSigns.prototype.hasAbnormalValues = function() {
    const abnormal = [];
    
    // Check blood pressure
    if (this.systolic_bp && (this.systolic_bp < 90 || this.systolic_bp > 180)) {
      abnormal.push('systolic_bp');
    }
    if (this.diastolic_bp && (this.diastolic_bp < 60 || this.diastolic_bp > 120)) {
      abnormal.push('diastolic_bp');
    }
    
    // Check heart rate
    if (this.heart_rate && (this.heart_rate < 60 || this.heart_rate > 100)) {
      abnormal.push('heart_rate');
    }
    
    // Check temperature (Fahrenheit)
    if (this.temperature && (this.temperature < 97.0 || this.temperature > 99.5)) {
      abnormal.push('temperature');
    }
    
    // Check oxygen saturation
    if (this.oxygen_saturation && this.oxygen_saturation < 95) {
      abnormal.push('oxygen_saturation');
    }
    
    return abnormal;
  };

  // Class methods
  VitalSigns.findByEncounter = function(encounterId) {
    return this.findAll({
      where: { encounter_id: encounterId },
      order: [['measured_at', 'DESC']]
    });
  };

  VitalSigns.findLatestByPatient = function(patientId) {
    return this.findOne({
      include: [{
        model: sequelize.models.Encounter,
        as: 'encounter',
        where: { patient_id: patientId }
      }],
      order: [['measured_at', 'DESC']]
    });
  };

  return VitalSigns;
};
