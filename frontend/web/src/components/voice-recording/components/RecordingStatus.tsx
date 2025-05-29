/**
 * Recording Status Component
 * Displays recording status, duration, and permission information
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Pause as PauseIcon,
  RadioButtonChecked as RecordingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { RecordingStatusProps } from '../types';

const RecordingStatus: React.FC<RecordingStatusProps> = ({
  recordingState,
  permissionState,
  duration,
  showDuration = true,
  showStatus = true,
  showPermissionStatus = true,
  format = 'compact',
  className
}) => {
  const theme = useTheme();

  /**
   * Format duration to MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get status color and icon
   */
  const getStatusInfo = () => {
    if (recordingState.error) {
      return {
        color: 'error' as const,
        icon: <WarningIcon />,
        text: 'Error',
        bgColor: alpha(theme.palette.error.main, 0.1)
      };
    }

    if (recordingState.isProcessing) {
      return {
        color: 'info' as const,
        icon: <MicIcon />,
        text: 'Processing',
        bgColor: alpha(theme.palette.info.main, 0.1)
      };
    }

    if (recordingState.isRecording && recordingState.isPaused) {
      return {
        color: 'warning' as const,
        icon: <PauseIcon />,
        text: 'Paused',
        bgColor: alpha(theme.palette.warning.main, 0.1)
      };
    }

    if (recordingState.isRecording) {
      return {
        color: 'error' as const,
        icon: <RecordingIcon />,
        text: 'Recording',
        bgColor: alpha(theme.palette.error.main, 0.1)
      };
    }

    return {
      color: 'default' as const,
      icon: <MicIcon />,
      text: 'Ready',
      bgColor: alpha(theme.palette.grey[500], 0.1)
    };
  };

  /**
   * Get permission status info
   */
  const getPermissionInfo = () => {
    if (permissionState.error) {
      return {
        color: 'error' as const,
        icon: <WarningIcon />,
        text: 'Permission Error',
        bgColor: alpha(theme.palette.error.main, 0.1)
      };
    }

    if (permissionState.loading) {
      return {
        color: 'info' as const,
        icon: <MicIcon />,
        text: 'Checking...',
        bgColor: alpha(theme.palette.info.main, 0.1)
      };
    }

    if (permissionState.denied) {
      return {
        color: 'error' as const,
        icon: <MicOffIcon />,
        text: 'Permission Denied',
        bgColor: alpha(theme.palette.error.main, 0.1)
      };
    }

    if (permissionState.granted) {
      return {
        color: 'success' as const,
        icon: <CheckIcon />,
        text: 'Permission Granted',
        bgColor: alpha(theme.palette.success.main, 0.1)
      };
    }

    return {
      color: 'warning' as const,
      icon: <WarningIcon />,
      text: 'Permission Required',
      bgColor: alpha(theme.palette.warning.main, 0.1)
    };
  };

  const statusInfo = getStatusInfo();
  const permissionInfo = getPermissionInfo();

  /**
   * Render compact format
   */
  const renderCompact = (): React.ReactNode => {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: 1,
          borderRadius: 1,
          backgroundColor: statusInfo.bgColor
        }}
      >
        {showStatus && (
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.text}
            color={statusInfo.color}
            size="small"
            variant="outlined"
          />
        )}

        {showDuration && (
          <Typography
            variant="body2"
            fontFamily="monospace"
            fontWeight="bold"
            color={recordingState.isRecording ? 'error.main' : 'text.secondary'}
          >
            {formatDuration(duration)}
          </Typography>
        )}

        {showPermissionStatus && !permissionState.granted && (
          <Chip
            icon={permissionInfo.icon}
            label={permissionInfo.text}
            color={permissionInfo.color}
            size="small"
            variant="outlined"
          />
        )}
      </Box>
    );
  };

  /**
   * Render detailed format
   */
  const renderDetailed = (): React.ReactNode => {
    return (
      <Box
        className={className}
        sx={{
          padding: 2,
          borderRadius: 2,
          backgroundColor: statusInfo.bgColor,
          border: `1px solid ${alpha(statusInfo.color === 'default' ? theme.palette.grey[500] : theme.palette[statusInfo.color].main, 0.3)}`
        }}
      >
        {/* Recording Status */}
        {showStatus && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {statusInfo.icon}
            <Typography variant="h6" color={statusInfo.color === 'default' ? 'text.primary' : `${statusInfo.color}.main`}>
              {statusInfo.text}
            </Typography>
          </Box>
        )}

        {/* Duration */}
        {showDuration && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Duration
            </Typography>
            <Typography
              variant="h4"
              fontFamily="monospace"
              fontWeight="bold"
              color={recordingState.isRecording ? 'error.main' : 'text.primary'}
            >
              {formatDuration(duration)}
            </Typography>
          </Box>
        )}

        {/* Recording Progress (if recording) */}
        {recordingState.isRecording && !recordingState.isPaused && (
          <Box sx={{ mb: 1 }}>
            <LinearProgress
              color="error"
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.error.main, 0.2)
              }}
            />
          </Box>
        )}

        {/* Permission Status */}
        {showPermissionStatus && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {permissionInfo.icon}
            <Typography
              variant="body2"
              color={`${permissionInfo.color}.main`}
            >
              {permissionInfo.text}
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {recordingState.error && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="error.main">
              {recordingState.error}
            </Typography>
          </Box>
        )}

        {/* Permission Error */}
        {permissionState.error && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="error.main">
              {permissionState.error}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return format === 'compact' ? renderCompact() : renderDetailed();
};

export default RecordingStatus;
