/**
 * Validators for request data
 */

const { body } = require('express-validator');

/**
 * Validate medical history data
 * @param {Object} data - Medical history data to validate
 * @returns {string|null} Error message if validation fails, null otherwise
 */
const validateMedicalHistory = (data) => {
  // Validate chronic conditions
  if (data.chronic_conditions && !Array.isArray(data.chronic_conditions)) {
    return 'Chronic conditions must be an array';
  }

  // Validate family history
  if (data.family_history && typeof data.family_history !== 'object') {
    return 'Family history must be an object';
  }

  // Validate surgical history
  if (data.surgical_history && !Array.isArray(data.surgical_history)) {
    return 'Surgical history must be an array';
  }

  // Validate medication history
  if (data.medication_history && !Array.isArray(data.medication_history)) {
    return 'Medication history must be an array';
  }

  // Validate immunization history
  if (data.immunization_history && !Array.isArray(data.immunization_history)) {
    return 'Immunization history must be an array';
  }

  // Validate allergies
  if (data.allergies && !Array.isArray(data.allergies)) {
    return 'Allergies must be an array';
  }

  // Validate social history
  if (data.social_history && typeof data.social_history !== 'object') {
    return 'Social history must be an object';
  }

  // Validate lifestyle factors
  if (data.lifestyle_factors && typeof data.lifestyle_factors !== 'object') {
    return 'Lifestyle factors must be an object';
  }

  // Validate vital signs history
  if (data.vital_signs_history && !Array.isArray(data.vital_signs_history)) {
    return 'Vital signs history must be an array';
  }

  // Validate lab results
  if (data.lab_results && !Array.isArray(data.lab_results)) {
    return 'Lab results must be an array';
  }

  // Validate imaging studies
  if (data.imaging_studies && !Array.isArray(data.imaging_studies)) {
    return 'Imaging studies must be an array';
  }

  return null;
};

/**
 * Patient validation rules
 */
const patientValidationRules = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('date_of_birth').isDate().withMessage('Date of birth must be a valid date'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('mrn').optional().isString().withMessage('MRN must be a string'),
  body('abha_id').optional().isString().withMessage('ABHA ID must be a string'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('emergency_contact').optional().isObject().withMessage('Emergency contact must be an object'),
  body('blood_group').optional().isString().withMessage('Blood group must be a string'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('status').optional().isIn(['active', 'inactive', 'deceased']).withMessage('Status must be active, inactive, or deceased')
];

module.exports = {
  validateMedicalHistory,
  patientValidationRules
}; 