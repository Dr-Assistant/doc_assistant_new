/**
 * Patient Model
 * This module defines the Patient model using Sequelize
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mrn: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
      comment: 'Medical Record Number'
    },
    abha_id: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
      comment: 'Ayushman Bharat Health Account ID'
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    emergency_contact: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    blood_group: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    allergies: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'deceased'),
      defaultValue: 'active',
      allowNull: false
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
    tableName: 'patients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_patients_name',
        fields: ['last_name', 'first_name']
      },
      {
        name: 'idx_patients_dob',
        fields: ['date_of_birth']
      },
      {
        name: 'idx_patients_abha',
        fields: ['abha_id'],
        where: {
          abha_id: {
            [Op.ne]: null
          }
        }
      },
      {
        name: 'idx_patients_mrn',
        fields: ['mrn'],
        where: {
          mrn: {
            [Op.ne]: null
          }
        }
      },
      {
        name: 'idx_patients_status',
        fields: ['status']
      }
    ]
  });

  // Instance methods
  Patient.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  // Calculate age from date of birth
  Patient.prototype.getAge = function() {
    const today = new Date();
    const birthDate = new Date(this.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  return Patient;
};
