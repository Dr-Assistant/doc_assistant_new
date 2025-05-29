/**
 * Appointment Model
 * This module defines the Appointment model using Sequelize
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStartTime(value) {
          if (new Date(value) <= new Date(this.start_time)) {
            throw new Error('End time must be after start time');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'),
      defaultValue: 'scheduled',
      allowNull: false
    },
    appointment_type: {
      type: DataTypes.ENUM('in_person', 'telemedicine', 'follow_up', 'urgent', 'routine'),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    },
    check_in_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    check_out_time: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'appointments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_appointments_doctor',
        fields: ['doctor_id']
      },
      {
        name: 'idx_appointments_patient',
        fields: ['patient_id']
      },
      {
        name: 'idx_appointments_time',
        fields: ['start_time', 'end_time']
      },
      {
        name: 'idx_appointments_status',
        fields: ['status']
      },
      {
        name: 'idx_appointments_type',
        fields: ['appointment_type']
      },
      {
        name: 'idx_appointments_start_time',
        fields: ['start_time']
      }
    ]
  });

  // Instance methods
  Appointment.prototype.getDuration = function() {
    const start = new Date(this.start_time);
    const end = new Date(this.end_time);
    return (end - start) / (1000 * 60); // Duration in minutes
  };

  // Check if appointment can be cancelled
  Appointment.prototype.canCancel = function() {
    return ['scheduled', 'confirmed'].includes(this.status);
  };

  // Check if appointment can be checked in
  Appointment.prototype.canCheckIn = function() {
    return ['scheduled', 'confirmed'].includes(this.status);
  };

  // Check if appointment is active
  Appointment.prototype.isActive = function() {
    return ['scheduled', 'confirmed', 'checked_in', 'in_progress'].includes(this.status);
  };

  return Appointment;
};
