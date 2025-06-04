import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/common/MainLayout';
import AuthLayout from '../components/common/AuthLayout';

// Pages
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';
import DebugLogin from '../pages/DebugLogin';

// Protected route
import ProtectedRoute from '../components/common/ProtectedRoute';

// Lazy-loaded pages
const Schedule = React.lazy(() => import('../pages/Schedule/index'));
const Patients = React.lazy(() => import('../pages/Patients/index'));
const PatientDetail = React.lazy(() => import('../pages/Patients/PatientDetail'));
const PatientForm = React.lazy(() => import('../pages/Patients/PatientForm'));
const PreDiagnosisSummary = React.lazy(() => import('../pages/Patients/PreDiagnosisSummary'));
const Tasks = React.lazy(() => import('../pages/Tasks'));
const Encounters = React.lazy(() => import('../pages/Encounters'));
const Consent = React.lazy(() => import('../pages/Consent'));
const Settings = React.lazy(() => import('../pages/Settings'));
const Help = React.lazy(() => import('../pages/Help'));
const Profile = React.lazy(() => import('../pages/Profile'));
const VoiceRecordingDemo = React.lazy(() => import('../pages/VoiceRecordingDemo'));

// Loading component for lazy-loaded pages
const LazyLoadingFallback = () => (
  <div style={{ padding: 20, textAlign: 'center' }}>
    Loading...
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/debug-login" element={<DebugLogin />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Schedule */}
          <Route
            path="/schedule"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <Schedule />
              </React.Suspense>
            }
          />

          {/* Patients */}
          <Route path="/patients">
            <Route
              index
              element={
                <React.Suspense fallback={<LazyLoadingFallback />}>
                  <Patients />
                </React.Suspense>
              }
            />
            <Route
              path=":id"
              element={
                <React.Suspense fallback={<LazyLoadingFallback />}>
                  <PatientDetail />
                </React.Suspense>
              }
            />
            <Route
              path=":id/edit"
              element={
                <React.Suspense fallback={<LazyLoadingFallback />}>
                  <PatientForm />
                </React.Suspense>
              }
            />
            <Route
              path="new"
              element={
                <React.Suspense fallback={<LazyLoadingFallback />}>
                  <PatientForm />
                </React.Suspense>
              }
            />
            <Route
              path=":id/pre-diagnosis"
              element={
                <React.Suspense fallback={<LazyLoadingFallback />}>
                  <PreDiagnosisSummary />
                </React.Suspense>
              }
            />
          </Route>

          {/* Tasks */}
          <Route
            path="/tasks"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <Tasks />
              </React.Suspense>
            }
          />

          {/* Encounters */}
          <Route
            path="/encounters"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <Encounters />
              </React.Suspense>
            }
          />

          {/* Consent */}
          <Route
            path="/consent"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <Consent />
              </React.Suspense>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <Settings />
              </React.Suspense>
            }
          />

          {/* Help */}
          <Route
            path="/help"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <Help />
              </React.Suspense>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <Profile />
              </React.Suspense>
            }
          />

          {/* Voice Recording Demo */}
          <Route
            path="/voice-recording-demo"
            element={
              <React.Suspense fallback={<LazyLoadingFallback />}>
                <VoiceRecordingDemo />
              </React.Suspense>
            }
          />
        </Route>
      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Not found */}
      <Route path="/not-found" element={<NotFound />} />

      {/* Redirect to dashboard if authenticated, otherwise to login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;
