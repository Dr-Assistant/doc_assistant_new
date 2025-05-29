import api from './api';

// Check if mock auth is enabled
const MOCK_AUTH = process.env.REACT_APP_MOCK_AUTH === 'true';

// Mock user data
const MOCK_USER: User = {
  id: 'mock-user-id',
  username: 'doctor',
  email: 'doctor@example.com',
  full_name: 'Dr. John Doe',
  role: 'doctor',
  specialty: 'General Medicine',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Mock token
const MOCK_TOKEN = 'mock-jwt-token-123456789';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: string;
  specialty?: string;
  phone?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  specialty?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires: string;
    requireMFA?: boolean;
    userId?: string;
    tempToken?: string;
  };
}

export interface MFAVerifyData {
  userId: string;
  code: string;
}

class AuthService {
  /**
   * Login user
   * @param credentials - Login credentials
   * @returns AuthResponse
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // If mock auth is enabled, return mock data
    if (MOCK_AUTH) {
      console.log('Using mock authentication');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Store mock data in localStorage
      localStorage.setItem('token', MOCK_TOKEN);
      localStorage.setItem('user', JSON.stringify(MOCK_USER));

      // Return mock response
      return {
        success: true,
        data: {
          user: MOCK_USER,
          token: MOCK_TOKEN,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        }
      };
    }

    // Otherwise, use real API
    try {
      console.log('🌐 Attempting to login with real API', credentials);
      console.log('🌐 API base URL:', api.defaults.baseURL);
      console.log('🌐 MOCK_AUTH setting:', MOCK_AUTH);

      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      console.log('🌐 Login API response:', response.data);

      // If login successful and no MFA required, store user data and token
      if (response.data.success && !response.data.data.requireMFA) {
        console.log('🌐 Storing token and user in localStorage');
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        console.log('🌐 Token stored:', response.data.data.token.substring(0, 20) + '...');
      }

      return response.data;
    } catch (error) {
      console.error('🌐 Login API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify MFA code
   * @param data - MFA verification data
   * @returns AuthResponse
   */
  async verifyMFA(data: MFAVerifyData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/verify-mfa', data);

      // If verification successful, store user data and token
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register a new user
   * @param data - Registration data
   * @returns AuthResponse
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', data);

      // If registration successful, store user data and token
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user
   * @returns User
   */
  async getCurrentUser(): Promise<User> {
    // If mock auth is enabled, return mock user
    if (MOCK_AUTH) {
      console.log('Using mock user data');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return MOCK_USER;
    }

    // Otherwise, use real API
    try {
      const response = await api.get<{ success: boolean; data: { user: User } }>('/api/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // If mock auth is enabled, just clear localStorage
    if (MOCK_AUTH) {
      console.log('Using mock logout');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return;
    }

    // Otherwise, use real API
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Get stored user
   * @returns User | null
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Handle API errors
   * @param error - Error object
   * @returns Error with message
   */
  private handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data.error?.message || 'An error occurred';
      return new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response from server. Please check your internet connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error(error.message || 'An unknown error occurred');
    }
  }
}

export default new AuthService();
