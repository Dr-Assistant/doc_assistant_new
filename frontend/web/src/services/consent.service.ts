/**
 * Consent Service
 * This module provides methods for interacting with the ABDM Consent API
 */

import api from './api';
import {
  ConsentRequestData,
  ConsentRequest,
  ConsentStatusResponse,
  ConsentListResponse,
  ConsentAuditResponse
} from '../types/consent.types';

// ABDM Integration Service URL
const ABDM_API_URL = 'http://localhost:8005/api/abdm';

class ConsentService {
  private baseUrl = `${ABDM_API_URL}/consent`;

  /**
   * Request consent from ABDM
   */
  async requestConsent(consentData: ConsentRequestData): Promise<{
    id: string;
    abdmRequestId: string;
    status: string;
    createdAt: string;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/request`, consentData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error requesting consent:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to request consent'
      );
    }
  }

  /**
   * Get consent status by consent request ID
   */
  async getConsentStatus(consentRequestId: string): Promise<ConsentStatusResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${consentRequestId}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting consent status:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to get consent status'
      );
    }
  }

  /**
   * List active consents for a patient
   */
  async getActiveConsents(patientId: string): Promise<ConsentListResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/active`, {
        params: { patientId }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error getting active consents:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to get active consents'
      );
    }
  }

  /**
   * List all consents for a doctor
   */
  async getConsentsByDoctor(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<ConsentListResponse> {
    try {
      const params: any = { page, limit };
      if (status) {
        params.status = status;
      }

      const response = await api.get(`${this.baseUrl}/doctor`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error getting consents by doctor:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to get consents'
      );
    }
  }

  /**
   * Revoke an existing consent
   */
  async revokeConsent(consentRequestId: string, reason: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/${consentRequestId}/revoke`, {
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Error revoking consent:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to revoke consent'
      );
    }
  }

  /**
   * Get consent audit trail
   */
  async getConsentAuditTrail(consentRequestId: string): Promise<ConsentAuditResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${consentRequestId}/audit`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting consent audit trail:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to get audit trail'
      );
    }
  }

  /**
   * Validate ABHA ID format
   */
  validateAbhaId(abhaId: string): boolean {
    // ABHA ID can be 14-digit number or username@abdm format
    const numericPattern = /^\d{14}$/;
    const usernamePattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    
    return numericPattern.test(abhaId) || usernamePattern.test(abhaId);
  }

  /**
   * Get default consent expiry date (30 days from now)
   */
  getDefaultExpiryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  }

  /**
   * Format consent status for display
   */
  formatConsentStatus(status: string): {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  } {
    switch (status) {
      case 'REQUESTED':
        return { label: 'Pending', color: 'warning' };
      case 'GRANTED':
        return { label: 'Granted', color: 'success' };
      case 'DENIED':
        return { label: 'Denied', color: 'error' };
      case 'EXPIRED':
        return { label: 'Expired', color: 'default' };
      case 'REVOKED':
        return { label: 'Revoked', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  }

  /**
   * Check if consent can be revoked
   */
  canRevokeConsent(status: string): boolean {
    return ['REQUESTED', 'GRANTED'].includes(status);
  }

  /**
   * Format health info types for display
   */
  formatHealthInfoTypes(hiTypes: string[]): string {
    const typeMap: { [key: string]: string } = {
      'DiagnosticReport': 'Diagnostic Reports',
      'Prescription': 'Prescriptions',
      'DischargeSummary': 'Discharge Summaries',
      'OPConsultation': 'OP Consultations',
      'ImmunizationRecord': 'Immunization Records',
      'HealthDocumentRecord': 'Health Documents',
      'WellnessRecord': 'Wellness Records'
    };

    return hiTypes.map(type => typeMap[type] || type).join(', ');
  }
}

const consentService = new ConsentService();
export default consentService;
