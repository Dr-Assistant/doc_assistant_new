/**
 * Consent Page
 * Main page for ABDM consent management
 */

import React from 'react';
import {
  Container,
  Box,
  Breadcrumbs,
  Link,
  Typography
} from '@mui/material';
import {
  Home as HomeIcon,
  Security as ConsentIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { ConsentManagement } from '../components/consent';

const Consent: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component={RouterLink}
            to="/dashboard"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <ConsentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            ABDM Consent
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ABDM Consent Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage patient consent requests for accessing health records through ABDM (Ayushman Bharat Digital Mission).
          Request, track, and manage consent for secure access to patient health information across healthcare providers.
        </Typography>
      </Box>

      {/* Consent Management Component */}
      <ConsentManagement showCreateButton={true} />
    </Container>
  );
};

export default Consent;
