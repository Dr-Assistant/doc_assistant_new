/**
 * Patient Service
 * This module provides business logic for patient operations
 */

const patientRepository = require('../repositories/patient.repository');
const medicalHistoryRepository = require('../repositories/medical.history.repository');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Get all patients
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Patients with pagination
 */
exports.getAllPatients = async (options = {}) => {
  try {
    return await patientRepository.findAll(options);
  } catch (error) {
    logger.error('Error getting all patients', {
      error: error.message,
      stack: error.stack,
      options
    });
    throw error;
  }
};

/**
 * Get patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Patient
 */
exports.getPatientById = async (id) => {
  try {
    const patient = await patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    return patient;
  } catch (error) {
    logger.error('Error getting patient by ID', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Create a new patient
 * @param {Object} patientData - Patient data
 * @returns {Promise<Object>} Created patient
 */
exports.createPatient = async (patientData) => {
  try {
    // Check if patient already exists with same MRN or ABHA ID
    if (patientData.mrn) {
      const existingMrn = await patientRepository.findByField('mrn', patientData.mrn);
      if (existingMrn) {
        throw new ConflictError('Patient with this MRN already exists');
      }
    }

    if (patientData.abha_id) {
      const existingAbha = await patientRepository.findByField('abha_id', patientData.abha_id);
      if (existingAbha) {
        throw new ConflictError('Patient with this ABHA ID already exists');
      }
    }

    // Create patient
    const patient = await patientRepository.create(patientData);

    // Create empty medical history if not provided
    if (patientData.medicalHistory) {
      await medicalHistoryRepository.createOrUpdate(patient.id, patientData.medicalHistory);
    } else {
      await medicalHistoryRepository.createOrUpdate(patient.id, {});
    }

    return patient;
  } catch (error) {
    logger.error('Error creating patient', {
      error: error.message,
      stack: error.stack,
      patientData
    });
    throw error;
  }
};

/**
 * Update patient
 * @param {string} id - Patient ID
 * @param {Object} patientData - Patient data
 * @returns {Promise<Object>} Updated patient
 */
exports.updatePatient = async (id, patientData) => {
  try {
    // Check if patient exists
    const patient = await patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    // Check for unique constraints
    if (patientData.mrn && patientData.mrn !== patient.mrn) {
      const existingMrn = await patientRepository.findByField('mrn', patientData.mrn);
      if (existingMrn) {
        throw new ConflictError('Patient with this MRN already exists');
      }
    }

    if (patientData.abha_id && patientData.abha_id !== patient.abha_id) {
      const existingAbha = await patientRepository.findByField('abha_id', patientData.abha_id);
      if (existingAbha) {
        throw new ConflictError('Patient with this ABHA ID already exists');
      }
    }

    // Extract medical history data if provided
    const { medicalHistory, ...patientDataOnly } = patientData;

    // Update patient
    const updatedPatient = await patientRepository.update(id, patientDataOnly);

    // Update medical history if provided
    if (medicalHistory) {
      await medicalHistoryRepository.createOrUpdate(id, medicalHistory);
    }

    return updatedPatient;
  } catch (error) {
    logger.error('Error updating patient', {
      error: error.message,
      stack: error.stack,
      id,
      patientData
    });
    throw error;
  }
};

/**
 * Delete patient
 * @param {string} id - Patient ID
 * @returns {Promise<boolean>} Success flag
 */
exports.deletePatient = async (id) => {
  try {
    // Check if patient exists
    const patient = await patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    // Delete patient
    const result = await patientRepository.delete(id);

    // Delete medical history
    await medicalHistoryRepository.delete(id);

    return result;
  } catch (error) {
    logger.error('Error deleting patient', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Get patient medical history
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Medical history
 */
exports.getPatientMedicalHistory = async (id) => {
  try {
    // Check if patient exists
    const patient = await patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    // Get medical history
    const medicalHistory = await medicalHistoryRepository.findByPatientId(id);

    if (!medicalHistory) {
      // Create empty medical history if not found
      return await medicalHistoryRepository.createOrUpdate(id, {});
    }

    return medicalHistory;
  } catch (error) {
    logger.error('Error getting patient medical history', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Update patient medical history
 * @param {string} id - Patient ID
 * @param {Object} historyData - Medical history data
 * @returns {Promise<Object>} Updated medical history
 */
exports.updatePatientMedicalHistory = async (id, historyData) => {
  try {
    // Check if patient exists
    const patient = await patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    // Update medical history
    return await medicalHistoryRepository.createOrUpdate(id, historyData);
  } catch (error) {
    logger.error('Error updating patient medical history', {
      error: error.message,
      stack: error.stack,
      id,
      historyData
    });
    throw error;
  }
};
