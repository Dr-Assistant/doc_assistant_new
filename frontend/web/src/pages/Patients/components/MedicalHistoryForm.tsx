/**
 * Medical History Form Component
 * This component provides a form for editing patient medical history
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  TextField,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { MedicalHistory, MedicalCondition, Surgery, Medication, FamilyHistory, Immunization } from '../../../types/patient.types';

interface MedicalHistoryFormProps {
  medicalHistory: MedicalHistory;
  onSave: (medicalHistory: MedicalHistory) => void;
  loading: boolean;
}

const MedicalHistoryForm: React.FC<MedicalHistoryFormProps> = ({
  medicalHistory,
  onSave,
  loading
}) => {
  // State for form data
  const [formData, setFormData] = useState<MedicalHistory>(medicalHistory);

  // Handle form submit
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
  };

  // Handle condition change
  const handleConditionChange = (index: number, field: keyof MedicalCondition, value: string) => {
    const updatedConditions = [...(formData.conditions || [])];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value as any
    };

    setFormData({
      ...formData,
      conditions: updatedConditions
    });
  };

  // Handle add condition
  const handleAddCondition = () => {
    const newCondition: MedicalCondition = {
      name: '',
      status: 'active'
    };

    setFormData({
      ...formData,
      conditions: [...(formData.conditions || []), newCondition]
    });
  };

  // Handle delete condition
  const handleDeleteCondition = (index: number) => {
    const updatedConditions = [...(formData.conditions || [])];
    updatedConditions.splice(index, 1);

    setFormData({
      ...formData,
      conditions: updatedConditions
    });
  };

  // Handle surgery change
  const handleSurgeryChange = (index: number, field: keyof Surgery, value: string) => {
    const updatedSurgeries = [...(formData.surgeries || [])];
    updatedSurgeries[index] = {
      ...updatedSurgeries[index],
      [field]: value as any
    };

    setFormData({
      ...formData,
      surgeries: updatedSurgeries
    });
  };

  // Handle add surgery
  const handleAddSurgery = () => {
    const newSurgery: Surgery = {
      name: ''
    };

    setFormData({
      ...formData,
      surgeries: [...(formData.surgeries || []), newSurgery]
    });
  };

  // Handle delete surgery
  const handleDeleteSurgery = (index: number) => {
    const updatedSurgeries = [...(formData.surgeries || [])];
    updatedSurgeries.splice(index, 1);

    setFormData({
      ...formData,
      surgeries: updatedSurgeries
    });
  };

  // Handle medication change
  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...(formData.medications || [])];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value as any
    };

    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  // Handle add medication
  const handleAddMedication = () => {
    const newMedication: Medication = {
      name: '',
      status: 'active'
    };

    setFormData({
      ...formData,
      medications: [...(formData.medications || []), newMedication]
    });
  };

  // Handle delete medication
  const handleDeleteMedication = (index: number) => {
    const updatedMedications = [...(formData.medications || [])];
    updatedMedications.splice(index, 1);

    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  // Handle family history change
  const handleFamilyHistoryChange = (index: number, field: keyof FamilyHistory, value: string) => {
    const updatedFamilyHistory = [...(formData.familyHistory || [])];
    updatedFamilyHistory[index] = {
      ...updatedFamilyHistory[index],
      [field]: value as any
    };

    setFormData({
      ...formData,
      familyHistory: updatedFamilyHistory
    });
  };

  // Handle add family history
  const handleAddFamilyHistory = () => {
    const newFamilyHistory: FamilyHistory = {
      relationship: '',
      condition: ''
    };

    setFormData({
      ...formData,
      familyHistory: [...(formData.familyHistory || []), newFamilyHistory]
    });
  };

  // Handle delete family history
  const handleDeleteFamilyHistory = (index: number) => {
    const updatedFamilyHistory = [...(formData.familyHistory || [])];
    updatedFamilyHistory.splice(index, 1);

    setFormData({
      ...formData,
      familyHistory: updatedFamilyHistory
    });
  };

  // Handle social history change
  const handleSocialHistoryChange = (field: string, subfield: string, value: string) => {
    setFormData({
      ...formData,
      socialHistory: {
        ...formData.socialHistory,
        [field]: {
          ...(formData.socialHistory?.[field as keyof typeof formData.socialHistory] as any || {}),
          [subfield]: value
        }
      } as any
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Medical History
          </Typography>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Medical Conditions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {formData.conditions?.map((condition, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Condition Name"
                        value={condition.name}
                        onChange={(e) => handleConditionChange(index, 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Diagnosed Date"
                        type="date"
                        value={condition.diagnosedDate || ''}
                        onChange={(e) => handleConditionChange(index, 'diagnosedDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={condition.status}
                          label="Status"
                          onChange={(e: SelectChangeEvent) => handleConditionChange(index, 'status', e.target.value as any)}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="resolved">Resolved</MenuItem>
                          <MenuItem value="in_remission">In Remission</MenuItem>
                          <MenuItem value="unknown">Unknown</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton color="error" onClick={() => handleDeleteCondition(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={2}
                        value={condition.notes || ''}
                        onChange={(e) => handleConditionChange(index, 'notes', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddCondition}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Condition
              </Button>
            </AccordionDetails>
          </Accordion>

          {/* Additional sections for surgeries, medications, family history, etc. would go here */}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Medical History'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </form>
  );
};

export default MedicalHistoryForm;
