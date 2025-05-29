/**
 * Schedule Types
 * This module defines TypeScript interfaces for schedule data
 */

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  reason?: string;
  notes?: string;
  created_by?: string;
  check_in_time?: string;
  check_out_time?: string;
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: string;
    phone?: string;
    email?: string;
  };
}

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'checked_in' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type AppointmentType = 
  | 'in_person' 
  | 'telemedicine' 
  | 'follow_up' 
  | 'urgent' 
  | 'routine';

export interface AppointmentFormData {
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  appointment_type: AppointmentType;
  status?: AppointmentStatus;
  reason?: string;
  notes?: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AppointmentSearchParams {
  page?: number;
  limit?: number;
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  is_available: boolean;
  recurrence_type: RecurrenceType;
  recurrence_end_date?: string;
  created_at: string;
  updated_at: string;
}

export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface AvailabilityFormData {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  recurrence_type: RecurrenceType;
  recurrence_end_date?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface CalendarViewType {
  type: 'day' | 'week' | 'month';
  date: Date;
}

export interface AppointmentStatusInfo {
  label: string;
  color: string;
  icon?: string;
}

export const APPOINTMENT_STATUS_INFO: Record<AppointmentStatus, AppointmentStatusInfo> = {
  scheduled: { label: 'Scheduled', color: '#FFC107' }, // Amber
  confirmed: { label: 'Confirmed', color: '#2196F3' }, // Blue
  checked_in: { label: 'Checked In', color: '#00BCD4' }, // Cyan
  in_progress: { label: 'In Progress', color: '#9C27B0' }, // Purple
  completed: { label: 'Completed', color: '#4CAF50' }, // Green
  cancelled: { label: 'Cancelled', color: '#F44336' }, // Red
  no_show: { label: 'No Show', color: '#607D8B' } // Blue Grey
};

export const APPOINTMENT_TYPE_INFO: Record<AppointmentType, { label: string }> = {
  in_person: { label: 'In Person' },
  telemedicine: { label: 'Telemedicine' },
  follow_up: { label: 'Follow Up' },
  urgent: { label: 'Urgent' },
  routine: { label: 'Routine' }
};
