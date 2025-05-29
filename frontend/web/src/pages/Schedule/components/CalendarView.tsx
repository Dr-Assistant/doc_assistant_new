/**
 * Calendar View Component
 * This component displays appointments in a calendar view
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Grid,
  Divider,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon
} from '@mui/icons-material';
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay, parseISO } from 'date-fns';
import { Appointment, CalendarViewType, APPOINTMENT_STATUS_INFO } from '../../../types/schedule.types';

interface CalendarViewProps {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  loading,
  error,
  onDateRangeChange,
  onAppointmentClick
}) => {
  // State for current view (day or week)
  const [viewType, setViewType] = useState<CalendarViewType>({
    type: 'week',
    date: new Date()
  });
  
  // State for days to display
  const [days, setDays] = useState<Date[]>([]);
  
  // Calculate days to display based on view type
  useEffect(() => {
    let daysToDisplay: Date[] = [];
    
    if (viewType.type === 'day') {
      daysToDisplay = [viewType.date];
    } else if (viewType.type === 'week') {
      const start = startOfWeek(viewType.date, { weekStartsOn: 1 }); // Start on Monday
      daysToDisplay = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    
    setDays(daysToDisplay);
    
    // Notify parent of date range change
    const startDate = format(daysToDisplay[0], 'yyyy-MM-dd');
    const endDate = format(daysToDisplay[daysToDisplay.length - 1], 'yyyy-MM-dd');
    onDateRangeChange(startDate, endDate);
  }, [viewType, onDateRangeChange]);
  
  // Handle view type change
  const handleViewTypeChange = (type: 'day' | 'week') => {
    setViewType({
      ...viewType,
      type
    });
  };
  
  // Handle navigation (prev, next, today)
  const handlePrev = () => {
    const daysToSubtract = viewType.type === 'day' ? 1 : 7;
    setViewType({
      ...viewType,
      date: addDays(viewType.date, -daysToSubtract)
    });
  };
  
  const handleNext = () => {
    const daysToAdd = viewType.type === 'day' ? 1 : 7;
    setViewType({
      ...viewType,
      date: addDays(viewType.date, daysToAdd)
    });
  };
  
  const handleToday = () => {
    setViewType({
      ...viewType,
      date: new Date()
    });
  };
  
  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date): Appointment[] => {
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.start_time);
      return isSameDay(appointmentDate, day);
    });
  };
  
  // Format time from ISO string
  const formatTime = (isoString: string): string => {
    return format(parseISO(isoString), 'h:mm a');
  };
  
  // Render calendar header
  const renderCalendarHeader = () => {
    const dateFormat = viewType.type === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy';
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            {format(viewType.date, dateFormat)}
          </Typography>
          <Box sx={{ display: 'flex', ml: 2 }}>
            <IconButton onClick={handlePrev} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={handleNext} size="small">
              <ChevronRightIcon />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={handleToday}
              sx={{ ml: 1 }}
            >
              Today
            </Button>
          </Box>
        </Box>
        <Box>
          <Button
            variant={viewType.type === 'day' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ViewDayIcon />}
            onClick={() => handleViewTypeChange('day')}
            sx={{ mr: 1 }}
          >
            Day
          </Button>
          <Button
            variant={viewType.type === 'week' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ViewWeekIcon />}
            onClick={() => handleViewTypeChange('week')}
          >
            Week
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render day column
  const renderDayColumn = (day: Date) => {
    const dayAppointments = getAppointmentsForDay(day);
    const isCurrentDay = isToday(day);
    
    return (
      <Grid item xs={viewType.type === 'day' ? 12 : true} key={day.toISOString()}>
        <Paper
          elevation={isCurrentDay ? 3 : 1}
          sx={{
            height: '100%',
            p: 1,
            border: isCurrentDay ? '1px solid' : 'none',
            borderColor: 'primary.main',
            backgroundColor: isCurrentDay ? 'rgba(0, 85, 255, 0.05)' : 'background.paper'
          }}
        >
          <Typography
            variant="subtitle1"
            align="center"
            sx={{
              fontWeight: isCurrentDay ? 'bold' : 'normal',
              color: isCurrentDay ? 'primary.main' : 'text.primary',
              mb: 1
            }}
          >
            {format(day, 'EEE, MMM d')}
          </Typography>
          <Divider sx={{ mb: 1 }} />
          
          {dayAppointments.length === 0 ? (
            <Typography variant="body2" align="center" color="text.secondary" sx={{ py: 2 }}>
              No appointments
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dayAppointments.map(appointment => (
                <Paper
                  key={appointment.id}
                  elevation={0}
                  sx={{
                    p: 1,
                    borderLeft: '4px solid',
                    borderColor: APPOINTMENT_STATUS_INFO[appointment.status].color,
                    backgroundColor: 'background.default',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </Typography>
                    <Tooltip title={APPOINTMENT_STATUS_INFO[appointment.status].label}>
                      <Chip
                        label={appointment.status}
                        size="small"
                        sx={{
                          backgroundColor: APPOINTMENT_STATUS_INFO[appointment.status].color,
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" noWrap>
                    {appointment.patient?.first_name} {appointment.patient?.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {appointment.reason || appointment.appointment_type}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      </Grid>
    );
  };
  
  // If loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If error
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {renderCalendarHeader()}
      <Grid container spacing={2} sx={{ height: viewType.type === 'day' ? 'auto' : 'calc(100vh - 250px)' }}>
        {days.map(day => renderDayColumn(day))}
      </Grid>
    </Box>
  );
};

export default CalendarView;
