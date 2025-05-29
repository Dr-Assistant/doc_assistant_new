/**
 * Patient Controller
 * This module handles HTTP requests for patient operations
 */

const { StatusCodes } = require('http-status-codes');
const patientService = require('../services/patient.service');
const { logger } = require('../utils/logger');

/**
 * Get all patients
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAllPatients = async (req, res, next) => {
  try {
    const { page, limit, status, search, sort, order } = req.query;
    
    const result = await patientService.getAllPatients({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      status,
      search,
      sort: sort || 'last_name',
      order: order || 'ASC'
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const patient = await patientService.getPatientById(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new patient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createPatient = async (req, res, next) => {
  try {
    const patientData = req.body;
    
    const patient = await patientService.createPatient(patientData);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientData = req.body;
    
    const patient = await patientService.updatePatient(id, patientData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete patient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await patientService.deletePatient(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'Patient deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient medical history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPatientMedicalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const medicalHistory = await patientService.getPatientMedicalHistory(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: medicalHistory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient medical history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updatePatientMedicalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const historyData = req.body;
    
    const medicalHistory = await patientService.updatePatientMedicalHistory(id, historyData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: medicalHistory
    });
  } catch (error) {
    next(error);
  }
};
