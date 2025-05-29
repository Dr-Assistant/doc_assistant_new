import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Schedule: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Schedule
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This is the Schedule page. It will display the doctor's appointments and schedule.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Schedule;
