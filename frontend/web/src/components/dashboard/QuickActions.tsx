/**
 * Quick Actions Component
 * Provides quick access to common doctor actions
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  LocalPharmacy as PharmacyIcon,
  Science as ScienceIcon,
  Schedule as ScheduleIcon,
  VideoCall as VideoCallIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface QuickActionsProps {
  onNewPatient?: () => void;
  onNewAppointment?: () => void;
  onNewPrescription?: () => void;
  onNewLabOrder?: () => void;
  onNewTask?: () => void;
  onSearchPatient?: () => void;
  onVideoCall?: () => void;
  onSettings?: () => void;
}

interface ActionButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  description,
  icon,
  color = 'primary',
  onClick,
  disabled = false
}) => {
  return (
    <Button
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        borderColor: `${color}.main`,
        color: `${color}.main`,
        '&:hover': {
          borderColor: `${color}.dark`,
          backgroundColor: `${color}.50`
        }
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <Box sx={{ color: `${color}.main`, mb: 1 }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" fontWeight="medium" textAlign="center">
        {title}
      </Typography>
      <Typography variant="caption" color="textSecondary" textAlign="center">
        {description}
      </Typography>
    </Button>
  );
};

const QuickActions: React.FC<QuickActionsProps> = ({
  onNewPatient,
  onNewAppointment,
  onNewPrescription,
  onNewLabOrder,
  onNewTask,
  onSearchPatient,
  onVideoCall,
  onSettings
}) => {
  const primaryActions = [
    {
      title: 'New Patient',
      description: 'Register new patient',
      icon: <PersonIcon fontSize="large" />,
      color: 'primary' as const,
      onClick: onNewPatient
    },
    {
      title: 'Schedule',
      description: 'Book appointment',
      icon: <ScheduleIcon fontSize="large" />,
      color: 'info' as const,
      onClick: onNewAppointment
    },
    {
      title: 'Prescription',
      description: 'Write prescription',
      icon: <PharmacyIcon fontSize="large" />,
      color: 'success' as const,
      onClick: onNewPrescription
    },
    {
      title: 'Lab Order',
      description: 'Order tests',
      icon: <ScienceIcon fontSize="large" />,
      color: 'warning' as const,
      onClick: onNewLabOrder
    }
  ];

  const secondaryActions = [
    {
      title: 'New Task',
      description: 'Create reminder',
      icon: <AssignmentIcon />,
      onClick: onNewTask
    },
    {
      title: 'Search Patient',
      description: 'Find patient records',
      icon: <SearchIcon />,
      onClick: onSearchPatient
    },
    {
      title: 'Video Call',
      description: 'Start consultation',
      icon: <VideoCallIcon />,
      onClick: onVideoCall
    }
  ];

  return (
    <Card>
      <CardHeader
        title="Quick Actions"
        subheader="Common tasks and shortcuts"
        action={
          <Tooltip title="Settings">
            <IconButton size="small" onClick={onSettings}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {/* Primary Actions */}
        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
          Primary Actions
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {primaryActions.map((action, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <ActionButton {...action} />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Secondary Actions */}
        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
          Quick Tools
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              startIcon={action.icon}
              onClick={action.onClick}
              sx={{ minWidth: 'auto' }}
            >
              {action.title}
            </Button>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Communication Tools */}
        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
          Communication
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Make phone call">
            <IconButton color="primary">
              <PhoneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send email">
            <IconButton color="primary">
              <EmailIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print documents">
            <IconButton color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video consultation">
            <IconButton color="success">
              <VideoCallIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
