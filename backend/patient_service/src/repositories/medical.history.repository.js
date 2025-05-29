/**
 * Medical History Repository
 * This module provides data access methods for the Medical History model
 */

const { MedicalHistory } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Find medical history by patient ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Medical history
 */
exports.findByPatientId = async (patientId) => {
  try {
    return await MedicalHistory.findOne({ patientId });
  } catch (error) {
    logger.error('Error finding medical history by patient ID', { 
      error: error.message, 
      stack: error.stack,
      patientId
    });
    throw error;
  }
};

/**
 * Create or update medical history
 * @param {string} patientId - Patient ID
 * @param {Object} historyData - Medical history data
 * @returns {Promise<Object>} Created or updated medical history
 */
exports.createOrUpdate = async (patientId, historyData) => {
  try {
    // Find existing medical history or create new one
    const medicalHistory = await MedicalHistory.findOneAndUpdate(
      { patientId },
      { ...historyData, patientId },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    return medicalHistory;
  } catch (error) {
    logger.error('Error creating or updating medical history', { 
      error: error.message, 
      stack: error.stack,
      patientId,
      historyData
    });
    throw error;
  }
};

/**
 * Add a condition to medical history
 * @param {string} patientId - Patient ID
 * @param {Object} condition - Condition data
 * @returns {Promise<Object>} Updated medical history
 */
exports.addCondition = async (patientId, condition) => {
  try {
    const medicalHistory = await MedicalHistory.findOneAndUpdate(
      { patientId },
      { 
        $push: { conditions: condition },
        $setOnInsert: { patientId }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    return medicalHistory;
  } catch (error) {
    logger.error('Error adding condition to medical history', { 
      error: error.message, 
      stack: error.stack,
      patientId,
      condition
    });
    throw error;
  }
};

/**
 * Add a medication to medical history
 * @param {string} patientId - Patient ID
 * @param {Object} medication - Medication data
 * @returns {Promise<Object>} Updated medical history
 */
exports.addMedication = async (patientId, medication) => {
  try {
    const medicalHistory = await MedicalHistory.findOneAndUpdate(
      { patientId },
      { 
        $push: { medications: medication },
        $setOnInsert: { patientId }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    return medicalHistory;
  } catch (error) {
    logger.error('Error adding medication to medical history', { 
      error: error.message, 
      stack: error.stack,
      patientId,
      medication
    });
    throw error;
  }
};

/**
 * Delete medical history
 * @param {string} patientId - Patient ID
 * @returns {Promise<boolean>} Success flag
 */
exports.delete = async (patientId) => {
  try {
    const result = await MedicalHistory.deleteOne({ patientId });
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting medical history', { 
      error: error.message, 
      stack: error.stack,
      patientId
    });
    throw error;
  }
};
