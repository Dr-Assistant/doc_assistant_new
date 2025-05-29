/**
 * Patient Types
 * This module defines TypeScript interfaces for patient data
 */

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Patient {
  id: string;
  mrn?: string;
  abha_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  address?: Address;
  emergency_contact?: EmergencyContact;
  blood_group?: string;
  allergies?: string[];
  status: 'active' | 'inactive' | 'deceased';
  created_at: string;
  updated_at: string;
}

export interface MedicalCondition {
  name: string;
  diagnosedDate?: string;
  status: 'active' | 'resolved' | 'in_remission' | 'unknown';
  notes?: string;
}

export interface Surgery {
  name: string;
  date?: string;
  hospital?: string;
  surgeon?: string;
  notes?: string;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'discontinued' | 'completed';
  reason?: string;
  prescribedBy?: string;
}

export interface FamilyHistory {
  relationship: string;
  condition: string;
  notes?: string;
}

export interface SocialHistory {
  smoking: {
    status: 'never' | 'former' | 'current' | 'unknown';
    packsPerDay?: number;
    yearsSmoked?: number;
    quitDate?: string;
  };
  alcohol: {
    status: 'none' | 'occasional' | 'moderate' | 'heavy' | 'unknown';
    drinksPerWeek?: number;
    notes?: string;
  };
  exercise: {
    frequency: 'none' | 'occasional' | 'moderate' | 'regular' | 'unknown';
    type?: string;
    notes?: string;
  };
  occupation?: string;
  diet?: string;
}

export interface Immunization {
  name: string;
  date?: string;
  expirationDate?: string;
  notes?: string;
}

export interface MedicalHistory {
  patientId: string;
  conditions?: MedicalCondition[];
  surgeries?: Surgery[];
  medications?: Medication[];
  familyHistory?: FamilyHistory[];
  socialHistory?: SocialHistory;
  immunizations?: Immunization[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  mrn?: string;
  abha_id?: string;
  phone?: string;
  email?: string;
  address?: Address;
  emergency_contact?: EmergencyContact;
  blood_group?: string;
  allergies?: string[];
  status: 'active' | 'inactive' | 'deceased';
}

export interface PatientSearchParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'deceased';
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}
