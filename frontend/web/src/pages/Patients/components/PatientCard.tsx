/**
 * Patient Card Component
 * This component displays patient information in a card format
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Grid,
  Avatar,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Bloodtype as BloodtypeIcon,
  Warning as WarningIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../../types/patient.types';

interface PatientCardProps {
  patient: Patient;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const navigate = useNavigate();
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'deceased':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Handle edit patient
  const handleEditPatient = () => {
    navigate(`/patients/${patient.id}/edit`);
  };
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{ width: 64, height: 64, bgcolor: 'primary.main', mr: 2 }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" component="h2">
                {`${patient.first_name} ${patient.last_name}`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  {`${calculateAge(patient.date_of_birth)} years`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  •
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  •
                </Typography>
                <Chip
                  label={patient.status}
                  color={getStatusColor(patient.status) as any}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditPatient}
          >
            Edit
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" component="h3" gutterBottom>
              Personal Information
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Date of Birth
              </Typography>
              <Typography variant="body1">
                {formatDate(patient.date_of_birth)}
              </Typography>
            </Box>
            
            {patient.blood_group && (
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <BloodtypeIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {`Blood Group: ${patient.blood_group}`}
                </Typography>
              </Box>
            )}
            
            {patient.allergies && patient.allergies.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Allergies
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {patient.allergies.map((allergy, index) => (
                    <Chip
                      key={index}
                      icon={<WarningIcon />}
                      label={allergy}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" component="h3" gutterBottom>
              Contact Information
            </Typography>
            
            {patient.phone && (
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {patient.phone}
                </Typography>
              </Box>
            )}
            
            {patient.email && (
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {patient.email}
                </Typography>
              </Box>
            )}
            
            {patient.address && (
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <HomeIcon fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
                <Typography variant="body1">
                  {`${patient.address.line1}${patient.address.line2 ? `, ${patient.address.line2}` : ''}, ${patient.address.city}, ${patient.address.state}, ${patient.address.postalCode}, ${patient.address.country}`}
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="subtitle1" component="h3" gutterBottom>
              Medical Identifiers
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Medical Record Number (MRN)
                  </Typography>
                  <Typography variant="body1">
                    {patient.mrn || 'Not assigned'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    ABHA ID
                  </Typography>
                  <Typography variant="body1">
                    {patient.abha_id || 'Not linked'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          
          {patient.emergency_contact && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle1" component="h3" gutterBottom>
                Emergency Contact
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {patient.emergency_contact.name}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Relationship
                </Typography>
                <Typography variant="body1">
                  {patient.emergency_contact.relationship}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {patient.emergency_contact.phone}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
