/**
 * Patients Page
 * This page displays a list of patients with search and filtering
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Home as HomeIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PatientList from './components/PatientList';
import PatientSearch from './components/PatientSearch';
import patientService from '../../services/patient.service';
import { PatientListResponse, PatientSearchParams } from '../../types/patient.types';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State for patients data
  const [patientsData, setPatientsData] = useState<PatientListResponse | null>(null);
  
  // State for loading
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for error
  const [error, setError] = useState<string | null>(null);
  
  // State for search params
  const [searchParams, setSearchParams] = useState<PatientSearchParams>({
    page: 1,
    limit: 10
  });
  
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
  
  // Fetch patients data
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await patientService.getAllPatients(searchParams);
      setPatientsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = (params: PatientSearchParams) => {
    setSearchParams({
      ...searchParams,
      ...params,
      page: 1 // Reset to first page on new search
    });
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setSearchParams({
      ...searchParams,
      page
    });
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (rowsPerPage: number) => {
    setSearchParams({
      ...searchParams,
      limit: rowsPerPage
    });
  };
  
  // Handle add patient
  const handleAddPatient = () => {
    navigate('/patients/new');
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // Fetch patients on mount and when search params change
  useEffect(() => {
    fetchPatients();
  }, [searchParams]);
  
  // Check for success message in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    
    if (successMessage) {
      setSnackbar({
        open: true,
        message: decodeURIComponent(successMessage),
        severity: 'success'
      });
      
      // Remove success message from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
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
            <Typography color="text.primary">Patients</Typography>
          </Breadcrumbs>
          <Typography variant="h4" component="h1" sx={{ mt: 1 }}>
            Patients
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPatient}
        >
          Add Patient
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <PatientSearch
          onSearch={handleSearch}
          initialParams={searchParams}
        />
      </Paper>
      
      <PatientList
        data={patientsData}
        loading={loading}
        error={error}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      
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

export default PatientsPage;
