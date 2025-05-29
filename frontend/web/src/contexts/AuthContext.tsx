import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService, { User, LoginCredentials, MFAVerifyData } from '../services/auth.service';

// Define auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  verifyMFA: (data: MFAVerifyData) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  requireMFA: boolean;
  tempMFAData: { userId: string; tempToken: string } | null;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requireMFA, setRequireMFA] = useState<boolean>(false);
  const [tempMFAData, setTempMFAData] = useState<{ userId: string; tempToken: string } | null>(null);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          // Get user from localStorage first for immediate UI update
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setToken(storedToken);
          }

          // Then validate with backend
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            // Update stored user with latest data
            localStorage.setItem('user', JSON.stringify(currentUser));
          } catch (apiError) {
            // If API call fails, token might be invalid
            console.error('Failed to validate token:', apiError);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        // Clear invalid auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    console.log('🔐 Starting login process...', credentials.username);
    setIsLoading(true);
    setError(null);
    setRequireMFA(false);
    setTempMFAData(null);

    try {
      console.log('🔐 Calling authService.login...');
      const response = await authService.login(credentials);
      console.log('🔐 Login response received:', response);

      // Check if MFA is required
      if (response.data.requireMFA) {
        console.log('🔐 MFA required, setting up MFA flow');
        setRequireMFA(true);
        setTempMFAData({
          userId: response.data.userId!,
          tempToken: response.data.tempToken!
        });
      } else {
        // Regular login success
        console.log('🔐 Login successful, setting user and token');
        console.log('🔐 User:', response.data.user);
        console.log('🔐 Token:', response.data.token);

        setUser(response.data.user);
        setToken(response.data.token);

        console.log('🔐 Navigating to dashboard...');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('🔐 Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify MFA function
  const verifyMFA = async (data: MFAVerifyData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyMFA(data);

      // MFA verification success
      setUser(response.data.user);
      setToken(response.data.token);
      setRequireMFA(false);
      setTempMFAData(null);

      navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('MFA verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);

    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Update state
      setUser(null);
      setToken(null);
      setIsLoading(false);

      // Navigate to login
      navigate('/login');
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

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
