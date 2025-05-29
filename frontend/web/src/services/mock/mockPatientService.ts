/**
 * Mock Patient Service
 * This module provides mock data for the Patient Service
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Patient,
  PatientFormData,
  PatientListResponse,
  PatientSearchParams,
  MedicalHistory
} from '../../types/patient.types';

// Mock patients data
const mockPatients: Patient[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1985-05-15',
    gender: 'male',
    phone: '+1234567890',
    email: 'john.doe@example.com',
    mrn: 'MRN12345',
    abha_id: '1234567890123456',
    status: 'active',
    blood_group: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    address: {
      line1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'USA'
    },
    emergency_contact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1987654321'
    },
    created_at: '2023-01-15T10:30:00Z',
    updated_at: '2023-06-20T14:45:00Z'
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    date_of_birth: '1990-08-22',
    gender: 'female',
    phone: '+1234567891',
    email: 'jane.smith@example.com',
    mrn: 'MRN12346',
    status: 'active',
    blood_group: 'A+',
    allergies: ['Sulfa Drugs'],
    created_at: '2023-02-10T09:15:00Z',
    updated_at: '2023-05-18T11:20:00Z'
  },
  {
    id: '3',
    first_name: 'Robert',
    last_name: 'Johnson',
    date_of_birth: '1978-11-30',
    gender: 'male',
    phone: '+1234567892',
    email: 'robert.johnson@example.com',
    mrn: 'MRN12347',
    abha_id: '9876543210123456',
    status: 'inactive',
    blood_group: 'B-',
    created_at: '2023-03-05T14:20:00Z',
    updated_at: '2023-04-12T16:30:00Z'
  },
  {
    id: '4',
    first_name: 'Emily',
    last_name: 'Williams',
    date_of_birth: '1995-04-12',
    gender: 'female',
    phone: '+1234567893',
    email: 'emily.williams@example.com',
    mrn: 'MRN12348',
    status: 'active',
    blood_group: 'AB+',
    allergies: ['Latex', 'Shellfish'],
    created_at: '2023-01-20T08:45:00Z',
    updated_at: '2023-06-15T10:10:00Z'
  },
  {
    id: '5',
    first_name: 'Michael',
    last_name: 'Brown',
    date_of_birth: '1982-07-08',
    gender: 'male',
    phone: '+1234567894',
    email: 'michael.brown@example.com',
    mrn: 'MRN12349',
    status: 'deceased',
    blood_group: 'O-',
    created_at: '2022-11-10T11:30:00Z',
    updated_at: '2023-02-28T09:20:00Z'
  }
];

// Mock medical history data
const mockMedicalHistories: Record<string, MedicalHistory> = {
  '1': {
    patientId: '1',
    conditions: [
      {
        name: 'Hypertension',
        diagnosedDate: '2020-03-15',
        status: 'active',
        notes: 'Controlled with medication'
      },
      {
        name: 'Type 2 Diabetes',
        diagnosedDate: '2019-07-22',
        status: 'active',
        notes: 'Diet controlled'
      }
    ],
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        startDate: '2020-03-20',
        status: 'active',
        prescribedBy: 'Dr. Smith'
      }
    ],
    surgeries: [
      {
        name: 'Appendectomy',
        date: '2010-05-12',
        hospital: 'General Hospital',
        surgeon: 'Dr. Johnson'
      }
    ],
    createdAt: '2023-01-15T10:30:00Z',
    updatedAt: '2023-06-20T14:45:00Z'
  }
};

class MockPatientService {
  /**
   * Get all patients with pagination and filtering
   * @param params - Search parameters
   * @returns PatientListResponse
   */
  async getAllPatients(params: PatientSearchParams = {}): Promise<PatientListResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sort = 'last_name',
      order = 'ASC'
    } = params;
    
    // Filter patients
    let filteredPatients = [...mockPatients];
    
    if (status) {
      filteredPatients = filteredPatients.filter(patient => patient.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient => 
        patient.first_name.toLowerCase().includes(searchLower) ||
        patient.last_name.toLowerCase().includes(searchLower) ||
        (patient.mrn && patient.mrn.toLowerCase().includes(searchLower)) ||
        (patient.abha_id && patient.abha_id.toLowerCase().includes(searchLower)) ||
        (patient.email && patient.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort patients
    filteredPatients.sort((a, b) => {
      const aValue = a[sort as keyof Patient];
      const bValue = b[sort as keyof Patient];
      
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
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
    
    return {
      patients: paginatedPatients,
      pagination: {
        total: filteredPatients.length,
        page,
        limit,
        totalPages: Math.ceil(filteredPatients.length / limit),
        hasNext: endIndex < filteredPatients.length,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get patient by ID
   * @param id - Patient ID
   * @returns Patient
   */
  async getPatientById(id: string): Promise<Patient> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const patient = mockPatients.find(p => p.id === id);
    
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    return patient;
  }

  /**
   * Create a new patient
   * @param patientData - Patient data
   * @returns Patient
   */
  async createPatient(patientData: PatientFormData): Promise<Patient> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPatient: Patient = {
      id: uuidv4(),
      ...patientData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockPatients.push(newPatient);
    
    return newPatient;
  }

  /**
   * Update an existing patient
   * @param id - Patient ID
   * @param patientData - Patient data
   * @returns Patient
   */
  async updatePatient(id: string, patientData: Partial<PatientFormData>): Promise<Patient> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const patientIndex = mockPatients.findIndex(p => p.id === id);
    
    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }
    
    const updatedPatient: Patient = {
      ...mockPatients[patientIndex],
      ...patientData,
      updated_at: new Date().toISOString()
    };
    
    mockPatients[patientIndex] = updatedPatient;
    
    return updatedPatient;
  }

  /**
   * Delete a patient
   * @param id - Patient ID
   * @returns boolean
   */
  async deletePatient(id: string): Promise<boolean> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const patientIndex = mockPatients.findIndex(p => p.id === id);
    
    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }
    
    mockPatients.splice(patientIndex, 1);
    
    return true;
  }

  /**
   * Get patient medical history
   * @param id - Patient ID
   * @returns MedicalHistory
   */
  async getPatientMedicalHistory(id: string): Promise<MedicalHistory> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const medicalHistory = mockMedicalHistories[id];
    
    if (!medicalHistory) {
      // Create empty medical history if not found
      const newMedicalHistory: MedicalHistory = {
        patientId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockMedicalHistories[id] = newMedicalHistory;
      
      return newMedicalHistory;
    }
    
    return medicalHistory;
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const existingMedicalHistory = mockMedicalHistories[id];
    
    if (!existingMedicalHistory) {
      throw new Error('Medical history not found');
    }
    
    const updatedMedicalHistory: MedicalHistory = {
      ...existingMedicalHistory,
      ...medicalHistory,
      updatedAt: new Date().toISOString()
    };
    
    mockMedicalHistories[id] = updatedMedicalHistory;
    
    return updatedMedicalHistory;
  }
}

export default new MockPatientService();
