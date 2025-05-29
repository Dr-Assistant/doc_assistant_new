/**
 * Doctor Availability Model
 * This module defines the Doctor Availability model using Sequelize
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorAvailability = sequelize.define('DoctorAvailability', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0, // Sunday
        max: 6  // Saturday
      }
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        isAfterStartTime(value) {
          if (value <= this.start_time) {
            throw new Error('End time must be after start time');
          }
        }
      }
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    recurrence_type: {
      type: DataTypes.ENUM('weekly', 'biweekly', 'monthly', 'custom'),
      defaultValue: 'weekly',
      allowNull: false
    },
    recurrence_end_date: {
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
    tableName: 'doctor_availability',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_availability_doctor',
        fields: ['doctor_id']
      },
      {
        name: 'idx_availability_day',
        fields: ['day_of_week']
      },
      {
        name: 'idx_availability_status',
        fields: ['is_available']
      }
    ]
  });

  // Instance methods
  DoctorAvailability.prototype.getDuration = function() {
    const start = new Date(`1970-01-01T${this.start_time}`);
    const end = new Date(`1970-01-01T${this.end_time}`);
    return (end - start) / (1000 * 60); // Duration in minutes
  };

  // Class methods
  DoctorAvailability.findByDoctorAndDay = function(doctorId, dayOfWeek) {
    return this.findAll({
      where: {
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_available: true
      },
      order: [['start_time', 'ASC']]
    });
  };

  return DoctorAvailability;
};
