import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MuiLayout from './components/MuiLayout';
import MuiDashboard from './components/MuiDashboard';
import PatientsPage from './components/PatientsPage';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Routes component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login route */}
      <Route
        path="/login"
        element={
          isAuthenticated ?
            <Navigate to="/dashboard" replace /> :
            <Login />
        }
      />

      {/* Dashboard route (protected) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MuiLayout>
              <MuiDashboard />
            </MuiLayout>
          </ProtectedRoute>
        }
      />

      {/* Patients route (protected) */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <MuiLayout>
              <PatientsPage />
            </MuiLayout>
          </ProtectedRoute>
        }
      />

      {/* Default route */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
