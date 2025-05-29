/**
 * Dashboard Service
 * Handles API calls for dashboard data
 */

import api from './api';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  time: string;
  duration: number;
  type: string;
  status: 'booked' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  isUrgent?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  patientId?: string;
  patientName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  taskType: 'documentation' | 'review' | 'follow_up' | 'referral' | 'order' | 'other';
  dueDate?: string;
  createdAt: string;
  isOverdue?: boolean;
  isDueToday?: boolean;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'patient' | 'system' | 'schedule' | 'clinical';
  patientId?: string;
  patientName?: string;
  createdAt: string;
  isRead: boolean;
  actionRequired?: boolean;
}

export interface PracticeMetrics {
  patientsSeenToday: number;
  patientsScheduledToday: number;
  averageWaitTime: number;
  averageConsultationTime: number;
  completionRate: number;
  pendingTasksCount: number;
  criticalAlertsCount: number;
  revenueToday?: number;
  patientSatisfactionScore?: number;
}

export interface DashboardData {
  appointments: Appointment[];
  tasks: Task[];
  alerts: Alert[];
  metrics: PracticeMetrics;
  timestamp: string;
}

class DashboardService {
  private baseUrl = 'http://localhost:8015/api/dashboard';

  /**
   * Get complete dashboard data
   */
  async getDashboardData(doctorId?: string): Promise<DashboardData> {
    try {
      const params = doctorId ? { doctorId } : {};
      const response = await api.get(`${this.baseUrl}/complete`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(doctorId?: string): Promise<Appointment[]> {
    try {
      const params = doctorId ? { doctorId } : {};
      const response = await api.get(`${this.baseUrl}/appointments/today`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  /**
   * Get pending tasks
   */
  async getPendingTasks(doctorId?: string): Promise<Task[]> {
    try {
      const params = doctorId ? { doctorId } : {};
      const response = await api.get(`${this.baseUrl}/tasks/pending`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      throw error;
    }
  }

  /**
   * Get critical alerts
   */
  async getCriticalAlerts(doctorId?: string): Promise<Alert[]> {
    try {
      const params = doctorId ? { doctorId } : {};
      const response = await api.get(`${this.baseUrl}/alerts/critical`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching critical alerts:', error);
      throw error;
    }
  }

  /**
   * Get practice metrics
   */
  async getPracticeMetrics(doctorId?: string): Promise<PracticeMetrics> {
    try {
      const params = doctorId ? { doctorId } : {};
      const response = await api.get(`${this.baseUrl}/metrics/practice`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching practice metrics:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<void> {
    try {
      await api.patch(`/api/schedule/appointments/${appointmentId}/status`, { status });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      await api.patch(`/api/alerts/${alertId}/read`);
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  /**
   * Get mock data for development
   */
  getMockDashboardData(): DashboardData {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
      appointments: [
        {
          id: '1',
          patientId: 'p1',
          patientName: 'Rahul Mehta',
          patientAge: 45,
          time: '09:30',
          duration: 30,
          type: 'Follow-up',
          status: 'checked-in',
          notes: 'Diabetes management follow-up'
        },
        {
          id: '2',
          patientId: 'p2',
          patientName: 'Priya Sharma',
          patientAge: 32,
          time: '10:15',
          duration: 20,
          type: 'Consultation',
          status: 'confirmed',
          notes: 'Persistent cough'
        },
        {
          id: '3',
          patientId: 'p3',
          patientName: 'Vikram Singh',
          patientAge: 28,
          time: '10:45',
          duration: 15,
          type: 'Follow-up',
          status: 'booked',
          notes: 'Blood pressure check'
        },
        {
          id: '4',
          patientId: 'p4',
          patientName: 'Ananya Desai',
          patientAge: 55,
          time: '11:30',
          duration: 45,
          type: 'Annual Physical',
          status: 'booked',
          isUrgent: true
        }
      ],
      tasks: [
        {
          id: 't1',
          title: 'Review Lab Results',
          description: 'Review blood work results for diabetes monitoring',
          patientId: 'p1',
          patientName: 'Rahul Mehta',
          priority: 'high',
          status: 'pending',
          taskType: 'review',
          dueDate: today,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          isDueToday: true
        },
        {
          id: 't2',
          title: 'Complete SOAP Note',
          description: 'Finalize consultation notes from yesterday',
          patientId: 'p2',
          patientName: 'Priya Sharma',
          priority: 'medium',
          status: 'pending',
          taskType: 'documentation',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          isOverdue: true
        },
        {
          id: 't3',
          title: 'Prescription Renewal',
          description: 'Renew blood pressure medication',
          patientId: 'p3',
          patientName: 'Vikram Singh',
          priority: 'low',
          status: 'pending',
          taskType: 'order',
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
        }
      ],
      alerts: [
        {
          id: 'a1',
          title: 'Critical Lab Result',
          message: 'Abnormal glucose levels detected for Rahul Mehta',
          severity: 'critical',
          type: 'clinical',
          patientId: 'p1',
          patientName: 'Rahul Mehta',
          createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          isRead: false,
          actionRequired: true
        },
        {
          id: 'a2',
          title: 'Schedule Change',
          message: 'Patient Ananya Desai requested to reschedule appointment',
          severity: 'medium',
          type: 'schedule',
          patientId: 'p4',
          patientName: 'Ananya Desai',
          createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          isRead: false
        }
      ],
      metrics: {
        patientsSeenToday: 8,
        patientsScheduledToday: 12,
        averageWaitTime: 12,
        averageConsultationTime: 25,
        completionRate: 85,
        pendingTasksCount: 3,
        criticalAlertsCount: 1,
        revenueToday: 4500,
        patientSatisfactionScore: 4.7
      },
      timestamp: now.toISOString()
    };
  }
}

export default new DashboardService();
