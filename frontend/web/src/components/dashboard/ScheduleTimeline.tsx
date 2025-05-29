/**
 * Schedule Timeline Component
 * Displays today's appointments in a timeline format
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Button,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns';
import type { Appointment } from '../../services/dashboard.service';
import type { AppointmentStatus } from '../../types/dashboard.types';

interface ScheduleTimelineProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onStatusChange?: (appointmentId: string, status: AppointmentStatus) => void;
  loading?: boolean;
}

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  appointments,
  onAppointmentClick,
  onStatusChange,
  loading = false
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAppointment(null);
  };

  const handleStatusChange = (status: AppointmentStatus) => {
    if (selectedAppointment && onStatusChange) {
      onStatusChange(selectedAppointment.id, status);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'booked': return 'default';
      case 'confirmed': return 'info';
      case 'checked-in': return 'warning';
      case 'in-progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'booked': return <ScheduleIcon fontSize="small" />;
      case 'confirmed': return <CheckCircleIcon fontSize="small" />;
      case 'checked-in': return <AccessTimeIcon fontSize="small" />;
      case 'in-progress': return <PlayArrowIcon fontSize="small" />;
      case 'completed': return <CheckCircleIcon fontSize="small" />;
      case 'cancelled': return <WarningIcon fontSize="small" />;
      default: return <ScheduleIcon fontSize="small" />;
    }
  };

  const getCurrentTime = () => {
    return new Date();
  };

  const isCurrentAppointment = (appointment: Appointment) => {
    const now = getCurrentTime();
    const appointmentTime = parseISO(`${format(now, 'yyyy-MM-dd')}T${appointment.time}:00`);
    const appointmentEnd = addMinutes(appointmentTime, appointment.duration);

    return isAfter(now, appointmentTime) && isBefore(now, appointmentEnd);
  };

  const isUpcoming = (appointment: Appointment) => {
    const now = getCurrentTime();
    const appointmentTime = parseISO(`${format(now, 'yyyy-MM-dd')}T${appointment.time}:00`);

    return isAfter(appointmentTime, now);
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  if (loading) {
    return (
      <Card>
        <CardHeader title="Today's Schedule" />
        <CardContent>
          <Typography color="textSecondary">Loading schedule...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Today's Schedule"
        subheader={`${appointments.length} appointments scheduled`}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<ScheduleIcon />}
          >
            View Full Schedule
          </Button>
        }
      />
      <CardContent>
        {sortedAppointments.length === 0 ? (
          <Box textAlign="center" py={4}>
            <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No appointments scheduled for today
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Enjoy your free day!
            </Typography>
          </Box>
        ) : (
          <Box>
            {sortedAppointments.map((appointment, index) => (
              <Box key={appointment.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: isCurrentAppointment(appointment)
                      ? 'primary.50'
                      : 'transparent',
                    border: isCurrentAppointment(appointment)
                      ? '2px solid'
                      : '1px solid transparent',
                    borderColor: isCurrentAppointment(appointment)
                      ? 'primary.main'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: 'grey.50'
                    }
                  }}
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  {/* Time */}
                  <Box sx={{ minWidth: 80, mr: 2 }}>
                    <Typography variant="h6" color="primary">
                      {appointment.time}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {appointment.duration}min
                    </Typography>
                  </Box>

                  {/* Patient Info */}
                  <Box sx={{ flexGrow: 1, mr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {appointment.patientName}
                          {appointment.isUrgent && (
                            <Tooltip title="Urgent appointment">
                              <WarningIcon
                                sx={{ ml: 1, fontSize: 16, color: 'error.main' }}
                              />
                            </Tooltip>
                          )}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {appointment.type}
                          {appointment.patientAge && ` • Age ${appointment.patientAge}`}
                        </Typography>
                      </Box>
                    </Box>
                    {appointment.notes && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                        {appointment.notes}
                      </Typography>
                    )}
                  </Box>

                  {/* Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={getStatusIcon(appointment.status)}
                      label={appointment.status.replace('_', ' ').replace('-', ' ')}
                      color={getStatusColor(appointment.status)}
                      size="small"
                      variant={isCurrentAppointment(appointment) ? 'filled' : 'outlined'}
                    />

                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, appointment)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                {index < sortedAppointments.length - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleStatusChange('confirmed')}>
            Mark as Confirmed
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('checked-in')}>
            Check In Patient
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('in-progress')}>
            Start Consultation
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('completed')}>
            Mark as Completed
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleStatusChange('cancelled')}>
            Cancel Appointment
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default ScheduleTimeline;
