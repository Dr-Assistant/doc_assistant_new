/**
 * Pre-Diagnosis Questionnaire Component
 * This component provides a form for collecting patient information before generating a pre-diagnosis summary
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Grid,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { QuestionnaireData } from '../../types/patient.types';

interface PreDiagnosisQuestionnaireProps {
  onSubmit: (data: QuestionnaireData) => void;
  loading?: boolean;
  disabled?: boolean;
}

const PreDiagnosisQuestionnaire: React.FC<PreDiagnosisQuestionnaireProps> = ({
  onSubmit,
  loading = false,
  disabled = false
}) => {
  const [formData, setFormData] = useState<QuestionnaireData>({
    chiefComplaint: '',
    duration: '',
    severity: '',
    associatedSymptoms: '',
    pastMedicalHistory: '',
    currentMedications: '',
    allergies: '',
    smokingStatus: '',
    familyHistory: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof QuestionnaireData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.chiefComplaint?.trim()) {
      newErrors.chiefComplaint = 'Chief complaint is required';
    }

    if (!formData.duration?.trim()) {
      newErrors.duration = 'Duration is required';
    }

    if (!formData.severity) {
      newErrors.severity = 'Severity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Filter out empty values
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value && value.trim()) {
        acc[key] = value.trim();
      }
      return acc;
    }, {} as QuestionnaireData);

    onSubmit(cleanedData);
  };

  const handleReset = () => {
    setFormData({
      chiefComplaint: '',
      duration: '',
      severity: '',
      associatedSymptoms: '',
      pastMedicalHistory: '',
      currentMedications: '',
      allergies: '',
      smokingStatus: '',
      familyHistory: ''
    });
    setErrors({});
  };

  const severityOptions = [
    { value: 'mild', label: 'Mild', color: 'success' as const },
    { value: 'moderate', label: 'Moderate', color: 'warning' as const },
    { value: 'severe', label: 'Severe', color: 'error' as const }
  ];

  const smokingOptions = [
    { value: 'never', label: 'Never' },
    { value: 'former', label: 'Former smoker' },
    { value: 'current', label: 'Current smoker' }
  ];

  return (
    <Card>
      <CardHeader
        avatar={<PsychologyIcon color="primary" />}
        title="Pre-Consultation Questionnaire"
        subheader="Please provide information about your current symptoms and medical history"
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Chief Complaint */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Chief Complaint *"
                placeholder="What is your main concern or symptom today?"
                value={formData.chiefComplaint}
                onChange={handleInputChange('chiefComplaint')}
                error={!!errors.chiefComplaint}
                helperText={errors.chiefComplaint || 'Describe your primary reason for seeking medical attention'}
                disabled={disabled || loading}
                multiline
                rows={2}
              />
            </Grid>

            {/* Duration and Severity */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration *"
                placeholder="e.g., 2 days, 1 week, 3 months"
                value={formData.duration}
                onChange={handleInputChange('duration')}
                error={!!errors.duration}
                helperText={errors.duration || 'How long have you had this symptom?'}
                disabled={disabled || loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" error={!!errors.severity}>
                <FormLabel component="legend">Severity *</FormLabel>
                <RadioGroup
                  row
                  value={formData.severity}
                  onChange={handleInputChange('severity')}
                >
                  {severityOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio disabled={disabled || loading} />}
                      label={
                        <Chip
                          label={option.label}
                          color={formData.severity === option.value ? option.color : 'default'}
                          variant={formData.severity === option.value ? 'filled' : 'outlined'}
                          size="small"
                        />
                      }
                    />
                  ))}
                </RadioGroup>
                {errors.severity && (
                  <Typography variant="caption" color="error">
                    {errors.severity}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Associated Symptoms */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Associated Symptoms"
                placeholder="Any other symptoms you're experiencing?"
                value={formData.associatedSymptoms}
                onChange={handleInputChange('associatedSymptoms')}
                disabled={disabled || loading}
                multiline
                rows={2}
                helperText="Describe any additional symptoms (nausea, fever, pain, etc.)"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Medical History
              </Typography>
            </Grid>

            {/* Past Medical History */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Past Medical History"
                placeholder="Previous diagnoses, surgeries, hospitalizations"
                value={formData.pastMedicalHistory}
                onChange={handleInputChange('pastMedicalHistory')}
                disabled={disabled || loading}
                multiline
                rows={2}
                helperText="List any significant medical conditions or procedures"
              />
            </Grid>

            {/* Current Medications */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Medications"
                placeholder="List all medications you're taking"
                value={formData.currentMedications}
                onChange={handleInputChange('currentMedications')}
                disabled={disabled || loading}
                multiline
                rows={3}
                helperText="Include prescription drugs, over-the-counter medications, and supplements"
              />
            </Grid>

            {/* Allergies */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Allergies"
                placeholder="Drug allergies, food allergies, environmental allergies"
                value={formData.allergies}
                onChange={handleInputChange('allergies')}
                disabled={disabled || loading}
                multiline
                rows={3}
                helperText="List any known allergies and reactions"
              />
            </Grid>

            {/* Smoking Status */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Smoking Status</FormLabel>
                <RadioGroup
                  value={formData.smokingStatus}
                  onChange={handleInputChange('smokingStatus')}
                >
                  {smokingOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio disabled={disabled || loading} />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Family History */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Family History"
                placeholder="Significant family medical history"
                value={formData.familyHistory}
                onChange={handleInputChange('familyHistory')}
                disabled={disabled || loading}
                multiline
                rows={3}
                helperText="Heart disease, diabetes, cancer, etc. in immediate family"
              />
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={disabled || loading}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  disabled={disabled || loading}
                >
                  {loading ? 'Generating Summary...' : 'Generate Pre-Diagnosis Summary'}
                </Button>
              </Box>
            </Grid>

            {/* Information Alert */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Privacy Notice:</strong> This information will be used to generate an AI-powered 
                  pre-diagnosis summary to assist your healthcare provider. All data is encrypted and 
                  handled according to HIPAA guidelines.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default PreDiagnosisQuestionnaire;
