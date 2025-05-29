/**
 * Consent Artifact Model
 * Sequelize model for consent_artifacts table
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsentArtifact = sequelize.define('ConsentArtifact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    consentRequestId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'consent_request_id'
    },
    abdmArtifactId: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      field: 'abdm_artifact_id'
    },
    artifactData: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'artifact_data'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'REVOKED', 'EXPIRED'),
      defaultValue: 'ACTIVE',
      allowNull: false
    },
    grantedAt: {
      type: DataTypes.DATE,
      field: 'granted_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },
    revokedAt: {
      type: DataTypes.DATE,
      field: 'revoked_at'
    },
    revocationReason: {
      type: DataTypes.TEXT,
      field: 'revocation_reason'
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
    tableName: 'consent_artifacts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['consent_request_id'] },
      { fields: ['abdm_artifact_id'] },
      { fields: ['status'] },
      { fields: ['expires_at'] }
    ]
  });

  // Instance methods
  ConsentArtifact.prototype.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
  };

  ConsentArtifact.prototype.isActive = function() {
    return this.status === 'ACTIVE' && !this.isExpired();
  };

  ConsentArtifact.prototype.revoke = function(reason) {
    this.status = 'REVOKED';
    this.revokedAt = new Date();
    this.revocationReason = reason;
    return this.save();
  };

  // Class methods
  ConsentArtifact.findActiveByRequestId = function(consentRequestId) {
    return this.findAll({
      where: {
        consentRequestId,
        status: 'ACTIVE'
      }
    });
  };

  ConsentArtifact.findByAbdmArtifactId = function(abdmArtifactId) {
    return this.findOne({
      where: { abdmArtifactId }
    });
  };

  ConsentArtifact.findExpired = function() {
    return this.findAll({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    });
  };

  return ConsentArtifact;
};
