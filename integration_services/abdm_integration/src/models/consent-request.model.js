/**
 * Consent Request Model
 * Sequelize model for consent_requests table
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsentRequest = sequelize.define('ConsentRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'patient_id'
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'doctor_id'
    },
    abdmRequestId: {
      type: DataTypes.STRING(100),
      unique: true,
      field: 'abdm_request_id'
    },
    purposeCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'purpose_code'
    },
    purposeText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'purpose_text'
    },
    hiTypes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      field: 'hi_types'
    },
    dateRangeFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_range_from'
    },
    dateRangeTo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_range_to'
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull: false
    },
    hips: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      field: 'hips'
    },
    status: {
      type: DataTypes.ENUM('REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED'),
      defaultValue: 'REQUESTED',
      allowNull: false
    },
    callbackUrl: {
      type: DataTypes.STRING(255),
      field: 'callback_url'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'consent_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['status'] },
      { fields: ['abdm_request_id'] },
      { fields: ['created_at'] }
    ]
  });

  // Instance methods
  ConsentRequest.prototype.isExpired = function() {
    return new Date() > this.expiry;
  };

  ConsentRequest.prototype.canBeRevoked = function() {
    return ['REQUESTED', 'GRANTED'].includes(this.status);
  };

  // Class methods
  ConsentRequest.findActiveByPatient = function(patientId) {
    return this.findAll({
      where: {
        patientId,
        status: ['REQUESTED', 'GRANTED']
      },
      order: [['created_at', 'DESC']]
    });
  };

  ConsentRequest.findByAbdmRequestId = function(abdmRequestId) {
    return this.findOne({
      where: { abdmRequestId }
    });
  };

  return ConsentRequest;
};
