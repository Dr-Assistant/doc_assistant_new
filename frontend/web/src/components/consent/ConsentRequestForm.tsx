/**
 * Consent Request Form Component
 * Form for requesting patient consent for ABDM health record access
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  Button,
  Alert,
  Grid,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
// Using HTML date inputs instead of MUI X Date Pickers for compatibility
import {
  ConsentRequestData,
  ConsentFormState,
  HEALTH_INFO_TYPES,
  CONSENT_PURPOSES,
  HealthInfoType
} from '../../types/consent.types';
import consentService from '../../services/consent.service';

interface ConsentRequestFormProps {
  patientId: string;
  patientAbhaId?: string;
  onSuccess?: (consentRequest: any) => void;
  onCancel?: () => void;
}

const ConsentRequestForm: React.FC<ConsentRequestFormProps> = ({
  patientId,
  patientAbhaId = '',
  onSuccess,
  onCancel
}) => {
  const [formState, setFormState] = useState<ConsentFormState>({
    data: {
      patientId,
      patientAbhaId,
      purpose: CONSENT_PURPOSES[0],
      hiTypes: [],
      dateRange: {
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      expiry: consentService.getDefaultExpiryDate(),
      hips: []
    },
    errors: {},
    loading: false,
    submitted: false
  });

  const [selectedHiTypes, setSelectedHiTypes] = useState<string[]>([]);

  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        patientId,
        patientAbhaId
      }
    }));
  }, [patientId, patientAbhaId]);

  const validateForm = (): boolean => {
    const errors: any = {};
    const { data } = formState;

    // Validate ABHA ID
    if (!data.patientAbhaId) {
      errors.patientAbhaId = 'ABHA ID is required';
    } else if (!consentService.validateAbhaId(data.patientAbhaId)) {
      errors.patientAbhaId = 'Invalid ABHA ID format';
    }

    // Validate purpose
    if (!data.purpose?.code) {
      errors.purpose = 'Purpose is required';
    }

    // Validate health info types
    if (!selectedHiTypes.length) {
      errors.hiTypes = 'At least one health information type must be selected';
    }

    // Validate date range
    if (!data.dateRange?.from) {
      errors.dateRange = { ...errors.dateRange, from: 'From date is required' };
    }
    if (!data.dateRange?.to) {
      errors.dateRange = { ...errors.dateRange, to: 'To date is required' };
    }
    if (data.dateRange?.from && data.dateRange?.to) {
      const fromDate = new Date(data.dateRange.from);
      const toDate = new Date(data.dateRange.to);
      if (fromDate > toDate) {
        errors.dateRange = { ...errors.dateRange, to: 'To date must be after from date' };
      }
    }

    // Validate expiry
    if (!data.expiry) {
      errors.expiry = 'Expiry date is required';
    } else {
      const expiryDate = new Date(data.expiry);
      const now = new Date();
      if (expiryDate <= now) {
        errors.expiry = 'Expiry date must be in the future';
      }
    }

    setFormState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      setFormState(prev => ({ ...prev, submitted: true }));
      return;
    }

    setFormState(prev => ({ ...prev, loading: true, errors: {} }));

    try {
      const requestData: ConsentRequestData = {
        ...formState.data,
        hiTypes: selectedHiTypes
      } as ConsentRequestData;

      const result = await consentService.requestConsent(requestData);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error: any) {
      setFormState(prev => ({
        ...prev,
        errors: { general: error.message }
      }));
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      },
      errors: {
        ...prev.errors,
        [field]: undefined
      }
    }));
  };

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        dateRange: {
          ...prev.data.dateRange!,
          [field]: value
        }
      },
      errors: {
        ...prev.errors,
        dateRange: {
          ...prev.errors.dateRange,
          [field]: undefined
        }
      }
    }));
  };

  const handleHiTypeChange = (hiType: string, checked: boolean) => {
    const newSelectedTypes = checked
      ? [...selectedHiTypes, hiType]
      : selectedHiTypes.filter(type => type !== hiType);

    setSelectedHiTypes(newSelectedTypes);
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        hiTypes: undefined
      }
    }));
  };

  const { data, errors, loading, submitted } = formState;

  return (
    <Card>
        <CardHeader
          title="Request Patient Consent"
          subheader="Request consent to access patient's health records from ABDM"
        />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {errors.general && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.general}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* ABHA ID */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Patient ABHA ID"
                  value={data.patientAbhaId || ''}
                  onChange={(e) => handleInputChange('patientAbhaId', e.target.value)}
                  error={submitted && !!errors.patientAbhaId}
                  helperText={submitted && errors.patientAbhaId}
                  placeholder="14-digit number or username@abdm"
                  required
                />
              </Grid>

              {/* Purpose */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={submitted && !!errors.purpose}>
                  <InputLabel>Purpose</InputLabel>
                  <Select
                    value={data.purpose?.code || ''}
                    onChange={(e) => {
                      const purpose = CONSENT_PURPOSES.find(p => p.code === e.target.value);
                      handleInputChange('purpose', purpose);
                    }}
                    label="Purpose"
                    required
                  >
                    {CONSENT_PURPOSES.map((purpose) => (
                      <MenuItem key={purpose.code} value={purpose.code}>
                        {purpose.text}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Health Information Types */}
              <Grid item xs={12}>
                <FormControl component="fieldset" error={submitted && !!errors.hiTypes}>
                  <FormLabel component="legend">Health Information Types *</FormLabel>
                  <FormGroup row>
                    {HEALTH_INFO_TYPES.map((hiType) => (
                      <FormControlLabel
                        key={hiType}
                        control={
                          <Checkbox
                            checked={selectedHiTypes.includes(hiType)}
                            onChange={(e) => handleHiTypeChange(hiType, e.target.checked)}
                          />
                        }
                        label={consentService.formatHealthInfoTypes([hiType])}
                      />
                    ))}
                  </FormGroup>
                  {submitted && errors.hiTypes && (
                    <Typography variant="caption" color="error">
                      {errors.hiTypes}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="From Date"
                  value={data.dateRange?.from || ''}
                  onChange={(e) => handleDateRangeChange('from', e.target.value)}
                  error={submitted && !!errors.dateRange?.from}
                  helperText={submitted && errors.dateRange?.from}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="To Date"
                  value={data.dateRange?.to || ''}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  error={submitted && !!errors.dateRange?.to}
                  helperText={submitted && errors.dateRange?.to}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>

              {/* Expiry Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Consent Expiry"
                  value={data.expiry ? data.expiry.split('T')[0] : ''}
                  onChange={(e) => handleInputChange('expiry', new Date(e.target.value).toISOString())}
                  error={submitted && !!errors.expiry}
                  helperText={submitted && errors.expiry}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Requesting...' : 'Request Consent'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
  );
};

export default ConsentRequestForm;
