/**
 * Search Routes
 * This module defines the routes for advanced search operations
 */

const express = require('express');
const { query } = require('express-validator');
const searchService = require('../services/search.service');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Search patients
router.get(
  '/patients',
  [
    query('query').optional().isString(),
    query('ageRange.min').optional().isInt({ min: 0 }),
    query('ageRange.max').optional().isInt({ min: 0 }),
    query('gender').optional().isIn(['male', 'female', 'other']),
    query('bloodGroup').optional().isString(),
    query('status').optional().isIn(['active', 'inactive', 'deceased']),
    query('hasChronicCondition').optional().isBoolean(),
    query('hasAllergy').optional().isBoolean(),
    query('lastVisitDate').optional().isISO8601(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  authenticate,
  async (req, res) => {
    const filters = {
      query: req.query.query,
      ageRange: req.query.ageRange ? {
        min: parseInt(req.query.ageRange.min),
        max: parseInt(req.query.ageRange.max)
      } : undefined,
      gender: req.query.gender,
      bloodGroup: req.query.bloodGroup,
      status: req.query.status,
      hasChronicCondition: req.query.hasChronicCondition === 'true',
      hasAllergy: req.query.hasAllergy === 'true',
      lastVisitDate: req.query.lastVisitDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const results = await searchService.searchPatients(filters);
    res.json(results);
  }
);

// Search medical history
router.get(
  '/medical-history',
  [
    query('patientId').optional().isUUID(),
    query('condition').optional().isString(),
    query('medication').optional().isString(),
    query('dateRange.start').optional().isISO8601(),
    query('dateRange.end').optional().isISO8601(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  async (req, res) => {
    const filters = {
      patientId: req.query.patientId,
      condition: req.query.condition,
      medication: req.query.medication,
      dateRange: req.query.dateRange ? {
        start: req.query.dateRange.start,
        end: req.query.dateRange.end
      } : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const results = await searchService.searchMedicalHistory(filters);
    res.json(results);
  }
);

module.exports = router; 