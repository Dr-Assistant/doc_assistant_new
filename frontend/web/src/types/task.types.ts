/**
 * Task Types
 * Type definitions for task management functionality
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  createdBy: string;
  patientId?: string;
  encounterId?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  taskType: 'documentation' | 'review' | 'follow_up' | 'referral' | 'order' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  assignedTo?: string;
  patientId?: string;
  encounterId?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  taskType: 'documentation' | 'review' | 'follow_up' | 'referral' | 'order' | 'other';
  notes?: string;
}

export interface TaskSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  taskType?: string;
  assignedTo?: string;
  createdBy?: string;
  patientId?: string;
  encounterId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

export interface TaskAssignment {
  taskId: string;
  assigneeId: string;
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}

export interface TaskCompletion {
  taskId: string;
  completedBy: string;
  completedAt: string;
  notes?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}
