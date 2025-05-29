/**
 * Health Record Processing Log Model
 * Sequelize model for health_record_processing_log table
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HealthRecordProcessingLog = sequelize.define('HealthRecordProcessingLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fetchRequestId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'fetch_request_id'
    },
    healthRecordId: {
      type: DataTypes.UUID,
      field: 'health_record_id'
    },
    abdmRecordId: {
      type: DataTypes.STRING(100),
      field: 'abdm_record_id'
    },
    processingStage: {
      type: DataTypes.ENUM('FETCH', 'DECRYPT', 'PARSE', 'VALIDATE', 'STORE', 'INDEX'),
      allowNull: false,
      field: 'processing_stage'
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'SKIPPED', 'RETRY'),
      allowNull: false
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message'
    },
    processingTimeMs: {
      type: DataTypes.INTEGER,
      field: 'processing_time_ms'
    },
    details: {
      type: DataTypes.JSONB
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'health_record_processing_log',
    timestamps: false,
    indexes: [
      { fields: ['fetch_request_id'] },
      { fields: ['health_record_id'] },
      { fields: ['processing_stage'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  });

  // Class methods
  HealthRecordProcessingLog.logProcessing = function(data) {
    return this.create({
      fetchRequestId: data.fetchRequestId,
      healthRecordId: data.healthRecordId,
      abdmRecordId: data.abdmRecordId,
      processingStage: data.processingStage,
      status: data.status,
      errorMessage: data.errorMessage,
      processingTimeMs: data.processingTimeMs,
      details: data.details
    });
  };

  HealthRecordProcessingLog.getProcessingStats = function(fetchRequestId) {
    return this.findAll({
      attributes: [
        'processingStage',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('processing_time_ms')), 'avgProcessingTime']
      ],
      where: { fetchRequestId },
      group: ['processingStage', 'status'],
      order: [['processingStage', 'ASC']]
    });
  };

  HealthRecordProcessingLog.getFailedRecords = function(fetchRequestId) {
    return this.findAll({
      where: {
        fetchRequestId,
        status: 'FAILED'
      },
      order: [['created_at', 'DESC']]
    });
  };

  return HealthRecordProcessingLog;
};
