/**
 * Appointment Detail Component
 * This component displays detailed information about an appointment
 */

import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Notes as NotesIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { Appointment, APPOINTMENT_STATUS_INFO, APPOINTMENT_TYPE_INFO } from '../../../types/schedule.types';

interface AppointmentDetailProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: string) => void;
}

const AppointmentDetail: React.FC<AppointmentDetailProps> = ({
  appointment,
  open,
  onClose,
  onEdit,
  onStatusChange
}) => {
  if (!appointment) {
    return null;
  }
  
  // Format date
  const formatDate = (isoString: string): string => {
    return format(parseISO(isoString), 'EEEE, MMMM d, yyyy');
  };
  
  // Format time
  const formatTime = (isoString: string): string => {
    return format(parseISO(isoString), 'h:mm a');
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    return APPOINTMENT_STATUS_INFO[status as keyof typeof APPOINTMENT_STATUS_INFO]?.color || '#9E9E9E';
  };
  
  // Get status label
  const getStatusLabel = (status: string): string => {
    return APPOINTMENT_STATUS_INFO[status as keyof typeof APPOINTMENT_STATUS_INFO]?.label || status;
  };
  
  // Get appointment type label
  const getAppointmentTypeLabel = (type: string): string => {
    return APPOINTMENT_TYPE_INFO[type as keyof typeof APPOINTMENT_TYPE_INFO]?.label || type;
  };
  
  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus: string): { value: string; label: string }[] => {
    switch (currentStatus) {
      case 'scheduled':
        return [
          { value: 'confirmed', label: 'Confirm' },
          { value: 'cancelled', label: 'Cancel' }
        ];
      case 'confirmed':
        return [
          { value: 'checked_in', label: 'Check In' },
          { value: 'cancelled', label: 'Cancel' },
          { value: 'no_show', label: 'No Show' }
        ];
      case 'checked_in':
        return [
          { value: 'in_progress', label: 'Start Appointment' }
        ];
      case 'in_progress':
        return [
          { value: 'completed', label: 'Complete' }
        ];
      default:
        return [];
    }
  };
  
  // Handle status change
  const handleStatusChange = (status: string) => {
    onStatusChange(appointment, status);
  };
  
  // Handle edit
  const handleEdit = () => {
    onEdit(appointment);
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="appointment-detail-dialog-title"
    >
      <DialogTitle id="appointment-detail-dialog-title">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Appointment Details</Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={getStatusLabel(appointment.status)}
            sx={{
              backgroundColor: getStatusColor(appointment.status),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              px: 1
            }}
          />
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit Appointment
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <PersonIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Patient</Typography>
                <Typography variant="body1">
                  {appointment.patient
                    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                    : 'Unknown Patient'}
                </Typography>
                {appointment.patient?.gender && (
                  <Typography variant="body2" color="text.secondary">
                    {appointment.patient.gender.charAt(0).toUpperCase() + appointment.patient.gender.slice(1)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          
          {/* Appointment Type */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Appointment Type</Typography>
              <Typography variant="body1">
                {getAppointmentTypeLabel(appointment.appointment_type)}
              </Typography>
            </Box>
          </Grid>
          
          {/* Date and Time */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <EventIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Date</Typography>
                <Typography variant="body1">
                  {formatDate(appointment.start_time)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <AccessTimeIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Time</Typography>
                <Typography variant="body1">
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {
                    Math.round(
                      (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000
                    )
                  } minutes
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* Reason and Notes */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <NotesIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Reason for Visit</Typography>
                <Typography variant="body1">
                  {appointment.reason || 'No reason provided'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {appointment.notes && (
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Notes</Typography>
                <Typography variant="body1">
                  {appointment.notes}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {/* Check-in and Check-out Times */}
          {appointment.check_in_time && (
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Check-in Time</Typography>
                <Typography variant="body1">
                  {formatTime(appointment.check_in_time)}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {appointment.check_out_time && (
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Check-out Time</Typography>
                <Typography variant="body1">
                  {formatTime(appointment.check_out_time)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Box>
          {getNextStatusOptions(appointment.status).map(option => (
            <Button
              key={option.value}
              variant="contained"
              color={option.value === 'cancelled' || option.value === 'no_show' ? 'error' : 'primary'}
              onClick={() => handleStatusChange(option.value)}
              sx={{ ml: 1 }}
            >
              {option.label}
            </Button>
          ))}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentDetail;
