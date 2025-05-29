import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Mic as MicIcon,
  MedicalServices as MedicalServicesIcon
} from '@mui/icons-material';

const MuiDashboard = () => {
  // Mock data
  const doctorName = "Dr. Shah";
  const nextPatient = {
    name: "Rahul Mehta",
    age: 45,
    appointment: "9:30 AM - Follow-up for Diabetes",
    waitingTime: "5 minutes"
  };

  const pendingTasks = [
    { id: 1, title: "Review Lab Results", patient: "Ananya Desai", priority: "high" },
    { id: 2, title: "Complete SOAP Note", patient: "Vikram Singh", priority: "medium" },
    { id: 3, title: "Prescription Renewal", patient: "Priya Sharma", priority: "low" }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f7fa' }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Good morning, {doctorName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Today's Schedule Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                TODAY'S SCHEDULE
              </Typography>
            </Box>
            <Typography variant="body1">12 appointments</Typography>
            <Button variant="text" color="primary" sx={{ mt: 1 }}>
              View All
            </Button>
          </Paper>
        </Grid>

        {/* Pending Tasks */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                PENDING TASKS
              </Typography>
            </Box>
            <Typography variant="body1">{pendingTasks.length} items</Typography>
            <Button variant="text" color="primary" sx={{ mt: 1 }}>
              View All
            </Button>
          </Paper>
        </Grid>

        {/* Immediate Attention */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                IMMEDIATE ATTENTION
              </Typography>
            </Box>
            <Typography variant="body1">No critical alerts</Typography>
            <Button variant="text" color="primary" sx={{ mt: 1 }}>
              View All
            </Button>
          </Paper>
        </Grid>

        {/* Next Patient */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              NEXT PATIENT
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" component="h3">
                  {nextPatient.name}, {nextPatient.age}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {nextPatient.appointment}
                </Typography>
                <Typography variant="body2">
                  Waiting: {nextPatient.waitingTime}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">View Summary</Button>
                <Button size="small" variant="contained" color="primary">
                  Start Consultation
                </Button>
              </CardActions>
            </Card>
          </Paper>
        </Grid>

        {/* Patient Flow */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                PATIENT FLOW
              </Typography>
            </Box>
            <Typography variant="body1" gutterBottom>
              Waiting: 3
            </Typography>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Priya Sharma"
                  secondary="10:15 AM - Persistent cough"
                />
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Vikram Singh"
                  secondary="10:45 AM - Follow-up"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              QUICK ACTIONS
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              <IconButton
                color="primary"
                aria-label="record"
                sx={{
                  bgcolor: 'primary.light',
                  color: 'white',
                  p: 2,
                  '&:hover': {
                    bgcolor: 'primary.main',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <MicIcon fontSize="large" />
              </IconButton>
              <IconButton
                color="primary"
                aria-label="add"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 2,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <AddIcon fontSize="large" />
              </IconButton>
              <IconButton
                color="primary"
                aria-label="prescribe"
                sx={{
                  bgcolor: 'secondary.main',
                  color: 'white',
                  p: 2,
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <MedicalServicesIcon fontSize="large" />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MuiDashboard;
