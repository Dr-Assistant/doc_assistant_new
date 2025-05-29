/**
 * Appointment List Component
 * This component displays a list of appointments with pagination and filtering
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  Appointment,
  AppointmentListResponse,
  APPOINTMENT_STATUS_INFO,
  APPOINTMENT_TYPE_INFO
} from '../../../types/schedule.types';

interface AppointmentListProps {
  data: AppointmentListResponse | null;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onViewAppointment: (appointment: Appointment) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  onUpdateStatus: (appointment: Appointment, status: string) => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  data,
  loading,
  error,
  onPageChange,
  onRowsPerPageChange,
  onViewAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onUpdateStatus
}) => {
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1); // API uses 1-based indexing
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(1); // Reset to first page
  };
  
  // Format date
  const formatDate = (isoString: string): string => {
    return format(parseISO(isoString), 'MMM d, yyyy');
  };
  
  // Format time
  const formatTime = (isoString: string): string => {
    return format(parseISO(isoString), 'h:mm a');
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    return APPOINTMENT_STATUS_INFO[status as keyof typeof APPOINTMENT_STATUS_INFO]?.color || '#9E9E9E';
  };
  
  // Get appointment type label
  const getAppointmentTypeLabel = (type: string): string => {
    return APPOINTMENT_TYPE_INFO[type as keyof typeof APPOINTMENT_TYPE_INFO]?.label || type;
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
  
  // If no data
  if (!data || data.appointments.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No appointments found.</Typography>
      </Box>
    );
  }
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="appointments table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.appointments.map((appointment: Appointment) => (
              <TableRow
                key={appointment.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>{formatDate(appointment.start_time)}</TableCell>
                <TableCell>
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </TableCell>
                <TableCell>
                  {appointment.patient ? (
                    `${appointment.patient.first_name} ${appointment.patient.last_name}`
                  ) : (
                    'Unknown Patient'
                  )}
                </TableCell>
                <TableCell>{getAppointmentTypeLabel(appointment.appointment_type)}</TableCell>
                <TableCell>{appointment.reason || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={APPOINTMENT_STATUS_INFO[appointment.status].label}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(appointment.status),
                      color: 'white'
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {/* Status update actions */}
                    {appointment.status === 'scheduled' && (
                      <Tooltip title="Check In">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onUpdateStatus(appointment, 'checked_in')}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                      <Tooltip title="Cancel">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onUpdateStatus(appointment, 'cancelled')}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* View action */}
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => onViewAppointment(appointment)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {/* Edit action */}
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEditAppointment(appointment)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {/* Delete action */}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteAppointment(appointment)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.pagination.total}
        rowsPerPage={data.pagination.limit}
        page={data.pagination.page - 1} // API uses 1-based indexing
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default AppointmentList;
