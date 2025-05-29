import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Help: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Help
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This is the Help page. It will provide documentation and support resources for the application.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Help;
