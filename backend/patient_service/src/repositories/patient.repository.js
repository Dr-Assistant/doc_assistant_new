/**
 * Patient Repository
 * This module provides data access methods for the Patient model
 */

const { Op } = require('sequelize');
const { Patient } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Find all patients with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Patients with pagination metadata
 */
exports.findAll = async (options = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    status = null, 
    search = null,
    sort = 'last_name',
    order = 'ASC'
  } = options;
  
  // Build where clause
  const where = {};
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
      { mrn: { [Op.iLike]: `%${search}%` } },
      { abha_id: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  // Calculate pagination
  const offset = (page - 1) * limit;
  
  try {
    // Get patients
    const { count, rows } = await Patient.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sort, order]]
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return {
      patients: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  } catch (error) {
    logger.error('Error finding patients', { 
      error: error.message, 
      stack: error.stack,
      options
    });
    throw error;
  }
};

/**
 * Find a patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Patient
 */
exports.findById = async (id) => {
  try {
    return await Patient.findByPk(id);
  } catch (error) {
    logger.error('Error finding patient by ID', { 
      error: error.message, 
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Find a patient by a specific field
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @returns {Promise<Object>} Patient
 */
exports.findByField = async (field, value) => {
  try {
    return await Patient.findOne({
      where: { [field]: value }
    });
  } catch (error) {
    logger.error('Error finding patient by field', { 
      error: error.message, 
      stack: error.stack,
      field,
      value
    });
    throw error;
  }
};

/**
 * Create a new patient
 * @param {Object} patientData - Patient data
 * @returns {Promise<Object>} Created patient
 */
exports.create = async (patientData) => {
  try {
    return await Patient.create(patientData);
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
 * Update a patient
 * @param {string} id - Patient ID
 * @param {Object} patientData - Patient data
 * @returns {Promise<Object>} Updated patient
 */
exports.update = async (id, patientData) => {
  try {
    const patient = await Patient.findByPk(id);
    
    if (!patient) {
      return null;
    }
    
    await patient.update(patientData);
    
    return patient;
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
 * Delete a patient
 * @param {string} id - Patient ID
 * @returns {Promise<boolean>} Success flag
 */
exports.delete = async (id) => {
  try {
    const patient = await Patient.findByPk(id);
    
    if (!patient) {
      return false;
    }
    
    await patient.destroy();
    
    return true;
  } catch (error) {
    logger.error('Error deleting patient', { 
      error: error.message, 
      stack: error.stack,
      id
    });
    throw error;
  }
};
