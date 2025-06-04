/**
 * Dashboard Page
 * Main dashboard interface for doctors
 */

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Dashboard components
import ScheduleTimeline from '../components/dashboard/ScheduleTimeline';
import TaskList from '../components/dashboard/TaskList';
import AlertPanel from '../components/dashboard/AlertPanel';
import MetricsDisplay from '../components/dashboard/MetricsDisplay';
import QuickActions from '../components/dashboard/QuickActions';
import PreDiagnosisSummaryList from '../components/patient/PreDiagnosisSummaryList';

// Hooks and services
import { useDashboard } from '../hooks/useDashboard';
import type { Appointment, Task, Alert as DashboardAlert } from '../services/dashboard.service';
import { PreDiagnosisSummary } from '../types/patient.types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const {
    data,
    filteredData,
    loading,
    error,
    lastUpdated,
    settings,
    refresh,
    updateAppointmentStatus,
    markAlertAsRead,
    updateSettings,
    isStale,
    nextAppointment,
    urgentTasks,
    criticalAlerts
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30,
    useMockData: process.env.REACT_APP_USE_MOCK_SERVICES === 'true' // Use environment variable
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    console.log('Appointment clicked:', appointment);
    // TODO: Navigate to appointment details or start consultation
  };

  const handleAppointmentStatusChange = async (appointmentId: string, status: string) => {
    try {
      await updateAppointmentStatus(appointmentId, status);
      showSnackbar(`Appointment status updated to ${status}`, 'success');
    } catch (error) {
      showSnackbar('Failed to update appointment status', 'error');
    }
  };

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
    // TODO: Navigate to task details or edit task
  };

  const handleTaskComplete = (taskId: string) => {
    console.log('Task completed:', taskId);
    // TODO: Mark task as completed
    showSnackbar('Task marked as completed', 'success');
  };

  const handleAlertClick = (alert: DashboardAlert) => {
    console.log('Alert clicked:', alert);
    markAlertAsRead(alert.id);
    // TODO: Navigate to alert details or take action
  };

  const handleAlertDismiss = (alertId: string) => {
    markAlertAsRead(alertId);
    showSnackbar('Alert dismissed', 'info');
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    showSnackbar(`${action} feature coming soon!`, 'info');
    // TODO: Implement quick actions
  };

  const handlePreDiagnosisSummaryClick = (summary: PreDiagnosisSummary) => {
    // Navigate to the patient's pre-diagnosis summary page
    navigate(`/patients/${summary.patientId}/pre-diagnosis`, {
      state: { summaryId: summary.id }
    });
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box textAlign="center">
          <IconButton onClick={refresh} color="primary">
            <RefreshIcon />
          </IconButton>
          <Typography variant="body2" color="textSecondary">
            Click to retry
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {lastUpdated && (
              <Chip
                label={`Updated ${format(lastUpdated, 'HH:mm')}`}
                size="small"
                variant="outlined"
                sx={{ ml: 2 }}
                color={isStale ? 'warning' : 'default'}
              />
            )}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Critical alerts indicator */}
          {criticalAlerts.length > 0 && (
            <Tooltip title={`${criticalAlerts.length} critical alerts`}>
              <IconButton color="error">
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Refresh dashboard">
            <IconButton onClick={refresh} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Dashboard settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Fullscreen">
            <IconButton>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require immediate attention
          </Typography>
        </Alert>
      )}

      {/* Next Appointment Banner */}
      {nextAppointment && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Next: {nextAppointment.patientName} at {nextAppointment.time} ({nextAppointment.type})
          </Typography>
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Metrics */}
          <Box sx={{ mb: 3 }}>
            {filteredData && (
              <MetricsDisplay
                metrics={filteredData.metrics}
                showCharts={true}
                loading={loading}
                onRefresh={refresh}
              />
            )}
          </Box>

          {/* Schedule Timeline */}
          <Box sx={{ mb: 3 }}>
            <ScheduleTimeline
              appointments={filteredData?.appointments || []}
              onAppointmentClick={handleAppointmentClick}
              onStatusChange={handleAppointmentStatusChange}
              loading={loading}
            />
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Box sx={{ mb: 3 }}>
            <QuickActions
              onNewPatient={() => handleQuickAction('New Patient')}
              onNewAppointment={() => handleQuickAction('New Appointment')}
              onNewPrescription={() => handleQuickAction('New Prescription')}
              onNewLabOrder={() => handleQuickAction('New Lab Order')}
              onNewTask={() => handleQuickAction('New Task')}
              onSearchPatient={() => handleQuickAction('Search Patient')}
              onVideoCall={() => handleQuickAction('Video Call')}
              onSettings={() => handleQuickAction('Settings')}
            />
          </Box>

          {/* Urgent Pre-Diagnosis Summaries */}
          <Box sx={{ mb: 3 }}>
            <PreDiagnosisSummaryList
              showUrgentOnly={true}
              maxItems={3}
              onSummaryClick={handlePreDiagnosisSummaryClick}
              title="Urgent Pre-Diagnosis Summaries"
            />
          </Box>

          {/* Tasks */}
          <Box sx={{ mb: 3 }}>
            <TaskList
              tasks={filteredData?.tasks || []}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
              maxItems={5}
              loading={loading}
            />
          </Box>

          {/* Alerts */}
          <Box sx={{ mb: 3 }}>
            <AlertPanel
              alerts={filteredData?.alerts || []}
              onAlertClick={handleAlertClick}
              onAlertDismiss={handleAlertDismiss}
              maxItems={3}
              loading={loading}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16
        }}
        onClick={() => handleQuickAction('Quick Add')}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;
