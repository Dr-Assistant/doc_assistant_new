import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Define user type
const mockUser = {
  id: 'mock-user-id',
  username: 'doctor',
  email: 'doctor@example.com',
  full_name: 'Dr. John Doe',
  role: 'doctor',
  specialty: 'General Medicine'
};

// Create auth context
const AuthContext = createContext(null);

// Auth context provider
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requireMFA, setRequireMFA] = useState(false);
  const [tempMFAData, setTempMFAData] = useState(null);
  
  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Error restoring session:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call
      console.log('Logging in with:', credentials);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockResponse = {
        user: mockUser,
        token: 'mock-token-123'
      };
      
      // Update state
      setUser(mockResponse.user);
      setToken(mockResponse.token);
      
      // Store in localStorage
      localStorage.setItem('token', mockResponse.token);
      localStorage.setItem('user', JSON.stringify(mockResponse.user));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify MFA function
  const verifyMFA = async (data) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call
      console.log('Verifying MFA with:', data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful verification
      const mockResponse = {
        user: mockUser,
        token: 'mock-token-123'
      };
      
      // Update state
      setUser(mockResponse.user);
      setToken(mockResponse.token);
      setRequireMFA(false);
      setTempMFAData(null);
      
      // Store in localStorage
      localStorage.setItem('token', mockResponse.token);
      localStorage.setItem('user', JSON.stringify(mockResponse.user));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'MFA verification failed');
      console.error('MFA verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Mock API call
      console.log('Logging out');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Update state
      setUser(null);
      setToken(null);
      
      // Navigate to login
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Compute isAuthenticated
  const isAuthenticated = !!user && !!token;
  
  // Context value
  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    verifyMFA,
    logout,
    error,
    requireMFA,
    tempMFAData
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth context hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
