/**
 * Mock Schedule Service
 * This module provides mock data for the Schedule Service
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Appointment,
  AppointmentFormData,
  AppointmentListResponse,
  AppointmentSearchParams,
  DoctorAvailability,
  AvailabilityFormData,
  TimeSlot,
  AppointmentStatus,
  AppointmentType
} from '../../types/schedule.types';

// Helper function to add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Helper function to format date as ISO string
const formatISO = (date: Date): string => {
  return date.toISOString();
};

// Current date
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// Mock doctor ID
const MOCK_DOCTOR_ID = 'doctor-123';

// Mock patient IDs
const MOCK_PATIENT_IDS = [
  'patient-1',
  'patient-2',
  'patient-3',
  'patient-4',
  'patient-5'
];

// Mock patient data
const MOCK_PATIENTS = [
  { id: 'patient-1', first_name: 'John', last_name: 'Doe', gender: 'male', date_of_birth: '1985-05-15' },
  { id: 'patient-2', first_name: 'Jane', last_name: 'Smith', gender: 'female', date_of_birth: '1990-08-22' },
  { id: 'patient-3', first_name: 'Robert', last_name: 'Johnson', gender: 'male', date_of_birth: '1978-11-30' },
  { id: 'patient-4', first_name: 'Emily', last_name: 'Williams', gender: 'female', date_of_birth: '1995-04-12' },
  { id: 'patient-5', first_name: 'Michael', last_name: 'Brown', gender: 'male', date_of_birth: '1982-07-08' }
];

// Mock appointment types
const APPOINTMENT_TYPES: AppointmentType[] = [
  'in_person',
  'telemedicine',
  'follow_up',
  'urgent',
  'routine'
];

// Mock appointment statuses
const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
];

// Generate mock appointments for the next 7 days
const generateMockAppointments = (): Appointment[] => {
  const appointments: Appointment[] = [];

  // Today's appointments
  appointments.push(
    {
      id: uuidv4(),
      doctor_id: MOCK_DOCTOR_ID,
      patient_id: MOCK_PATIENT_IDS[0],
      start_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0)),
      end_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30)),
      status: 'confirmed',
      appointment_type: 'follow_up',
      reason: 'Follow-up for hypertension',
      created_at: formatISO(addDays(today, -7)),
      updated_at: formatISO(addDays(today, -7)),
      patient: MOCK_PATIENTS[0]
    },
    {
      id: uuidv4(),
      doctor_id: MOCK_DOCTOR_ID,
      patient_id: MOCK_PATIENT_IDS[1],
      start_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0)),
      end_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30)),
      status: 'scheduled',
      appointment_type: 'in_person',
      reason: 'Annual check-up',
      created_at: formatISO(addDays(today, -5)),
      updated_at: formatISO(addDays(today, -5)),
      patient: MOCK_PATIENTS[1]
    },
    {
      id: uuidv4(),
      doctor_id: MOCK_DOCTOR_ID,
      patient_id: MOCK_PATIENT_IDS[2],
      start_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0)),
      end_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30)),
      status: 'checked_in',
      appointment_type: 'urgent',
      reason: 'Severe headache',
      created_at: formatISO(addDays(today, -1)),
      updated_at: formatISO(today),
      check_in_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 55)),
      patient: MOCK_PATIENTS[2]
    },
    {
      id: uuidv4(),
      doctor_id: MOCK_DOCTOR_ID,
      patient_id: MOCK_PATIENT_IDS[3],
      start_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0)),
      end_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30)),
      status: 'scheduled',
      appointment_type: 'telemedicine',
      reason: 'Medication review',
      created_at: formatISO(addDays(today, -3)),
      updated_at: formatISO(addDays(today, -3)),
      patient: MOCK_PATIENTS[3]
    },
    {
      id: uuidv4(),
      doctor_id: MOCK_DOCTOR_ID,
      patient_id: MOCK_PATIENT_IDS[4],
      start_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0)),
      end_time: formatISO(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30)),
      status: 'scheduled',
      appointment_type: 'routine',
      reason: 'Blood pressure check',
      created_at: formatISO(addDays(today, -2)),
      updated_at: formatISO(addDays(today, -2)),
      patient: MOCK_PATIENTS[4]
    }
  );

  // Generate appointments for the next 7 days
  for (let day = 1; day <= 7; day++) {
    const date = addDays(today, day);

    // Generate 3-5 appointments per day
    const numAppointments = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numAppointments; i++) {
      // Random hour between 9 and 16
      const hour = Math.floor(Math.random() * 8) + 9;

      // Random patient
      const patientIndex = Math.floor(Math.random() * MOCK_PATIENT_IDS.length);

      // Random appointment type
      const appointmentType = APPOINTMENT_TYPES[Math.floor(Math.random() * APPOINTMENT_TYPES.length)];

      // Random status (mostly scheduled for future appointments)
      const statusIndex = day === 1 ? Math.floor(Math.random() * 3) : 0; // Only scheduled or confirmed for future days
      const status = APPOINTMENT_STATUSES[statusIndex];

      appointments.push({
        id: uuidv4(),
        doctor_id: MOCK_DOCTOR_ID,
        patient_id: MOCK_PATIENT_IDS[patientIndex],
        start_time: formatISO(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0)),
        end_time: formatISO(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 30)),
        status: status,
        appointment_type: appointmentType,
        reason: `Appointment for ${appointmentType}`,
        created_at: formatISO(addDays(today, -Math.floor(Math.random() * 10))),
        updated_at: formatISO(addDays(today, -Math.floor(Math.random() * 5))),
        patient: MOCK_PATIENTS[patientIndex]
      });
    }
  }

  return appointments;
};

// Mock appointments
const mockAppointments = generateMockAppointments();

// Mock doctor availabilities
const mockAvailabilities: DoctorAvailability[] = [
  {
    id: uuidv4(),
    doctor_id: MOCK_DOCTOR_ID,
    day_of_week: 1, // Monday
    start_time: '09:00:00',
    end_time: '17:00:00',
    is_available: true,
    recurrence_type: 'weekly',
    created_at: formatISO(addDays(today, -30)),
    updated_at: formatISO(addDays(today, -30))
  },
  {
    id: uuidv4(),
    doctor_id: MOCK_DOCTOR_ID,
    day_of_week: 2, // Tuesday
    start_time: '09:00:00',
    end_time: '17:00:00',
    is_available: true,
    recurrence_type: 'weekly',
    created_at: formatISO(addDays(today, -30)),
    updated_at: formatISO(addDays(today, -30))
  },
  {
    id: uuidv4(),
    doctor_id: MOCK_DOCTOR_ID,
    day_of_week: 3, // Wednesday
    start_time: '09:00:00',
    end_time: '17:00:00',
    is_available: true,
    recurrence_type: 'weekly',
    created_at: formatISO(addDays(today, -30)),
    updated_at: formatISO(addDays(today, -30))
  },
  {
    id: uuidv4(),
    doctor_id: MOCK_DOCTOR_ID,
    day_of_week: 4, // Thursday
    start_time: '09:00:00',
    end_time: '17:00:00',
    is_available: true,
    recurrence_type: 'weekly',
    created_at: formatISO(addDays(today, -30)),
    updated_at: formatISO(addDays(today, -30))
  },
  {
    id: uuidv4(),
    doctor_id: MOCK_DOCTOR_ID,
    day_of_week: 5, // Friday
    start_time: '09:00:00',
    end_time: '17:00:00',
    is_available: true,
    recurrence_type: 'weekly',
    created_at: formatISO(addDays(today, -30)),
    updated_at: formatISO(addDays(today, -30))
  }
];

class MockScheduleService {
  /**
   * Get all appointments with pagination and filtering
   * @param params - Search parameters
   * @returns AppointmentListResponse
   */
  async getAllAppointments(params: AppointmentSearchParams = {}): Promise<AppointmentListResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const {
      page = 1,
      limit = 10,
      doctorId,
      patientId,
      status,
      type,
      startDate,
      endDate,
      sort = 'start_time',
      order = 'ASC'
    } = params;

    // Filter appointments
    let filteredAppointments = [...mockAppointments];

    if (doctorId) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.doctor_id === doctorId);
    }

    if (patientId) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.patient_id === patientId);
    }

    if (status) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.status === status);
    }

    if (type) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.appointment_type === type);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredAppointments = filteredAppointments.filter(appointment => new Date(appointment.start_time) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredAppointments = filteredAppointments.filter(appointment => new Date(appointment.start_time) <= end);
    }

    // Sort appointments
    filteredAppointments.sort((a, b) => {
      const aValue = a[sort as keyof Appointment];
      const bValue = b[sort as keyof Appointment];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'ASC'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

    return {
      appointments: paginatedAppointments,
      pagination: {
        total: filteredAppointments.length,
        page,
        limit,
        totalPages: Math.ceil(filteredAppointments.length / limit),
        hasNext: endIndex < filteredAppointments.length,
        hasPrev: page > 1
      }
    };
  }

  // Additional methods would be implemented here
  // For brevity, I'm only including the most important ones

  /**
   * Get appointments by date range
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param doctorId - Doctor ID (optional)
   * @returns Appointment[]
   */
  async getAppointmentsByDateRange(startDate: string, endDate: string, doctorId?: string): Promise<Appointment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const start = new Date(startDate);
    const end = new Date(endDate);

    let filteredAppointments = mockAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return appointmentDate >= start && appointmentDate <= end;
    });

    if (doctorId) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.doctor_id === doctorId);
    }

    return filteredAppointments;
  }

  /**
   * Get today's appointments
   * @param doctorId - Doctor ID (optional)
   * @returns Appointment[]
   */
  async getTodayAppointments(doctorId?: string): Promise<Appointment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    let filteredAppointments = mockAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return appointmentDate >= todayStart && appointmentDate <= todayEnd;
    });

    if (doctorId) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.doctor_id === doctorId);
    }

    return filteredAppointments;
  }

  /**
   * Get appointment by ID
   * @param id - Appointment ID
   * @returns Appointment
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const appointment = mockAppointments.find(appointment => appointment.id === id);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  /**
   * Create a new appointment
   * @param appointmentData - Appointment data
   * @returns Appointment
   */
  async createAppointment(appointmentData: AppointmentFormData): Promise<Appointment> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newAppointment: Appointment = {
      id: uuidv4(),
      doctor_id: appointmentData.doctor_id || MOCK_DOCTOR_ID,
      patient_id: appointmentData.patient_id,
      start_time: appointmentData.start_time,
      end_time: appointmentData.end_time,
      status: 'scheduled',
      appointment_type: appointmentData.appointment_type,
      reason: appointmentData.reason,
      notes: appointmentData.notes,
      created_at: formatISO(new Date()),
      updated_at: formatISO(new Date()),
      patient: MOCK_PATIENTS.find(p => p.id === appointmentData.patient_id) || MOCK_PATIENTS[0]
    };

    mockAppointments.push(newAppointment);
    return newAppointment;
  }

  /**
   * Update an existing appointment
   * @param id - Appointment ID
   * @param appointmentData - Appointment data
   * @returns Appointment
   */
  async updateAppointment(id: string, appointmentData: Partial<AppointmentFormData>): Promise<Appointment> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const appointmentIndex = mockAppointments.findIndex(appointment => appointment.id === id);

    if (appointmentIndex === -1) {
      throw new Error('Appointment not found');
    }

    const updatedAppointment = {
      ...mockAppointments[appointmentIndex],
      ...appointmentData,
      updated_at: formatISO(new Date())
    };

    mockAppointments[appointmentIndex] = updatedAppointment;
    return updatedAppointment;
  }
}

export default new MockScheduleService();
