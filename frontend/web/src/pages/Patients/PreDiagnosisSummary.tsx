/**
 * Pre-Diagnosis Summary Page
 * This page handles the complete pre-diagnosis workflow including questionnaire and summary generation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import PreDiagnosisQuestionnaire from '../../components/patient/PreDiagnosisQuestionnaire';
import PreDiagnosisSummaryCard from '../../components/patient/PreDiagnosisSummaryCard';
import patientService from '../../services/patient.service';
import preDiagnosisService from '../../services/preDiagnosis.service';
import {
  Patient,
  QuestionnaireData,
  PreDiagnosisSummary,
  PreDiagnosisGenerateRequest
} from '../../types/patient.types';

const steps = ['Patient Information', 'Questionnaire', 'AI Analysis', 'Summary'];

const PreDiagnosisSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State management
  const [patient, setPatient] = useState<Patient | null>(null);
  const [summary, setSummary] = useState<PreDiagnosisSummary | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    setPatientLoading(true);
    setError(null);

    try {
      const data = await patientService.getPatientById(id);
      setPatient(data);
      setActiveStep(1); // Move to questionnaire step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient');
    } finally {
      setPatientLoading(false);
    }
  };

  // Handle questionnaire submission
  const handleQuestionnaireSubmit = async (questionnaireData: QuestionnaireData) => {
    if (!patient) return;

    setLoading(true);
    setActiveStep(2); // Move to AI analysis step

    try {
      const request: PreDiagnosisGenerateRequest = {
        patientId: patient.id,
        questionnaireData,
        priority: 'medium' // Default priority
      };

      const generatedSummary = await preDiagnosisService.generateSummary(request);
      setSummary(generatedSummary);
      setActiveStep(3); // Move to summary step

      setSnackbar({
        open: true,
        message: 'Pre-diagnosis summary generated successfully!',
        severity: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      setActiveStep(1); // Go back to questionnaire
      
      setSnackbar({
        open: true,
        message: 'Failed to generate summary. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle summary refresh
  const handleSummaryRefresh = async () => {
    if (!summary) return;

    setLoading(true);
    try {
      const refreshedSummary = await preDiagnosisService.getSummaryById(summary.id);
      setSummary(refreshedSummary);
      
      setSnackbar({
        open: true,
        message: 'Summary refreshed successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh summary.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle summary download
  const handleSummaryDownload = () => {
    if (!summary || !patient) return;

    const summaryText = `
Pre-Diagnosis Summary for ${patient.first_name} ${patient.last_name}
Generated: ${new Date(summary.createdAt).toLocaleString()}
Status: ${summary.status}
Priority: ${summary.priority}

${summary.aiSummary ? `
AI Analysis:
Urgency Level: ${summary.aiSummary.urgencyLevel}
Confidence Score: ${Math.round(summary.aiSummary.confidenceScore * 100)}%

Key Findings:
${summary.aiSummary.keyFindings.map(finding => `• ${finding}`).join('\n')}

Risk Factors:
${summary.aiSummary.riskFactors.map(risk => `• ${risk}`).join('\n')}

Recommendations:
${summary.aiSummary.recommendations.map(rec => `• ${rec}`).join('\n')}
` : 'AI analysis not available'}
    `;

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-diagnosis-summary-${patient.first_name}-${patient.last_name}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/patients/${id}`);
  };

  // Handle restart process
  const handleRestart = () => {
    setSummary(null);
    setActiveStep(1);
    setError(null);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch patient on mount
  useEffect(() => {
    fetchPatient();
  }, [id]);

  // Loading state
  if (patientLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Error state
  if (error && !patient) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Patient
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
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
          <Link component={RouterLink} to="/patients" color="inherit">
            Patients
          </Link>
          {patient && (
            <Link
              component={RouterLink}
              to={`/patients/${patient.id}`}
              color="inherit"
            >
              {`${patient.first_name} ${patient.last_name}`}
            </Link>
          )}
          <Typography color="text.primary">Pre-Diagnosis Summary</Typography>
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
          <PsychologyIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h4" component="h1">
            Pre-Diagnosis Summary
          </Typography>
        </Box>
      </Box>

      {/* Patient Info */}
      {patient && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patient: {patient.first_name} {patient.last_name}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Age: {patient.date_of_birth ? 
                  Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
                  : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Gender: {patient.gender}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                MRN: {patient.mrn || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Blood Group: {patient.blood_group || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Content based on active step */}
      {activeStep === 1 && (
        <PreDiagnosisQuestionnaire
          onSubmit={handleQuestionnaireSubmit}
          loading={loading}
        />
      )}

      {activeStep === 2 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generating AI-Powered Pre-Diagnosis Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyzing patient data and questionnaire responses...
          </Typography>
        </Paper>
      )}

      {activeStep === 3 && summary && (
        <Box>
          <PreDiagnosisSummaryCard
            summary={summary}
            onRefresh={handleSummaryRefresh}
            onDownload={handleSummaryDownload}
            loading={loading}
          />
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleRestart}
            >
              Generate New Summary
            </Button>
            <Button
              variant="contained"
              onClick={handleBack}
            >
              Return to Patient
            </Button>
          </Box>
        </Box>
      )}

      {/* Error Alert */}
      {error && activeStep !== 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Snackbar */}
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

export default PreDiagnosisSummaryPage;
