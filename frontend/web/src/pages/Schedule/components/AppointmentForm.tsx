/**
 * Appointment Form Component
 * This component provides a form for creating or editing an appointment
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  FormHelperText,
  CircularProgress,
  Autocomplete,
  SelectChangeEvent
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { format, addMinutes, parseISO, isAfter } from 'date-fns';
import {
  Appointment,
  AppointmentFormData,
  AppointmentType,
  AppointmentStatus,
  APPOINTMENT_TYPE_INFO,
  APPOINTMENT_STATUS_INFO
} from '../../../types/schedule.types';
import { useAuth } from '../../../contexts/AuthContext';
import patientService from '../../../services/patient.service';
import { Patient } from '../../../types/patient.types';

interface AppointmentFormProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onSave: (appointmentData: AppointmentFormData) => void;
  loading: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  open,
  onClose,
  onSave,
  loading
}) => {
  // Get current user from auth context
  const { user } = useAuth();

  // Default form data
  const defaultFormData: AppointmentFormData = {
    doctor_id: user?.id || '', // Use current user's ID as doctor ID
    patient_id: '',
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(addMinutes(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
    appointment_type: 'in_person',
    status: 'scheduled',
    reason: '',
    notes: ''
  };

  // State for form data
  const [formData, setFormData] = useState<AppointmentFormData>(defaultFormData);

  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for patients
  const [patients, setPatients] = useState<Patient[]>([]);

  // State for patients loading
  const [patientsLoading, setPatientsLoading] = useState<boolean>(false);

  // State for selected patient
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients
  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const response = await patientService.getAllPatients({ limit: 100 }); // Get first 100 patients
      setPatients(response.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setPatientsLoading(false);
    }
  };

  // Fetch patients when component opens
  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open]);

  // Update form data when appointment changes
  useEffect(() => {
    if (appointment) {
      setFormData({
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        start_time: format(parseISO(appointment.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(parseISO(appointment.end_time), "yyyy-MM-dd'T'HH:mm"),
        appointment_type: appointment.appointment_type,
        status: appointment.status,
        reason: appointment.reason || '',
        notes: appointment.notes || ''
      });

      // Set selected patient
      if (appointment.patient_id) {
        // Find patient in the patients list
        const patient = patients.find(p => p.id === appointment.patient_id);
        if (patient) {
          setSelectedPatient(patient);
        }
      }
    } else {
      setFormData(defaultFormData);
      setSelectedPatient(null);
    }

    // Clear errors
    setErrors({});
  }, [appointment, open, patients]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle select change
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;

    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });

      // Clear error for this field
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: ''
        });
      }
    }
  };

  // Handle appointment type change
  const handleAppointmentTypeChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;

    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });

      // Clear error for this field
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: ''
        });
      }
    }
  };

  // Handle status change
  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;

    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });

      // Clear error for this field
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: ''
        });
      }
    }
  };

  // Handle patient selection
  const handlePatientChange = (event: React.SyntheticEvent, value: Patient | null) => {
    setSelectedPatient(value);

    setFormData({
      ...formData,
      patient_id: value?.id || ''
    });

    // Clear error for this field
    if (errors.patient_id) {
      setErrors({
        ...errors,
        patient_id: ''
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.patient_id) {
      newErrors.patient_id = 'Patient is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (!formData.appointment_type) {
      newErrors.appointment_type = 'Appointment type is required';
    }

    // Validate end time is after start time
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);

      if (!isAfter(endTime, startTime)) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="appointment-form-dialog-title"
    >
      <DialogTitle id="appointment-form-dialog-title">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {appointment ? 'Edit Appointment' : 'New Appointment'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Patient */}
            <Grid item xs={12}>
              <Autocomplete
                id="patient-select"
                options={patients}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                value={selectedPatient}
                onChange={handlePatientChange}
                loading={patientsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Patient"
                    required
                    error={!!errors.patient_id}
                    helperText={errors.patient_id}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {patientsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Appointment Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.appointment_type}>
                <InputLabel id="appointment-type-label">Appointment Type *</InputLabel>
                <Select
                  labelId="appointment-type-label"
                  id="appointment-type"
                  name="appointment_type"
                  value={formData.appointment_type}
                  onChange={handleAppointmentTypeChange}
                  label="Appointment Type *"
                  required
                >
                  {Object.entries(APPOINTMENT_TYPE_INFO).map(([value, { label }]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.appointment_type && (
                  <FormHelperText>{errors.appointment_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  label="Status"
                >
                  {Object.entries(APPOINTMENT_STATUS_INFO).map(([value, { label }]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="start-time"
                name="start_time"
                label="Start Time"
                type="datetime-local"
                value={formData.start_time}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
                error={!!errors.start_time}
                helperText={errors.start_time}
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="end-time"
                name="end_time"
                label="End Time"
                type="datetime-local"
                value={formData.end_time}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
                error={!!errors.end_time}
                helperText={errors.end_time}
              />
            </Grid>

            {/* Reason */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="reason"
                name="reason"
                label="Reason for Visit"
                value={formData.reason}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AppointmentForm;
