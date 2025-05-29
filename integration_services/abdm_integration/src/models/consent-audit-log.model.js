/**
 * Consent Audit Log Model
 * Sequelize model for consent_audit_log table
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsentAuditLog = sequelize.define('ConsentAuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    consentRequestId: {
      type: DataTypes.UUID,
      field: 'consent_request_id'
    },
    consentArtifactId: {
      type: DataTypes.UUID,
      field: 'consent_artifact_id'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    actorId: {
      type: DataTypes.UUID,
      field: 'actor_id'
    },
    actorType: {
      type: DataTypes.ENUM('doctor', 'patient', 'system', 'abdm'),
      allowNull: false,
      field: 'actor_type'
    },
    details: {
      type: DataTypes.JSONB
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'consent_audit_log',
    timestamps: false,
    indexes: [
      { fields: ['consent_request_id'] },
      { fields: ['consent_artifact_id'] },
      { fields: ['actor_id'] },
      { fields: ['created_at'] }
    ]
  });

  // Class methods
  ConsentAuditLog.logAction = function(data) {
    return this.create({
      consentRequestId: data.consentRequestId,
      consentArtifactId: data.consentArtifactId,
      action: data.action,
      actorId: data.actorId,
      actorType: data.actorType,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
  };

  ConsentAuditLog.getAuditTrail = function(consentRequestId) {
    return this.findAll({
      where: { consentRequestId },
      order: [['created_at', 'ASC']]
    });
  };

  return ConsentAuditLog;
};
