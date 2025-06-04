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

// Pre-Diagnosis Summary Types
export interface VitalSigns {
  bloodPressure?: {
    systolic?: number;
    diastolic?: number;
    unit: string;
  };
  heartRate?: {
    value?: number;
    unit: string;
  };
  temperature?: {
    value?: number;
    unit: string;
  };
  respiratoryRate?: {
    value?: number;
    unit: string;
  };
  oxygenSaturation?: {
    value?: number;
    unit: string;
  };
  weight?: {
    value?: number;
    unit: string;
  };
  height?: {
    value?: number;
    unit: string;
  };
  bmi?: number;
  recordedDate?: string;
  source?: string;
}

export interface QuestionnaireResponse {
  questionId: string;
  question: string;
  answer: any;
  category: 'symptoms' | 'history' | 'lifestyle' | 'family_history' | 'social_history';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AISummary {
  keyFindings: string[];
  riskFactors: string[];
  recommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  confidenceScore: number;
  generatedAt: string;
  model: string;
  version: string;
  processingTime?: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface DataSources {
  abdmRecords: {
    available: boolean;
    lastFetched?: string;
    recordCount: number;
    errors?: string[];
  };
  localRecords: {
    available: boolean;
    lastUpdated?: string;
    recordCount: number;
  };
  questionnaire: {
    completed: boolean;
    completedAt?: string;
    responseCount: number;
  };
}

export interface PreDiagnosisSummary {
  id: string;
  patientId: string;
  encounterId?: string;
  doctorId: string;
  appointmentId?: string;
  status: 'generating' | 'completed' | 'failed' | 'expired';
  version: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dataSources: DataSources;
  medicalHistory: MedicalCondition[];
  currentMedications: Medication[];
  allergies: Allergy[];
  vitalSigns?: VitalSigns;
  questionnaireResponses: QuestionnaireResponse[];
  aiSummary?: AISummary;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  lastViewedAt?: string;
}

export interface Allergy {
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reaction?: string;
  notes?: string;
  source?: string;
}

export interface QuestionnaireData {
  chiefComplaint?: string;
  duration?: string;
  severity?: string;
  associatedSymptoms?: string;
  pastMedicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  smokingStatus?: string;
  familyHistory?: string;
  [key: string]: any;
}

export interface PreDiagnosisGenerateRequest {
  patientId: string;
  encounterId?: string;
  appointmentId?: string;
  questionnaireData?: QuestionnaireData;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PreDiagnosisListResponse {
  summaries: PreDiagnosisSummary[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface PreDiagnosisStatistics {
  totalSummaries: number;
  completedSummaries: number;
  failedSummaries: number;
  urgentSummaries: number;
  highPrioritySummaries: number;
  avgConfidenceScore: number;
  avgProcessingTime: number;
}
