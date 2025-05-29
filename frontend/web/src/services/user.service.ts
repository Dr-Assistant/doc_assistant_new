/**
 * User Service
 * This module provides methods for interacting with the User Service API
 */

import api from './api';

// User Service API URL
const USER_API_URL = 'http://localhost:8012/api/users';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  specialty?: string;
  phone?: string;
  status: string;
  preferences?: Record<string, any>;
  profile_image_url?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdateData {
  full_name?: string;
  specialty?: string;
  phone?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  language?: string;
  timezone?: string;
  [key: string]: any;
}

export interface UserListResponse {
  users: UserProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

class UserService {
  /**
   * Get current user profile
   * @returns UserProfile
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await api.get<{ success: boolean; data: { user: UserProfile } }>(`${USER_API_URL}/me`);
      return response.data.data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update current user profile
   * @param userData - User update data
   * @returns UserProfile
   */
  async updateCurrentUser(userData: UserUpdateData): Promise<UserProfile> {
    try {
      const response = await api.put<{ success: boolean; data: { user: UserProfile } }>(`${USER_API_URL}/me`, userData);
      return response.data.data.user;
    } catch (error) {
      console.error('Error updating current user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get current user preferences
   * @returns UserPreferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const response = await api.get<{ success: boolean; data: { preferences: UserPreferences } }>(`${USER_API_URL}/me/preferences`);
      return response.data.data.preferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update current user preferences
   * @param preferences - User preferences
   * @returns UserPreferences
   */
  async updateUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    try {
      const response = await api.put<{ success: boolean; data: { preferences: UserPreferences } }>(`${USER_API_URL}/me/preferences`, preferences);
      return response.data.data.preferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all users (admin only)
   * @param params - Search parameters
   * @returns UserListResponse
   */
  async getAllUsers(params: UserSearchParams = {}): Promise<UserListResponse> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.order) queryParams.append('order', params.order);

      const queryString = queryParams.toString();
      const url = queryString ? `${USER_API_URL}?${queryString}` : USER_API_URL;

      const response = await api.get<{ success: boolean; data: UserListResponse }>(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user by ID (admin only)
   * @param id - User ID
   * @returns UserProfile
   */
  async getUserById(id: string): Promise<UserProfile> {
    try {
      const response = await api.get<{ success: boolean; data: { user: UserProfile } }>(`${USER_API_URL}/${id}`);
      return response.data.data.user;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new user (admin only)
   * @param userData - User data
   * @returns UserProfile
   */
  async createUser(userData: Omit<UserProfile, 'id'>): Promise<UserProfile> {
    try {
      const response = await api.post<{ success: boolean; data: { user: UserProfile } }>(USER_API_URL, userData);
      return response.data.data.user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update user (admin only)
   * @param id - User ID
   * @param userData - User update data
   * @returns UserProfile
   */
  async updateUser(id: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.put<{ success: boolean; data: { user: UserProfile } }>(`${USER_API_URL}/${id}`, userData);
      return response.data.data.user;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete user (admin only)
   * @param id - User ID
   * @returns boolean
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      await api.delete(`${USER_API_URL}/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
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
      // Server responded with error status
      const message = error.response.data?.message || error.response.statusText || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error - please check your connection');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new UserService();
