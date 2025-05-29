/**
 * Schedule Service
 * This module provides methods for interacting with the Schedule API
 */

import axios from 'axios';
import mockScheduleService from './mock/mockScheduleService';
import {
  Appointment,
  AppointmentFormData,
  AppointmentListResponse,
  AppointmentSearchParams,
  DoctorAvailability,
  AvailabilityFormData,
  TimeSlot
} from '../types/schedule.types';

// Create a separate API instance for schedule service
const scheduleApi = axios.create({
  baseURL: 'http://localhost:8014/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to schedule API requests
scheduleApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!token) {
      // If no token is available, reject the request
      return Promise.reject(new Error('No authentication token available'));
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling auth errors
scheduleApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - token might be expired
      console.warn('Schedule API: Authentication failed, token might be expired');
      // Don't redirect here, let the component handle it
    }
    return Promise.reject(error);
  }
);

// Use mock service in development - Set to false to use real backend
const useMockService = process.env.REACT_APP_USE_MOCK_SERVICES === 'true' || false;

// Debug logging
console.log('🔧 Schedule Service Configuration:', {
  REACT_APP_USE_MOCK_SERVICES: process.env.REACT_APP_USE_MOCK_SERVICES,
  useMockService: useMockService,
  scheduleApiBaseURL: 'http://localhost:8014/api'
});

class ScheduleService {
  /**
   * Check if user is authenticated
   * @returns boolean
   */
  private isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Wait for authentication token to be available
   * @param maxWaitTime - Maximum time to wait in milliseconds
   * @returns Promise<boolean>
   */
  private async waitForAuth(maxWaitTime: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      if (this.isAuthenticated()) {
        return true;
      }
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * Get all appointments with pagination and filtering
   * @param params - Search parameters
   * @returns AppointmentListResponse
   */
  async getAllAppointments(params: AppointmentSearchParams = {}): Promise<AppointmentListResponse> {
    if (useMockService) {
      return mockScheduleService.getAllAppointments(params);
    }

    // Wait for authentication before making the request
    const isAuth = await this.waitForAuth();
    if (!isAuth) {
      throw new Error('Authentication required. Please log in to view appointments.');
    }

    try {
      // Build query string from params
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.doctorId) queryParams.append('doctorId', params.doctorId);
      if (params.patientId) queryParams.append('patientId', params.patientId);
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.order) queryParams.append('order', params.order);

      const queryString = queryParams.toString();
      const url = queryString ? `/appointments?${queryString}` : `/appointments`;

      const response = await scheduleApi.get<{ success: boolean; data: AppointmentListResponse }>(url);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get appointments by date range
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param doctorId - Doctor ID (optional)
   * @returns Appointment[]
   */
  async getAppointmentsByDateRange(startDate: string, endDate: string, doctorId?: string): Promise<Appointment[]> {
    console.log('📅 getAppointmentsByDateRange called:', { startDate, endDate, doctorId, useMockService });

    if (useMockService) {
      console.log('🎭 Using mock service for appointments');
      return mockScheduleService.getAppointmentsByDateRange(startDate, endDate, doctorId);
    }

    console.log('🌐 Using real API for appointments');

    // Wait for authentication before making the request
    const isAuth = await this.waitForAuth();
    if (!isAuth) {
      throw new Error('Authentication required. Please log in to view appointments.');
    }

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      if (doctorId) queryParams.append('doctorId', doctorId);

      const url = `/appointments/date-range?${queryParams.toString()}`;

      const response = await scheduleApi.get<{ success: boolean; data: Appointment[] }>(url);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching appointments by date range:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get today's appointments
   * @param doctorId - Doctor ID (optional)
   * @returns Appointment[]
   */
  async getTodayAppointments(doctorId?: string): Promise<Appointment[]> {
    if (useMockService) {
      return mockScheduleService.getTodayAppointments(doctorId);
    }

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (doctorId) queryParams.append('doctorId', doctorId);

      const url = `/appointments/today?${queryParams.toString()}`;

      const response = await scheduleApi.get<{ success: boolean; data: Appointment[] }>(url);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get appointment by ID
   * @param id - Appointment ID
   * @returns Appointment
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    if (useMockService) {
      return mockScheduleService.getAppointmentById(id);
    }

    try {
      const response = await scheduleApi.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching appointment with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new appointment
   * @param appointmentData - Appointment data
   * @returns Appointment
   */
  async createAppointment(appointmentData: AppointmentFormData): Promise<Appointment> {
    if (useMockService) {
      return mockScheduleService.createAppointment(appointmentData);
    }

    try {
      const response = await scheduleApi.post<{ success: boolean; data: Appointment }>(
        `/appointments`,
        appointmentData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing appointment
   * @param id - Appointment ID
   * @param appointmentData - Appointment data
   * @returns Appointment
   */
  async updateAppointment(id: string, appointmentData: Partial<AppointmentFormData>): Promise<Appointment> {
    if (useMockService) {
      return mockScheduleService.updateAppointment(id, appointmentData);
    }

    try {
      const response = await scheduleApi.put<{ success: boolean; data: Appointment }>(
        `/appointments/${id}`,
        appointmentData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating appointment with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Update appointment status
   * @param id - Appointment ID
   * @param status - New status
   * @returns Appointment
   */
  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    try {
      const response = await scheduleApi.patch<{ success: boolean; data: Appointment }>(
        `/appointments/${id}/status`,
        { status }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating status for appointment with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete an appointment
   * @param id - Appointment ID
   * @returns boolean
   */
  async deleteAppointment(id: string): Promise<boolean> {
    try {
      const response = await scheduleApi.delete<{ success: boolean }>(`/appointments/${id}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting appointment with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all availabilities for a doctor
   * @param doctorId - Doctor ID
   * @returns DoctorAvailability[]
   */
  async getDoctorAvailabilities(doctorId: string): Promise<DoctorAvailability[]> {
    try {
      const response = await scheduleApi.get<{ success: boolean; data: DoctorAvailability[] }>(
        `/availability/doctor/${doctorId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching availabilities for doctor with ID ${doctorId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get availability by ID
   * @param id - Availability ID
   * @returns DoctorAvailability
   */
  async getAvailabilityById(id: string): Promise<DoctorAvailability> {
    try {
      const response = await scheduleApi.get<{ success: boolean; data: DoctorAvailability }>(
        `/availability/${id}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching availability with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   * @param doctorId - Doctor ID
   * @param date - Date (ISO string)
   * @param duration - Duration in minutes (optional)
   * @returns TimeSlot[]
   */
  async getAvailableTimeSlots(doctorId: string, date: string, duration?: number): Promise<TimeSlot[]> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('date', date);
      if (duration) queryParams.append('duration', duration.toString());

      const url = `/availability/doctor/${doctorId}/time-slots?${queryParams.toString()}`;

      const response = await scheduleApi.get<{ success: boolean; data: TimeSlot[] }>(url);

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching time slots for doctor with ID ${doctorId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new availability
   * @param availabilityData - Availability data
   * @returns DoctorAvailability
   */
  async createAvailability(availabilityData: AvailabilityFormData): Promise<DoctorAvailability> {
    try {
      const response = await scheduleApi.post<{ success: boolean; data: DoctorAvailability }>(
        `/availability`,
        availabilityData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating availability:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing availability
   * @param id - Availability ID
   * @param availabilityData - Availability data
   * @returns DoctorAvailability
   */
  async updateAvailability(id: string, availabilityData: Partial<AvailabilityFormData>): Promise<DoctorAvailability> {
    try {
      const response = await scheduleApi.put<{ success: boolean; data: DoctorAvailability }>(
        `/availability/${id}`,
        availabilityData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating availability with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete an availability
   * @param id - Availability ID
   * @returns boolean
   */
  async deleteAvailability(id: string): Promise<boolean> {
    try {
      const response = await scheduleApi.delete<{ success: boolean }>(`/availability/${id}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting availability with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param error - Error object
   * @returns Error
   */
  private handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.error?.message || 'An error occurred';
      return new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error('Error setting up request');
    }
  }
}

export default new ScheduleService();
