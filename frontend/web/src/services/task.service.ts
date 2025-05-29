/**
 * Task Service
 * This module provides methods for interacting with the Task API
 */

import api from './api';
import {
  Task,
  TaskFormData,
  TaskListResponse,
  TaskSearchParams,
  TaskStats,
  TaskAssignment,
  TaskCompletion,
  TaskUpdate
} from '../types/task.types';

// Update the base URL to point to the task service
const TASK_API_URL = 'http://localhost:8016/api/tasks';

class TaskService {
  /**
   * Get all tasks with pagination and filtering
   * @param params - Search parameters
   * @returns TaskListResponse
   */
  async getAllTasks(params: TaskSearchParams = {}): Promise<TaskListResponse> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.taskType) queryParams.append('taskType', params.taskType);
      if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
      if (params.createdBy) queryParams.append('createdBy', params.createdBy);
      if (params.patientId) queryParams.append('patientId', params.patientId);
      if (params.encounterId) queryParams.append('encounterId', params.encounterId);
      if (params.search) queryParams.append('search', params.search);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.order) queryParams.append('order', params.order);
      if (params.dueDateFrom) queryParams.append('dueDateFrom', params.dueDateFrom);
      if (params.dueDateTo) queryParams.append('dueDateTo', params.dueDateTo);

      const queryString = queryParams.toString();
      const url = queryString ? `${TASK_API_URL}?${queryString}` : TASK_API_URL;

      const response = await api.get<{ success: boolean; data: TaskListResponse }>(url);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get task by ID
   * @param id - Task ID
   * @returns Task
   */
  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await api.get<{ success: boolean; data: Task }>(`${TASK_API_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching task with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new task
   * @param taskData - Task data
   * @returns Task
   */
  async createTask(taskData: TaskFormData): Promise<Task> {
    try {
      const response = await api.post<{ success: boolean; data: Task }>(
        TASK_API_URL,
        taskData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing task
   * @param id - Task ID
   * @param taskData - Task data
   * @returns Task
   */
  async updateTask(id: string, taskData: TaskUpdate): Promise<Task> {
    try {
      const response = await api.put<{ success: boolean; data: Task }>(
        `${TASK_API_URL}/${id}`,
        taskData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a task
   * @param id - Task ID
   * @returns boolean
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      const response = await api.delete<{ success: boolean }>(`${TASK_API_URL}/${id}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting task with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Assign task to user
   * @param id - Task ID
   * @param assigneeId - User ID to assign to
   * @returns Task
   */
  async assignTask(id: string, assigneeId: string): Promise<Task> {
    try {
      const response = await api.patch<{ success: boolean; data: Task }>(
        `${TASK_API_URL}/${id}/assign`,
        { assigneeId }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error assigning task with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Complete a task
   * @param id - Task ID
   * @param notes - Completion notes
   * @returns Task
   */
  async completeTask(id: string, notes?: string): Promise<Task> {
    try {
      const response = await api.patch<{ success: boolean; data: Task }>(
        `${TASK_API_URL}/${id}/complete`,
        { notes }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error completing task with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get task statistics
   * @param userId - User ID (optional)
   * @returns TaskStats
   */
  async getTaskStats(userId?: string): Promise<TaskStats> {
    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);

      const url = queryParams.toString() 
        ? `${TASK_API_URL}/stats?${queryParams.toString()}`
        : `${TASK_API_URL}/stats`;

      const response = await api.get<{ success: boolean; data: TaskStats }>(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching task stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get pending tasks for user
   * @param userId - User ID (optional)
   * @returns Task[]
   */
  async getPendingTasks(userId?: string): Promise<Task[]> {
    try {
      const params: TaskSearchParams = {
        status: 'pending',
        limit: 50
      };
      if (userId) params.assignedTo = userId;

      const response = await this.getAllTasks(params);
      return response.tasks;
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
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
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.error?.message || 'An error occurred';
      return new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error('Error setting up request');
    }
  }
}

export default new TaskService();
