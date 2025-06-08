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

// Hooks and services
import { useDashboard } from '../hooks/useDashboard';
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
    useMockData: true // Use mock data for now since backend might not be fully connected
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    showSnackbar(`${action} feature coming soon!`, 'info');
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
        {/* Dashboard Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Today's Appointments
            </Typography>
            <Typography variant="h4">
              {filteredData?.appointments?.length || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Pending Tasks
            </Typography>
            <Typography variant="h4">
              {filteredData?.tasks?.length || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Unread Alerts
            </Typography>
            <Typography variant="h4">
              {filteredData?.alerts?.length || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Total Patients
            </Typography>
            <Typography variant="h4">
              {filteredData?.metrics?.totalPatients || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <IconButton
                color="primary"
                onClick={() => navigate('/patients/new')}
                sx={{ flexDirection: 'column', p: 2 }}
              >
                <AddIcon />
                <Typography variant="caption">New Patient</Typography>
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => navigate('/schedule')}
                sx={{ flexDirection: 'column', p: 2 }}
              >
                <AddIcon />
                <Typography variant="caption">Schedule</Typography>
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => navigate('/tasks')}
                sx={{ flexDirection: 'column', p: 2 }}
              >
                <AddIcon />
                <Typography variant="caption">Tasks</Typography>
              </IconButton>
            </Box>
          </Paper>
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
