/**
 * Consent Types
 * TypeScript type definitions for ABDM consent management
 */

export interface ConsentPurpose {
  code: string;
  text: string;
}

export interface ConsentDateRange {
  from: string; // ISO date string
  to: string;   // ISO date string
}

export interface ConsentRequestData {
  patientId: string;
  patientAbhaId: string;
  purpose: ConsentPurpose;
  hiTypes: string[];
  dateRange: ConsentDateRange;
  expiry: string; // ISO date string
  hips?: string[];
}

export interface ConsentRequest {
  id: string;
  patientId: string;
  doctorId: string;
  abdmRequestId?: string;
  purposeCode: string;
  purposeText: string;
  hiTypes: string[];
  dateRangeFrom: string;
  dateRangeTo: string;
  expiry: string;
  hips?: string[];
  status: ConsentStatus;
  callbackUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentArtifact {
  id: string;
  consentRequestId: string;
  abdmArtifactId: string;
  artifactData: any;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ConsentStatus = 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'REVOKED';

export interface ConsentStatusResponse {
  status: ConsentStatus;
  consentArtefact?: {
    id: string;
    details: any;
  };
  message: string;
}

export interface ConsentListResponse {
  consents: ConsentRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface ConsentAuditEntry {
  id: string;
  consentRequestId: string;
  action: string;
  actorId?: string;
  actorType: 'doctor' | 'patient' | 'abdm' | 'system';
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ConsentAuditResponse {
  auditTrail: ConsentAuditEntry[];
  total: number;
}

// Health Information Types supported by ABDM
export const HEALTH_INFO_TYPES = [
  'DiagnosticReport',
  'Prescription',
  'DischargeSummary',
  'OPConsultation',
  'ImmunizationRecord',
  'HealthDocumentRecord',
  'WellnessRecord'
] as const;

export type HealthInfoType = typeof HEALTH_INFO_TYPES[number];

// Common consent purposes
export const CONSENT_PURPOSES = [
  {
    code: 'CAREMGT',
    text: 'Care Management'
  },
  {
    code: 'BTG',
    text: 'Break the Glass'
  },
  {
    code: 'PUBHLTH',
    text: 'Public Health'
  },
  {
    code: 'HRESCH',
    text: 'Healthcare Research'
  },
  {
    code: 'PATRQT',
    text: 'Patient Requested'
  }
] as const;

// Form validation interfaces
export interface ConsentFormErrors {
  patientAbhaId?: string;
  purpose?: string;
  hiTypes?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  expiry?: string;
  general?: string;
}

export interface ConsentFormState {
  data: Partial<ConsentRequestData>;
  errors: ConsentFormErrors;
  loading: boolean;
  submitted: boolean;
}
