/**
 * Patient Form Page
 * This page provides a form for creating or editing a patient
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Breadcrumbs,
  Link,
  Button,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import patientService from '../../services/patient.service';
import { Patient, PatientFormData } from '../../types/patient.types';

const PatientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Default form data
  const defaultFormData: PatientFormData = {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    status: 'active',
    allergies: []
  };

  // State for form data
  const [formData, setFormData] = useState<PatientFormData>(defaultFormData);

  // State for loading
  const [loading, setLoading] = useState<boolean>(isEditMode);

  // State for submitting
  const [submitting, setSubmitting] = useState<boolean>(false);

  // State for error
  const [error, setError] = useState<string | null>(null);

  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch patient data if in edit mode
  const fetchPatient = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await patientService.getPatientById(id);

      // Convert patient data to form data
      const patientFormData: PatientFormData = {
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        mrn: data.mrn,
        abha_id: data.abha_id,
        phone: data.phone,
        email: data.email,
        address: data.address,
        emergency_contact: data.emergency_contact,
        blood_group: data.blood_group,
        allergies: data.allergies,
        status: data.status
      };

      setFormData(patientFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  // Handle select change
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle allergies change
  const handleAllergiesChange = (e: SelectChangeEvent<string[]>) => {
    const { value } = e.target;

    setFormData({
      ...formData,
      allergies: typeof value === 'string' ? value.split(',') : value
    });
  };

  // Handle address change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name.split('.')[1]; // Extract field name after 'address.'

    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [field]: value
      } as any
    });
  };

  // Handle emergency contact change
  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name.split('.')[1]; // Extract field name after 'emergency_contact.'

    setFormData({
      ...formData,
      emergency_contact: {
        ...formData.emergency_contact,
        [field]: value
      } as any
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      // Check if date is valid and not in the future
      const dob = new Date(formData.date_of_birth);
      const today = new Date();

      if (isNaN(dob.getTime())) {
        errors.date_of_birth = 'Invalid date';
      } else if (dob > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    // Phone validation
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number';
    }

    // ABHA ID validation (if provided)
    if (formData.abha_id && !/^(\d{14}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(formData.abha_id)) {
      errors.abha_id = 'Invalid ABHA ID format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let result: Patient;

      if (isEditMode && id) {
        // Update existing patient
        result = await patientService.updatePatient(id, formData);
        navigate(`/patients/${id}?success=${encodeURIComponent('Patient updated successfully')}`);
      } else {
        // Create new patient
        result = await patientService.createPatient(formData);
        navigate(`/patients/${result.id}?success=${encodeURIComponent('Patient created successfully')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(`/patients/${id}`);
    } else {
      navigate('/patients');
    }
  };

  // Fetch patient on mount if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchPatient();
    }
  }, [id, isEditMode, fetchPatient]);

  // If loading in edit mode
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

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
          <Link
            component={RouterLink}
            to="/patients"
            color="inherit"
          >
            Patients
          </Link>
          <Typography color="text.primary">
            {isEditMode ? `Edit ${formData.first_name} ${formData.last_name}` : 'New Patient'}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Patient' : 'New Patient'}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" component="h2" gutterBottom>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                error={!!validationErrors.first_name}
                helperText={validationErrors.first_name}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                error={!!validationErrors.last_name}
                helperText={validationErrors.last_name}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                error={!!validationErrors.date_of_birth}
                helperText={validationErrors.date_of_birth}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={formData.gender}
                  onChange={handleSelectChange}
                  label="Gender"
                  required
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Blood Group"
                name="blood_group"
                value={formData.blood_group || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Status"
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="deceased">Deceased</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="allergies-label">Allergies</InputLabel>
                <Select
                  labelId="allergies-label"
                  multiple
                  value={formData.allergies || []}
                  onChange={handleAllergiesChange}
                  input={<OutlinedInput label="Allergies" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {['Penicillin', 'Sulfa Drugs', 'Aspirin', 'Ibuprofen', 'Latex', 'Peanuts', 'Shellfish', 'Eggs', 'Milk', 'Soy'].map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Additional fields for address, emergency contact, etc. would go here */}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" component="h2" gutterBottom>
                Medical Identifiers
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Medical Record Number (MRN)"
                name="mrn"
                value={formData.mrn || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ABHA ID"
                name="abha_id"
                value={formData.abha_id || ''}
                onChange={handleInputChange}
                error={!!validationErrors.abha_id}
                helperText={validationErrors.abha_id}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isEditMode ? 'Update Patient' : 'Create Patient'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default PatientFormPage;
