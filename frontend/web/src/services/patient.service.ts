/**
 * Patient Service
 * This module provides methods for interacting with the Patient API
 */

import api from './api';
import mockPatientService from './mock/mockPatientService';
import {
  Patient,
  PatientFormData,
  PatientListResponse,
  PatientSearchParams,
  MedicalHistory
} from '../types/patient.types';

// Update the base URL to point to the patient service
const PATIENT_API_URL = 'http://localhost:8017/api/patients';

// Use mock service in development - Set to false to use real backend
const useMockService = process.env.REACT_APP_USE_MOCK_SERVICES === 'true' || false;

class PatientService {
  /**
   * Get all patients with pagination and filtering
   * @param params - Search parameters
   * @returns PatientListResponse
   */
  async getAllPatients(params: PatientSearchParams = {}): Promise<PatientListResponse> {
    if (useMockService) {
      return mockPatientService.getAllPatients(params);
    }

    try {
      // Build query string from params
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.order) queryParams.append('order', params.order);

      const queryString = queryParams.toString();
      const url = queryString ? `${PATIENT_API_URL}?${queryString}` : PATIENT_API_URL;

      const response = await api.get<{ success: boolean; data: PatientListResponse }>(url);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get patient by ID
   * @param id - Patient ID
   * @returns Patient
   */
  async getPatientById(id: string): Promise<Patient> {
    if (useMockService) {
      return mockPatientService.getPatientById(id);
    }

    try {
      const response = await api.get<{ success: boolean; data: Patient }>(`${PATIENT_API_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching patient with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new patient
   * @param patientData - Patient data
   * @returns Patient
   */
  async createPatient(patientData: PatientFormData): Promise<Patient> {
    if (useMockService) {
      return mockPatientService.createPatient(patientData);
    }

    try {
      const response = await api.post<{ success: boolean; data: Patient }>(
        PATIENT_API_URL,
        patientData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing patient
   * @param id - Patient ID
   * @param patientData - Patient data
   * @returns Patient
   */
  async updatePatient(id: string, patientData: Partial<PatientFormData>): Promise<Patient> {
    if (useMockService) {
      return mockPatientService.updatePatient(id, patientData);
    }

    try {
      const response = await api.put<{ success: boolean; data: Patient }>(
        `${PATIENT_API_URL}/${id}`,
        patientData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating patient with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a patient
   * @param id - Patient ID
   * @returns boolean
   */
  async deletePatient(id: string): Promise<boolean> {
    if (useMockService) {
      return mockPatientService.deletePatient(id);
    }

    try {
      const response = await api.delete<{ success: boolean }>(`${PATIENT_API_URL}/${id}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting patient with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get patient medical history
   * @param id - Patient ID
   * @returns MedicalHistory
   */
  async getPatientMedicalHistory(id: string): Promise<MedicalHistory> {
    if (useMockService) {
      return mockPatientService.getPatientMedicalHistory(id);
    }

    try {
      const response = await api.get<{ success: boolean; data: MedicalHistory }>(
        `${PATIENT_API_URL}/${id}/medical-history`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching medical history for patient with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Update patient medical history
   * @param id - Patient ID
   * @param medicalHistory - Medical history data
   * @returns MedicalHistory
   */
  async updatePatientMedicalHistory(
    id: string,
    medicalHistory: Partial<MedicalHistory>
  ): Promise<MedicalHistory> {
    if (useMockService) {
      return mockPatientService.updatePatientMedicalHistory(id, medicalHistory);
    }

    try {
      const response = await api.put<{ success: boolean; data: MedicalHistory }>(
        `${PATIENT_API_URL}/${id}/medical-history`,
        medicalHistory
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating medical history for patient with ID ${id}:`, error);
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

export default new PatientService();
