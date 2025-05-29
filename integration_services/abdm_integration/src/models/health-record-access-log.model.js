/**
 * Health Record Access Log Model
 * Sequelize model for health_record_access_log table
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HealthRecordAccessLog = sequelize.define('HealthRecordAccessLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    healthRecordId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'health_record_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    accessType: {
      type: DataTypes.ENUM('VIEW', 'DOWNLOAD', 'PRINT', 'SHARE', 'EXPORT'),
      allowNull: false,
      field: 'access_type'
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
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
    tableName: 'health_record_access_log',
    timestamps: false,
    indexes: [
      { fields: ['health_record_id'] },
      { fields: ['user_id'] },
      { fields: ['access_type'] },
      { fields: ['created_at'] }
    ]
  });

  // Class methods
  HealthRecordAccessLog.logAccess = function(data) {
    return this.create({
      healthRecordId: data.healthRecordId,
      userId: data.userId,
      accessType: data.accessType,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details
    });
  };

  HealthRecordAccessLog.getAccessHistory = function(healthRecordId) {
    return this.findAll({
      where: { healthRecordId },
      order: [['created_at', 'DESC']],
      limit: 100
    });
  };

  HealthRecordAccessLog.getUserAccessStats = function(userId, dateFrom, dateTo) {
    const where = { userId };
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt[sequelize.Sequelize.Op.gte] = dateFrom;
      }
      if (dateTo) {
        where.createdAt[sequelize.Sequelize.Op.lte] = dateTo;
      }
    }
    
    return this.findAll({
      attributes: [
        'accessType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['accessType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
  };

  return HealthRecordAccessLog;
};
