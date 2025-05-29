/**
 * Appointment Service
 * This module provides business logic for appointment operations
 */

const appointmentRepository = require('../repositories/appointment.repository');
const { NotFoundError, ConflictError, ScheduleConflictError, BadRequestError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const axios = require('axios');
const moment = require('moment');

/**
 * Get all appointments
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Appointments with pagination
 */
exports.getAllAppointments = async (options = {}, authToken = null) => {
  try {
    const result = await appointmentRepository.findAll(options);

    // Enrich appointments with patient information
    const enrichedAppointments = await enrichAppointmentsWithPatientInfo(result.appointments, authToken);

    return {
      ...result,
      appointments: enrichedAppointments
    };
  } catch (error) {
    logger.error('Error getting all appointments', {
      error: error.message,
      stack: error.stack,
      options
    });
    throw error;
  }
};

/**
 * Get appointments by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Appointments
 */
exports.getAppointmentsByDateRange = async (startDate, endDate, options = {}, authToken = null) => {
  try {
    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestError('Start date must be before end date');
    }

    const appointments = await appointmentRepository.findByDateRange(startDate, endDate, options);

    // Enrich appointments with patient information
    return await enrichAppointmentsWithPatientInfo(appointments, authToken);
  } catch (error) {
    logger.error('Error getting appointments by date range', {
      error: error.message,
      stack: error.stack,
      startDate,
      endDate,
      options
    });
    throw error;
  }
};

/**
 * Get today's appointments
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Today's appointments
 */
exports.getTodayAppointments = async (options = {}, authToken = null) => {
  try {
    const appointments = await appointmentRepository.findToday(options);

    // Enrich appointments with patient information
    return await enrichAppointmentsWithPatientInfo(appointments, authToken);
  } catch (error) {
    logger.error('Error getting today\'s appointments', {
      error: error.message,
      stack: error.stack,
      options
    });
    throw error;
  }
};

/**
 * Get appointment by ID
 * @param {string} id - Appointment ID
 * @returns {Promise<Object>} Appointment
 */
exports.getAppointmentById = async (id) => {
  try {
    const appointment = await appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    return appointment;
  } catch (error) {
    logger.error('Error getting appointment by ID', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Create a new appointment
 * @param {Object} appointmentData - Appointment data
 * @param {string} authToken - Authorization token
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created appointment
 */
exports.createAppointment = async (appointmentData, authToken, currentUser) => {
  try {
    // Validate doctor and patient existence
    await validateDoctorAndPatient(appointmentData.doctor_id, appointmentData.patient_id, authToken, currentUser);

    // Check for conflicts
    const conflicts = await appointmentRepository.checkConflicts(
      appointmentData.start_time,
      appointmentData.end_time,
      appointmentData.doctor_id
    );

    if (conflicts && conflicts.length > 0) {
      throw new ScheduleConflictError('Schedule conflict detected', conflicts);
    }

    // Create appointment
    const appointment = await appointmentRepository.create(appointmentData);

    // Enrich with patient information
    const enrichedAppointments = await enrichAppointmentsWithPatientInfo([appointment], authToken);
    return enrichedAppointments[0];
  } catch (error) {
    logger.error('Error creating appointment', {
      error: error.message,
      stack: error.stack,
      appointmentData
    });
    throw error;
  }
};

/**
 * Update appointment
 * @param {string} id - Appointment ID
 * @param {Object} appointmentData - Appointment data
 * @param {string} authToken - Authorization token
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated appointment
 */
exports.updateAppointment = async (id, appointmentData, authToken, currentUser) => {
  try {
    // Check if appointment exists
    const appointment = await appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Check if user can edit this appointment
    if (appointment.doctor_id !== currentUser.id && !['admin'].includes(currentUser.role)) {
      throw new BadRequestError('You can only edit your own appointments');
    }

    // If updating doctor or patient, validate their existence
    if (appointmentData.doctor_id || appointmentData.patient_id) {
      await validateDoctorAndPatient(
        appointmentData.doctor_id || appointment.doctor_id,
        appointmentData.patient_id || appointment.patient_id,
        authToken,
        currentUser
      );
    }

    // If updating time, check for conflicts
    if (appointmentData.start_time || appointmentData.end_time) {
      const startTime = appointmentData.start_time || appointment.start_time;
      const endTime = appointmentData.end_time || appointment.end_time;
      const doctorId = appointmentData.doctor_id || appointment.doctor_id;

      const conflicts = await appointmentRepository.checkConflicts(startTime, endTime, doctorId, id);

      if (conflicts && conflicts.length > 0) {
        throw new ScheduleConflictError('Schedule conflict detected', conflicts);
      }
    }

    // Update appointment
    const updatedAppointment = await appointmentRepository.update(id, appointmentData);

    return updatedAppointment;
  } catch (error) {
    logger.error('Error updating appointment', {
      error: error.message,
      stack: error.stack,
      id,
      appointmentData
    });
    throw error;
  }
};

/**
 * Delete appointment
 * @param {string} id - Appointment ID
 * @returns {Promise<boolean>} Success flag
 */
exports.deleteAppointment = async (id) => {
  try {
    // Check if appointment exists
    const appointment = await appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Delete appointment
    return await appointmentRepository.delete(id);
  } catch (error) {
    logger.error('Error deleting appointment', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Update appointment status
 * @param {string} id - Appointment ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated appointment
 */
exports.updateAppointmentStatus = async (id, status) => {
  try {
    // Check if appointment exists
    const appointment = await appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Validate status transition
    validateStatusTransition(appointment.status, status);

    // Update status
    const updatedAppointment = await appointmentRepository.update(id, {
      status,
      ...(status === 'checked_in' && { check_in_time: new Date() }),
      ...(status === 'completed' && { check_out_time: new Date() })
    });

    return updatedAppointment;
  } catch (error) {
    logger.error('Error updating appointment status', {
      error: error.message,
      stack: error.stack,
      id,
      status
    });
    throw error;
  }
};

/**
 * Validate doctor and patient existence
 * @param {string} doctorId - Doctor ID
 * @param {string} patientId - Patient ID
 * @param {string} authToken - Authorization token
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<void>}
 */
async function validateDoctorAndPatient(doctorId, patientId, authToken, currentUser) {
  try {
    // Validate doctor - check if the doctor ID matches the authenticated user
    // or if the user has admin permissions to create appointments for other doctors
    if (doctorId !== currentUser.id && !['admin'].includes(currentUser.role)) {
      throw new BadRequestError('You can only create appointments for yourself');
    }

    // Validate patient existence
    const patientResponse = await axios.get(
      `${process.env.PATIENT_SERVICE_URL}/api/patients/${patientId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (!patientResponse.data.success) {
      throw new BadRequestError('Patient not found');
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new BadRequestError('Patient not found');
      }
      if (error.response.status === 403) {
        throw new BadRequestError('Access denied to patient information');
      }
    }
    throw error;
  }
}

/**
 * Validate appointment status transition
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status
 * @returns {void}
 */
function validateStatusTransition(currentStatus, newStatus) {
  // Define valid status transitions
  const validTransitions = {
    'scheduled': ['confirmed', 'cancelled', 'no_show'],
    'confirmed': ['checked_in', 'cancelled', 'no_show'],
    'checked_in': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': [],
    'no_show': []
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new BadRequestError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
}

/**
 * Enrich appointments with patient information
 * @param {Array} appointments - Array of appointments
 * @param {string} authToken - Authorization token (optional)
 * @returns {Promise<Array>} Appointments with patient information
 */
async function enrichAppointmentsWithPatientInfo(appointments, authToken = null) {
  if (!appointments || appointments.length === 0) {
    return appointments;
  }

  try {
    // Get unique patient IDs
    const patientIds = [...new Set(appointments.map(apt => apt.patient_id))];

    // Fetch patient information for all unique patient IDs
    const patientPromises = patientIds.map(async (patientId) => {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };

        // Add authorization header if token is provided
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await axios.get(
          `${process.env.PATIENT_SERVICE_URL}/api/patients/${patientId}`,
          { headers }
        );

        if (response.data.success) {
          return { id: patientId, ...response.data.data };
        }
        return { id: patientId, first_name: 'Unknown', last_name: 'Patient' };
      } catch (error) {
        logger.warn('Failed to fetch patient information', { patientId, error: error.message });
        return { id: patientId, first_name: 'Unknown', last_name: 'Patient' };
      }
    });

    const patients = await Promise.all(patientPromises);
    const patientMap = patients.reduce((map, patient) => {
      map[patient.id] = patient;
      return map;
    }, {});

    // Enrich appointments with patient information
    return appointments.map(appointment => ({
      ...appointment.toJSON ? appointment.toJSON() : appointment,
      patient: patientMap[appointment.patient_id] || {
        id: appointment.patient_id,
        first_name: 'Unknown',
        last_name: 'Patient'
      }
    }));
  } catch (error) {
    logger.error('Error enriching appointments with patient info', {
      error: error.message,
      stack: error.stack
    });

    // Return appointments with default patient info if enrichment fails
    return appointments.map(appointment => ({
      ...appointment.toJSON ? appointment.toJSON() : appointment,
      patient: {
        id: appointment.patient_id,
        first_name: 'Unknown',
        last_name: 'Patient'
      }
    }));
  }
}
