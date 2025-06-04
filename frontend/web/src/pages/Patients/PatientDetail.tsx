/**
 * Patient Detail Page
 * This page displays detailed information about a patient
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
  Snackbar,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import PatientCard from './components/PatientCard';
import MedicalHistoryForm from './components/MedicalHistoryForm';
import { ConsentManagement } from '../../components/consent';
import PreDiagnosisSummaryList from '../../components/patient/PreDiagnosisSummaryList';
import patientService from '../../services/patient.service';
import { Patient, MedicalHistory, PreDiagnosisSummary } from '../../types/patient.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for patient data
  const [patient, setPatient] = useState<Patient | null>(null);

  // State for medical history
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null);

  // State for loading
  const [loading, setLoading] = useState<boolean>(true);

  // State for medical history loading
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState<boolean>(false);

  // State for error
  const [error, setError] = useState<string | null>(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState<number>(0);

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

  // Fetch patient data
  const fetchPatient = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await patientService.getPatientById(id);
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient');
    } finally {
      setLoading(false);
    }
  };

  // Fetch medical history
  const fetchMedicalHistory = async () => {
    if (!id) return;

    try {
      const data = await patientService.getPatientMedicalHistory(id);
      setMedicalHistory(data);
    } catch (err) {
      console.error('Failed to fetch medical history:', err);
      // Create empty medical history if not found
      setMedicalHistory({
        patientId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle back button
  const handleBack = () => {
    navigate('/patients');
  };

  // Handle save medical history
  const handleSaveMedicalHistory = async (updatedMedicalHistory: MedicalHistory) => {
    if (!id) return;

    setMedicalHistoryLoading(true);

    try {
      const data = await patientService.updatePatientMedicalHistory(id, updatedMedicalHistory);
      setMedicalHistory(data);

      setSnackbar({
        open: true,
        message: 'Medical history updated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update medical history',
        severity: 'error'
      });
    } finally {
      setMedicalHistoryLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Fetch patient on mount
  useEffect(() => {
    fetchPatient();
    fetchMedicalHistory();
  }, [id]);

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

  // If loading
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // If error
  if (error || !patient) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Patient not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Patients
        </Button>
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
            {`${patient.first_name} ${patient.last_name}`}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Patient Details
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="patient tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<MedicalServicesIcon />} label="Medical History" />
          <Tab icon={<PsychologyIcon />} label="Pre-Diagnosis" />
          <Tab icon={<EventIcon />} label="Appointments" />
          <Tab icon={<DescriptionIcon />} label="Documents" />
          <Tab icon={<SecurityIcon />} label="ABDM Consent" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <PatientCard patient={patient} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {medicalHistory ? (
            <MedicalHistoryForm
              medicalHistory={medicalHistory}
              onSave={handleSaveMedicalHistory}
              loading={medicalHistoryLoading}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Pre-Diagnosis Summaries</Typography>
              <Button
                variant="contained"
                startIcon={<PsychologyIcon />}
                onClick={() => navigate(`/patients/${patient.id}/pre-diagnosis`)}
              >
                Generate New Summary
              </Button>
            </Box>
            <PreDiagnosisSummaryList
              patientId={patient.id}
              maxItems={5}
              onSummaryClick={(summary: PreDiagnosisSummary) =>
                navigate(`/patients/${patient.id}/pre-diagnosis`, { state: { summaryId: summary.id } })
              }
              title="Recent Summaries"
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="body1">
            Appointments feature will be implemented in a future update.
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Typography variant="body1">
            Documents feature will be implemented in a future update.
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <ConsentManagement
            patientId={patient.id}
            showCreateButton={true}
          />
        </TabPanel>
      </Paper>

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

export default PatientDetailPage;
