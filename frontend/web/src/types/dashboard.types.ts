/**
 * Dashboard Types
 * Type definitions for dashboard components
 */

// Import and re-export types from dashboard service
import type {
  Appointment,
  Task,
  Alert,
  PracticeMetrics,
  DashboardData
} from '../services/dashboard.service';

// Re-export for convenience
export type {
  Appointment,
  Task,
  Alert,
  PracticeMetrics,
  DashboardData
};

export interface DashboardProps {
  doctorId?: string;
}

export interface ScheduleTimelineProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onStatusChange?: (appointmentId: string, status: AppointmentStatus) => void;
}

export interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  showAll?: boolean;
  maxItems?: number;
}

export interface AlertPanelProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  onAlertDismiss?: (alertId: string) => void;
  maxItems?: number;
}

export interface MetricsDisplayProps {
  metrics: PracticeMetrics;
  showCharts?: boolean;
}

export interface QuickActionsProps {
  onRecordClick?: () => void;
  onAddPatientClick?: () => void;
  onPrescribeClick?: () => void;
  onLabOrderClick?: () => void;
}

export interface PatientSummaryProps {
  patient?: NextPatient;
  onViewSummary?: () => void;
  onStartConsultation?: () => void;
}

export type AppointmentStatus = 'booked' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface NextPatient {
  id: string;
  name: string;
  age: number;
  appointment: string;
  waitingTime: string;
  appointmentType: string;
  notes?: string;
  isUrgent?: boolean;
}

export interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  appointmentStatus?: AppointmentStatus[];
  taskPriority?: TaskPriority[];
  alertSeverity?: AlertSeverity[];
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showCompletedTasks: boolean;
  showReadAlerts: boolean;
  defaultView: 'overview' | 'schedule' | 'tasks' | 'alerts';
  compactMode: boolean;
}

export interface WebSocketMessage {
  type: 'appointment_update' | 'task_update' | 'alert_new' | 'metrics_update';
  data: any;
  timestamp: string;
}
