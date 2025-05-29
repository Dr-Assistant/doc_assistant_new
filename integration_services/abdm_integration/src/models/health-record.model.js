/**
 * Health Record Model
 * Sequelize model for health_records table
 */

const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const HealthRecord = sequelize.define('HealthRecord', {
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
    fetchRequestId: {
      type: DataTypes.UUID,
      field: 'fetch_request_id'
    },
    abdmRecordId: {
      type: DataTypes.STRING(100),
      field: 'abdm_record_id'
    },
    recordType: {
      type: DataTypes.ENUM(
        'DiagnosticReport', 'Prescription', 'DischargeSummary', 'OPConsultation',
        'ImmunizationRecord', 'HealthDocumentRecord', 'WellnessRecord',
        'Observation', 'Condition', 'Procedure', 'MedicationRequest', 'AllergyIntolerance'
      ),
      allowNull: false,
      field: 'record_type'
    },
    recordDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'record_date'
    },
    providerId: {
      type: DataTypes.STRING(100),
      field: 'provider_id'
    },
    providerName: {
      type: DataTypes.STRING(255),
      field: 'provider_name'
    },
    providerType: {
      type: DataTypes.STRING(50),
      field: 'provider_type'
    },
    fhirResource: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'fhir_resource'
    },
    source: {
      type: DataTypes.ENUM('ABDM', 'LOCAL', 'IMPORTED'),
      defaultValue: 'ABDM',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'ARCHIVED', 'DELETED'),
      defaultValue: 'ACTIVE',
      allowNull: false
    },
    encryptionKeyId: {
      type: DataTypes.STRING(100),
      field: 'encryption_key_id'
    },
    checksum: {
      type: DataTypes.STRING(64),
      field: 'checksum'
    },
    fetchedAt: {
      type: DataTypes.DATE,
      field: 'fetched_at'
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
    tableName: 'health_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['fetch_request_id'] },
      { fields: ['record_type'] },
      { fields: ['record_date'] },
      { fields: ['source'] },
      { fields: ['status'] },
      { fields: ['provider_id'] },
      { fields: ['abdm_record_id'] }
    ],
    hooks: {
      beforeCreate: (record) => {
        // Generate checksum for data integrity
        if (record.fhirResource) {
          record.checksum = crypto
            .createHash('sha256')
            .update(JSON.stringify(record.fhirResource))
            .digest('hex');
        }
        
        // Set fetched timestamp for ABDM records
        if (record.source === 'ABDM' && !record.fetchedAt) {
          record.fetchedAt = new Date();
        }
      },
      beforeUpdate: (record) => {
        // Update checksum if FHIR resource changed
        if (record.changed('fhirResource')) {
          record.checksum = crypto
            .createHash('sha256')
            .update(JSON.stringify(record.fhirResource))
            .digest('hex');
        }
      }
    }
  });

  // Instance methods
  HealthRecord.prototype.isActive = function() {
    return this.status === 'ACTIVE';
  };

  HealthRecord.prototype.verifyIntegrity = function() {
    if (!this.fhirResource || !this.checksum) {
      return false;
    }
    
    const currentChecksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(this.fhirResource))
      .digest('hex');
    
    return currentChecksum === this.checksum;
  };

  HealthRecord.prototype.getDisplayInfo = function() {
    const resource = this.fhirResource;
    
    return {
      id: this.id,
      type: this.recordType,
      date: this.recordDate,
      provider: {
        id: this.providerId,
        name: this.providerName,
        type: this.providerType
      },
      title: this.extractTitle(resource),
      summary: this.extractSummary(resource),
      source: this.source,
      fetchedAt: this.fetchedAt
    };
  };

  HealthRecord.prototype.extractTitle = function(resource) {
    switch (this.recordType) {
      case 'DiagnosticReport':
        return resource.code?.text || resource.code?.coding?.[0]?.display || 'Diagnostic Report';
      case 'Prescription':
      case 'MedicationRequest':
        return resource.medicationCodeableConcept?.text || 'Prescription';
      case 'Observation':
        return resource.code?.text || resource.code?.coding?.[0]?.display || 'Observation';
      case 'Condition':
        return resource.code?.text || resource.code?.coding?.[0]?.display || 'Condition';
      case 'Procedure':
        return resource.code?.text || resource.code?.coding?.[0]?.display || 'Procedure';
      default:
        return this.recordType;
    }
  };

  HealthRecord.prototype.extractSummary = function(resource) {
    switch (this.recordType) {
      case 'DiagnosticReport':
        return resource.conclusion || resource.presentedForm?.[0]?.title || 'Diagnostic report';
      case 'Observation':
        return `${resource.valueQuantity?.value || ''} ${resource.valueQuantity?.unit || ''}`.trim() || 
               resource.valueString || 'Observation result';
      case 'Condition':
        return resource.clinicalStatus?.coding?.[0]?.display || 'Medical condition';
      default:
        return `${this.recordType} from ${this.providerName || 'Healthcare Provider'}`;
    }
  };

  // Class methods
  HealthRecord.findByPatient = function(patientId, options = {}) {
    const where = {
      patientId,
      status: 'ACTIVE'
    };
    
    if (options.recordType) {
      where.recordType = options.recordType;
    }
    
    if (options.source) {
      where.source = options.source;
    }
    
    if (options.dateFrom || options.dateTo) {
      where.recordDate = {};
      if (options.dateFrom) {
        where.recordDate[sequelize.Sequelize.Op.gte] = options.dateFrom;
      }
      if (options.dateTo) {
        where.recordDate[sequelize.Sequelize.Op.lte] = options.dateTo;
      }
    }
    
    return this.findAll({
      where,
      order: [['record_date', 'DESC'], ['created_at', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  HealthRecord.findByAbdmRecordId = function(abdmRecordId) {
    return this.findOne({
      where: { abdmRecordId }
    });
  };

  HealthRecord.getRecordTypes = function(patientId) {
    return this.findAll({
      attributes: [
        'recordType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        patientId,
        status: 'ACTIVE'
      },
      group: ['recordType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
  };

  return HealthRecord;
};
