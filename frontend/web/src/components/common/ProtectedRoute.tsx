import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  redirectPath?: string;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  allowedRoles = []
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('🛡️ ProtectedRoute check:', {
    isAuthenticated,
    isLoading,
    user: user ? { id: user.id, username: user.username } : null,
    redirectPath
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('🛡️ Still loading, showing spinner');
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🛡️ Not authenticated, redirecting to login');
    return <Navigate to={redirectPath} replace />;
  }

  // If roles are specified and user doesn't have required role, redirect to unauthorized
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    console.log('🛡️ User does not have required role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has required role, render the protected content
  console.log('🛡️ Authentication successful, rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute;
