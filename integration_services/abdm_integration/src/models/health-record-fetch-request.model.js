/**
 * Health Record Fetch Request Model
 * Sequelize model for health_record_fetch_requests table
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HealthRecordFetchRequest = sequelize.define('HealthRecordFetchRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    consentArtifactId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'consent_artifact_id'
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
    hiTypes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      field: 'hi_types'
    },
    dateRangeFrom: {
      type: DataTypes.DATEONLY,
      field: 'date_range_from'
    },
    dateRangeTo: {
      type: DataTypes.DATEONLY,
      field: 'date_range_to'
    },
    status: {
      type: DataTypes.ENUM('PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'),
      defaultValue: 'PROCESSING',
      allowNull: false
    },
    totalRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_records'
    },
    completedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'completed_records'
    },
    failedRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_records'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message'
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
    tableName: 'health_record_fetch_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['consent_artifact_id'] },
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['status'] },
      { fields: ['abdm_request_id'] },
      { fields: ['created_at'] }
    ]
  });

  // Instance methods
  HealthRecordFetchRequest.prototype.isCompleted = function() {
    return ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'].includes(this.status);
  };

  HealthRecordFetchRequest.prototype.getProgress = function() {
    return {
      total: this.totalRecords,
      completed: this.completedRecords,
      failed: this.failedRecords,
      percentage: this.totalRecords > 0 ? 
        Math.round((this.completedRecords / this.totalRecords) * 100) : 0
    };
  };

  HealthRecordFetchRequest.prototype.updateProgress = function(completed, failed, total = null) {
    const updates = {
      completedRecords: completed,
      failedRecords: failed
    };
    
    if (total !== null) {
      updates.totalRecords = total;
    }
    
    // Update status based on progress
    if (completed + failed >= this.totalRecords && this.totalRecords > 0) {
      if (failed === 0) {
        updates.status = 'COMPLETED';
      } else if (completed > 0) {
        updates.status = 'PARTIAL';
      } else {
        updates.status = 'FAILED';
      }
    }
    
    return this.update(updates);
  };

  // Class methods
  HealthRecordFetchRequest.findByAbdmRequestId = function(abdmRequestId) {
    return this.findOne({
      where: { abdmRequestId }
    });
  };

  HealthRecordFetchRequest.findActiveByPatient = function(patientId) {
    return this.findAll({
      where: {
        patientId,
        status: ['PROCESSING']
      },
      order: [['created_at', 'DESC']]
    });
  };

  HealthRecordFetchRequest.findByConsentArtifact = function(consentArtifactId) {
    return this.findAll({
      where: { consentArtifactId },
      order: [['created_at', 'DESC']]
    });
  };

  return HealthRecordFetchRequest;
};
