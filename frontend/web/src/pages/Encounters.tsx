import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Encounters: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Encounters
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This is the Encounters page. It will display the patient encounters and clinical notes.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Encounters;
