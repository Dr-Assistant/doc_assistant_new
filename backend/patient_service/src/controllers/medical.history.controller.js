/**
 * Medical History Controller
 * Handles medical history operations with versioning support
 */

const { MedicalHistory } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { validateMedicalHistory } = require('../utils/validators');

class MedicalHistoryController {
  /**
   * Get patient's medical history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMedicalHistory(req, res) {
    const { id } = req.params;
    const { version } = req.query;

    const query = {
      where: { patient_id: id }
    };

    if (version) {
      query.where.version = version;
    } else {
      // Get latest version
      const latestVersion = await MedicalHistory.max('version', {
        where: { patient_id: id }
      });
      query.where.version = latestVersion;
    }

    const medicalHistory = await MedicalHistory.findOne(query);

    if (!medicalHistory) {
      throw new NotFoundError('Medical history not found');
    }

    res.json(medicalHistory);
  }

  /**
   * Get medical history versions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMedicalHistoryVersions(req, res) {
    const { id } = req.params;

    const versions = await MedicalHistory.findAll({
      where: { patient_id: id },
      attributes: ['version', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      order: [['version', 'DESC']]
    });

    res.json(versions);
  }

  /**
   * Create new medical history version
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createMedicalHistory(req, res) {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user.id;

    // Validate medical history data
    const validationError = validateMedicalHistory(data);
    if (validationError) {
      throw new ValidationError(validationError);
    }

    // Get latest version
    const latestVersion = await MedicalHistory.max('version', {
      where: { patient_id: id }
    });

    // Create new version
    const medicalHistory = await MedicalHistory.create({
      ...data,
      patient_id: id,
      version: (latestVersion || 0) + 1,
      created_by: userId,
      updated_by: userId
    });

    res.status(201).json(medicalHistory);
  }

  /**
   * Update medical history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateMedicalHistory(req, res) {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user.id;

    // Validate medical history data
    const validationError = validateMedicalHistory(data);
    if (validationError) {
      throw new ValidationError(validationError);
    }

    // Get latest version
    const latestVersion = await MedicalHistory.max('version', {
      where: { patient_id: id }
    });

    if (!latestVersion) {
      throw new NotFoundError('Medical history not found');
    }

    // Create new version with updates
    const medicalHistory = await MedicalHistory.create({
      ...data,
      patient_id: id,
      version: latestVersion + 1,
      created_by: userId,
      updated_by: userId
    });

    res.json(medicalHistory);
  }

  /**
   * Get medical history by version
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMedicalHistoryByVersion(req, res) {
    const { id, version } = req.params;

    const medicalHistory = await MedicalHistory.findOne({
      where: {
        patient_id: id,
        version: version
      }
    });

    if (!medicalHistory) {
      throw new NotFoundError('Medical history version not found');
    }

    res.json(medicalHistory);
  }

  /**
   * Compare medical history versions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async compareVersions(req, res) {
    const { id } = req.params;
    const { version1, version2 } = req.query;

    if (!version1 || !version2) {
      throw new ValidationError('Both version1 and version2 are required');
    }

    const [history1, history2] = await Promise.all([
      MedicalHistory.findOne({
        where: { patient_id: id, version: version1 }
      }),
      MedicalHistory.findOne({
        where: { patient_id: id, version: version2 }
      })
    ]);

    if (!history1 || !history2) {
      throw new NotFoundError('One or both versions not found');
    }

    // Compare versions and return differences
    const differences = this._compareHistoryVersions(history1, history2);

    res.json({
      version1: history1.version,
      version2: history2.version,
      differences
    });
  }

  /**
   * Compare two versions of medical history
   * @private
   */
  _compareHistoryVersions(version1, version2) {
    const differences = {};

    // Compare each field
    Object.keys(version1.toJSON()).forEach(key => {
      if (key === 'version' || key === 'created_at' || key === 'updated_at') {
        return;
      }

      if (JSON.stringify(version1[key]) !== JSON.stringify(version2[key])) {
        differences[key] = {
          from: version1[key],
          to: version2[key]
        };
      }
    });

    return differences;
  }
}

module.exports = new MedicalHistoryController(); 