import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Patients: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Patients
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This is the Patients page. It will display the list of patients and their information.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Patients;
