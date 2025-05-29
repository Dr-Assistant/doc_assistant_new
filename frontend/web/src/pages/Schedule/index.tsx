/**
 * Schedule Page
 * This page displays the schedule management interface
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import CalendarView from './components/CalendarView';
import AppointmentList from './components/AppointmentList';
import AppointmentDetail from './components/AppointmentDetail';
import AppointmentForm from './components/AppointmentForm';
import scheduleService from '../../services/schedule.service';
import {
  Appointment,
  AppointmentFormData,
  AppointmentListResponse,
  AppointmentSearchParams
} from '../../types/schedule.types';

const SchedulePage: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<number>(0);

  // State for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // State for appointment list data
  const [appointmentListData, setAppointmentListData] = useState<AppointmentListResponse | null>(null);

  // State for loading
  const [loading, setLoading] = useState<boolean>(true);

  // State for error
  const [error, setError] = useState<string | null>(null);

  // State for search params
  const [searchParams, setSearchParams] = useState<AppointmentSearchParams>({
    page: 1,
    limit: 10
  });

  // Ref to store current search params for stable access
  const searchParamsRef = useRef(searchParams);

  // Ref to store current calendar date range for refreshing
  const currentDateRangeRef = useRef<{ startDate: string; endDate: string } | null>(null);

  // Update ref when searchParams change
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // State for selected appointment
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // State for appointment detail modal
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // State for appointment form modal
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);

  // State for form loading
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // State for snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch appointments for calendar view
  const fetchAppointmentsForCalendar = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await scheduleService.getAppointmentsByDateRange(startDate, endDate);
      setAppointments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      console.error('Error fetching calendar appointments:', errorMessage);
      setError(errorMessage);

      // If authentication error, clear appointments to prevent showing stale data
      if (errorMessage.includes('Authentication required') || errorMessage.includes('No authentication token')) {
        setAppointments([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch appointments for list view
  const fetchAppointmentsForList = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);

    try {
      const data = await scheduleService.getAllAppointments(params || searchParamsRef.current);
      setAppointmentListData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      console.error('Error fetching list appointments:', errorMessage);
      setError(errorMessage);

      // If authentication error, clear appointments to prevent showing stale data
      if (errorMessage.includes('Authentication required') || errorMessage.includes('No authentication token')) {
        setAppointmentListData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle date range change
  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    // Store the current date range for later use
    currentDateRangeRef.current = { startDate, endDate };
    fetchAppointmentsForCalendar(startDate, endDate);
  }, [fetchAppointmentsForCalendar]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setSearchParams(prev => ({
      ...prev,
      page
    }));
    // Fetch data immediately with new params
    if (activeTab === 1) {
      fetchAppointmentsForList({ ...searchParamsRef.current, page });
    }
  }, [activeTab]);

  // Handle rows per page change
  const handleRowsPerPageChange = useCallback((rowsPerPage: number) => {
    const newParams = {
      ...searchParamsRef.current,
      limit: rowsPerPage,
      page: 1 // Reset to first page
    };
    setSearchParams(newParams);
    // Fetch data immediately with new params
    if (activeTab === 1) {
      fetchAppointmentsForList(newParams);
    }
  }, [activeTab]);

  // Handle view appointment
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailModalOpen(true);
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailModalOpen(false);
    setFormModalOpen(true);
  };

  // Handle new appointment
  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setFormModalOpen(true);
  };

  // Handle delete appointment
  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await scheduleService.deleteAppointment(appointment.id);

        // Refresh data by refetching from API
        if (activeTab === 0) {
          // Calendar view - refetch current date range to ensure fresh data
          if (currentDateRangeRef.current) {
            fetchAppointmentsForCalendar(currentDateRangeRef.current.startDate, currentDateRangeRef.current.endDate);
          }
        } else {
          // List view
          fetchAppointmentsForList();
        }

        // Show success message
        setSnackbar({
          open: true,
          message: 'Appointment deleted successfully',
          severity: 'success'
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: err instanceof Error ? err.message : 'Failed to delete appointment',
          severity: 'error'
        });
      }
    }
  };

  // Handle update status
  const handleUpdateStatus = async (appointment: Appointment, status: string) => {
    try {
      const updatedAppointment = await scheduleService.updateAppointmentStatus(appointment.id, status);

      // Refresh data by refetching from API
      if (activeTab === 0) {
        // Calendar view - refetch current date range to ensure fresh data
        if (currentDateRangeRef.current) {
          fetchAppointmentsForCalendar(currentDateRangeRef.current.startDate, currentDateRangeRef.current.endDate);
        }
      } else {
        // List view
        fetchAppointmentsForList();
      }

      // Update selected appointment if detail modal is open
      if (detailModalOpen && selectedAppointment?.id === updatedAppointment.id) {
        setSelectedAppointment(updatedAppointment);
      }

      // Show success message
      setSnackbar({
        open: true,
        message: `Appointment status updated to ${status}`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update appointment status',
        severity: 'error'
      });
    }
  };

  // Handle save appointment
  const handleSaveAppointment = async (appointmentData: AppointmentFormData) => {
    setFormLoading(true);

    try {
      let updatedAppointment: Appointment;

      if (selectedAppointment) {
        // Update existing appointment
        updatedAppointment = await scheduleService.updateAppointment(selectedAppointment.id, appointmentData);

        // Show success message
        setSnackbar({
          open: true,
          message: 'Appointment updated successfully',
          severity: 'success'
        });
      } else {
        // Create new appointment
        updatedAppointment = await scheduleService.createAppointment(appointmentData);

        // Show success message
        setSnackbar({
          open: true,
          message: 'Appointment created successfully',
          severity: 'success'
        });
      }

      // Refresh data by refetching from API
      if (activeTab === 0) {
        // Calendar view - refetch current date range to ensure fresh data
        if (currentDateRangeRef.current) {
          fetchAppointmentsForCalendar(currentDateRangeRef.current.startDate, currentDateRangeRef.current.endDate);
        }
      } else {
        // List view
        fetchAppointmentsForList();
      }

      // Close form modal
      setFormModalOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to save appointment',
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Fetch appointments when tab changes
  useEffect(() => {
    // Add a small delay to ensure authentication token is loaded
    const timer = setTimeout(() => {
      if (activeTab === 1) {
        // List view - fetch all appointments
        fetchAppointmentsForList();
      }
      // Note: Calendar view will fetch data automatically when CalendarView component mounts
      // and calls onDateRangeChange with the correct week range
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
  }, [activeTab, fetchAppointmentsForList]);

  // Note: Removed the searchParams useEffect to prevent infinite loops
  // Search param changes now trigger immediate fetches in handlePageChange and handleRowsPerPageChange

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary">Schedule</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="h4" component="h1">
            Schedule
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewAppointment}
          >
            New Appointment
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="schedule tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Calendar" />
          <Tab label="List" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 ? (
            <CalendarView
              appointments={appointments}
              loading={loading}
              error={error}
              onDateRangeChange={handleDateRangeChange}
              onAppointmentClick={handleViewAppointment}
            />
          ) : (
            <AppointmentList
              data={appointmentListData}
              loading={loading}
              error={error}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onViewAppointment={handleViewAppointment}
              onEditAppointment={handleEditAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </Box>
      </Paper>

      {/* Appointment Detail Modal */}
      <AppointmentDetail
        appointment={selectedAppointment}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onEdit={handleEditAppointment}
        onStatusChange={handleUpdateStatus}
      />

      {/* Appointment Form Modal */}
      <AppointmentForm
        appointment={selectedAppointment}
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSaveAppointment}
        loading={formLoading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SchedulePage;
