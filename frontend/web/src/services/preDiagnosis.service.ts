/**
 * Pre-Diagnosis Summary Service
 * This module provides methods for interacting with the Pre-Diagnosis Summary API
 */

import api from './api';
import {
  PreDiagnosisSummary,
  PreDiagnosisGenerateRequest,
  PreDiagnosisListResponse,
  PreDiagnosisStatistics,
  QuestionnaireData
} from '../types/patient.types';

// Pre-Diagnosis Summary API URL
const PRE_DIAGNOSIS_API_URL = 'http://localhost:9004/api/pre-diagnosis';

// Use mock service in development - Set to false to use real backend
const useMockService = process.env.REACT_APP_USE_MOCK_SERVICES === 'true' || false;

class PreDiagnosisService {
  /**
   * Generate a new pre-diagnosis summary
   * @param request - Generation request data
   * @returns PreDiagnosisSummary
   */
  async generateSummary(request: PreDiagnosisGenerateRequest): Promise<PreDiagnosisSummary> {
    if (useMockService) {
      return this.mockGenerateSummary(request);
    }

    try {
      const response = await api.post<{ success: boolean; data: PreDiagnosisSummary }>(
        `${PRE_DIAGNOSIS_API_URL}/generate`,
        request
      );

      return response.data.data;
    } catch (error) {
      console.error('Error generating pre-diagnosis summary:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get pre-diagnosis summary by ID
   * @param summaryId - Summary ID
   * @returns PreDiagnosisSummary
   */
  async getSummaryById(summaryId: string): Promise<PreDiagnosisSummary> {
    if (useMockService) {
      return this.mockGetSummaryById(summaryId);
    }

    try {
      const response = await api.get<{ success: boolean; data: PreDiagnosisSummary }>(
        `${PRE_DIAGNOSIS_API_URL}/${summaryId}`
      );

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching summary with ID ${summaryId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get summaries for a patient
   * @param patientId - Patient ID
   * @param options - Query options
   * @returns PreDiagnosisListResponse
   */
  async getSummariesByPatient(
    patientId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<PreDiagnosisListResponse> {
    if (useMockService) {
      return this.mockGetSummariesByPatient(patientId, options);
    }

    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      if (options.status) queryParams.append('status', options.status);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);

      const queryString = queryParams.toString();
      const url = queryString 
        ? `${PRE_DIAGNOSIS_API_URL}/patient/${patientId}?${queryString}`
        : `${PRE_DIAGNOSIS_API_URL}/patient/${patientId}`;

      const response = await api.get<{ success: boolean; data: PreDiagnosisSummary[]; pagination?: any }>(url);

      return {
        summaries: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error(`Error fetching summaries for patient ${patientId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get recent summaries for current user
   * @param limit - Number of summaries to fetch
   * @returns PreDiagnosisListResponse
   */
  async getRecentSummaries(limit: number = 10): Promise<PreDiagnosisListResponse> {
    if (useMockService) {
      return this.mockGetRecentSummaries(limit);
    }

    try {
      const response = await api.get<{ success: boolean; data: PreDiagnosisSummary[] }>(
        `${PRE_DIAGNOSIS_API_URL}/my/recent?limit=${limit}`
      );

      return {
        summaries: response.data.data
      };
    } catch (error) {
      console.error('Error fetching recent summaries:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get urgent summaries for current user
   * @param limit - Number of summaries to fetch
   * @returns PreDiagnosisListResponse
   */
  async getUrgentSummaries(limit: number = 20): Promise<PreDiagnosisListResponse> {
    if (useMockService) {
      return this.mockGetUrgentSummaries(limit);
    }

    try {
      const response = await api.get<{ success: boolean; data: PreDiagnosisSummary[] }>(
        `${PRE_DIAGNOSIS_API_URL}/urgent?limit=${limit}`
      );

      return {
        summaries: response.data.data
      };
    } catch (error) {
      console.error('Error fetching urgent summaries:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update summary status
   * @param summaryId - Summary ID
   * @param status - New status
   * @returns PreDiagnosisSummary
   */
  async updateSummaryStatus(
    summaryId: string,
    status: 'generating' | 'completed' | 'failed' | 'expired'
  ): Promise<PreDiagnosisSummary> {
    if (useMockService) {
      return this.mockUpdateSummaryStatus(summaryId, status);
    }

    try {
      const response = await api.patch<{ success: boolean; data: PreDiagnosisSummary }>(
        `${PRE_DIAGNOSIS_API_URL}/${summaryId}/status`,
        { status }
      );

      return response.data.data;
    } catch (error) {
      console.error(`Error updating summary status for ${summaryId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete summary
   * @param summaryId - Summary ID
   * @returns boolean
   */
  async deleteSummary(summaryId: string): Promise<boolean> {
    if (useMockService) {
      return this.mockDeleteSummary(summaryId);
    }

    try {
      const response = await api.delete<{ success: boolean }>(
        `${PRE_DIAGNOSIS_API_URL}/${summaryId}`
      );

      return response.data.success;
    } catch (error) {
      console.error(`Error deleting summary ${summaryId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get summary statistics for current user
   * @param startDate - Start date filter
   * @param endDate - End date filter
   * @returns PreDiagnosisStatistics
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<PreDiagnosisStatistics> {
    if (useMockService) {
      return this.mockGetStatistics();
    }

    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      // Note: This would need the current user's ID in a real implementation
      const userId = 'current-user-id'; // This should come from auth context
      const queryString = queryParams.toString();
      const url = queryString 
        ? `${PRE_DIAGNOSIS_API_URL}/stats/${userId}?${queryString}`
        : `${PRE_DIAGNOSIS_API_URL}/stats/${userId}`;

      const response = await api.get<{ success: boolean; data: PreDiagnosisStatistics }>(url);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
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
      const errorMessage = error.response.data?.message || 'An error occurred';
      return new Error(errorMessage);
    } else if (error.request) {
      return new Error('No response received from server');
    } else {
      return new Error('Error setting up request');
    }
  }

  // Mock methods for development
  private async mockGenerateSummary(request: PreDiagnosisGenerateRequest): Promise<PreDiagnosisSummary> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      id: 'mock-summary-' + Date.now(),
      patientId: request.patientId,
      encounterId: request.encounterId,
      doctorId: 'mock-doctor-id',
      appointmentId: request.appointmentId,
      status: 'completed',
      version: 1,
      priority: request.priority || 'medium',
      dataSources: {
        abdmRecords: { available: true, recordCount: 5 },
        localRecords: { available: true, recordCount: 3 },
        questionnaire: { completed: true, responseCount: 8 }
      },
      medicalHistory: [
        {
          name: 'Hypertension',
          diagnosedDate: '2020-01-01',
          status: 'active',
          notes: 'Well controlled with medication'
        }
      ],
      currentMedications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'daily',
          status: 'active',
          reason: 'Hypertension'
        }
      ],
      allergies: [
        {
          allergen: 'Penicillin',
          type: 'drug',
          severity: 'moderate',
          reaction: 'Rash'
        }
      ],
      questionnaireResponses: [
        {
          questionId: 'chief_complaint',
          question: 'What is your main concern today?',
          answer: request.questionnaireData?.chiefComplaint || 'Chest pain',
          category: 'symptoms',
          priority: 'high'
        }
      ],
      aiSummary: {
        keyFindings: [
          'Patient has well-controlled hypertension',
          'Reports new onset chest pain',
          'No acute distress noted'
        ],
        riskFactors: [
          'Age over 50',
          'History of hypertension',
          'Family history of cardiac disease'
        ],
        recommendations: [
          'Obtain ECG to rule out cardiac causes',
          'Monitor blood pressure',
          'Consider stress testing if symptoms persist'
        ],
        urgencyLevel: 'medium',
        confidenceScore: 0.85,
        generatedAt: new Date().toISOString(),
        model: 'gemini-1.5-pro',
        version: '1.0',
        processingTime: 2500
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'mock-doctor-id'
    };
  }

  private async mockGetSummaryById(summaryId: string): Promise<PreDiagnosisSummary> {
    const mockSummary = await this.mockGenerateSummary({ patientId: 'mock-patient-id' });
    return { ...mockSummary, id: summaryId };
  }

  private async mockGetSummariesByPatient(patientId: string, options: any): Promise<PreDiagnosisListResponse> {
    const mockSummary = await this.mockGenerateSummary({ patientId });
    return {
      summaries: [mockSummary],
      pagination: { limit: 10, offset: 0, total: 1 }
    };
  }

  private async mockGetRecentSummaries(limit: number): Promise<PreDiagnosisListResponse> {
    const mockSummary = await this.mockGenerateSummary({ patientId: 'mock-patient-id' });
    return { summaries: [mockSummary] };
  }

  private async mockGetUrgentSummaries(limit: number): Promise<PreDiagnosisListResponse> {
    const mockSummary = await this.mockGenerateSummary({ patientId: 'mock-patient-id' });
    mockSummary.aiSummary!.urgencyLevel = 'urgent';
    return { summaries: [mockSummary] };
  }

  private async mockUpdateSummaryStatus(summaryId: string, status: string): Promise<PreDiagnosisSummary> {
    const mockSummary = await this.mockGenerateSummary({ patientId: 'mock-patient-id' });
    return { ...mockSummary, id: summaryId, status: status as any };
  }

  private async mockDeleteSummary(summaryId: string): Promise<boolean> {
    return true;
  }

  private async mockGetStatistics(): Promise<PreDiagnosisStatistics> {
    return {
      totalSummaries: 25,
      completedSummaries: 23,
      failedSummaries: 2,
      urgentSummaries: 3,
      highPrioritySummaries: 8,
      avgConfidenceScore: 0.82,
      avgProcessingTime: 2800
    };
  }
}

export default new PreDiagnosisService();
