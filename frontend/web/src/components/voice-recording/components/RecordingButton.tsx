/**
 * Recording Button Component
 * Main button for controlling voice recording
 */

import React from 'react';
import {
  Button,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  FiberManualRecord as RecordIcon
} from '@mui/icons-material';
import { RecordingButtonProps } from '../types';

const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  isPaused,
  isProcessing,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled = false,
  size = 'medium',
  variant = 'contained',
  color = 'primary',
  showLabel = true,
  className
}) => {
  const theme = useTheme();

  /**
   * Get button text based on state
   */
  const getButtonText = (): string => {
    if (isProcessing) return 'Processing...';
    if (isRecording && !isPaused) return 'Recording...';
    if (isPaused) return 'Paused';
    return 'Start Recording';
  };

  /**
   * Get button icon based on state
   */
  const getButtonIcon = (): React.ReactNode => {
    if (isProcessing) {
      return <CircularProgress size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />;
    }
    
    if (isRecording && !isPaused) {
      return <RecordIcon />;
    }
    
    if (isPaused) {
      return <PlayIcon />;
    }
    
    return <MicIcon />;
  };

  /**
   * Get button color based on state
   */
  const getButtonColor = (): 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    if (isRecording && !isPaused) return 'error';
    if (isPaused) return 'warning';
    return color;
  };

  /**
   * Handle button click
   */
  const handleClick = (): void => {
    if (disabled || isProcessing) return;

    if (!isRecording) {
      onStart();
    } else if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  /**
   * Handle stop button click
   */
  const handleStopClick = (): void => {
    if (disabled || isProcessing) return;
    onStop();
  };

  /**
   * Render compact button (icon only)
   */
  const renderCompactButton = (): React.ReactNode => {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title={getButtonText()}>
          <IconButton
            onClick={handleClick}
            disabled={disabled || isProcessing}
            color={getButtonColor()}
            size={size}
            className={className}
            sx={{
              ...(isRecording && !isPaused && {
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: `0 0 0 0 ${theme.palette.error.main}40`
                  },
                  '70%': {
                    boxShadow: `0 0 0 10px ${theme.palette.error.main}00`
                  },
                  '100%': {
                    boxShadow: `0 0 0 0 ${theme.palette.error.main}00`
                  }
                }
              })
            }}
          >
            {getButtonIcon()}
          </IconButton>
        </Tooltip>

        {(isRecording || isPaused) && (
          <Tooltip title="Stop Recording">
            <IconButton
              onClick={handleStopClick}
              disabled={disabled || isProcessing}
              color="error"
              size={size}
            >
              <StopIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  /**
   * Render full button with text
   */
  const renderFullButton = (): React.ReactNode => {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant={variant}
          color={getButtonColor()}
          size={size}
          onClick={handleClick}
          disabled={disabled || isProcessing}
          startIcon={getButtonIcon()}
          className={className}
          sx={{
            minWidth: 140,
            ...(isRecording && !isPaused && {
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: `0 0 0 0 ${theme.palette.error.main}40`
                },
                '70%': {
                  boxShadow: `0 0 0 10px ${theme.palette.error.main}00`
                },
                '100%': {
                  boxShadow: `0 0 0 0 ${theme.palette.error.main}00`
                }
              }
            })
          }}
        >
          {showLabel && getButtonText()}
        </Button>

        {(isRecording || isPaused) && (
          <Button
            variant="outlined"
            color="error"
            size={size}
            onClick={handleStopClick}
            disabled={disabled || isProcessing}
            startIcon={<StopIcon />}
          >
            Stop
          </Button>
        )}
      </Box>
    );
  };

  // Render based on variant
  if (variant === 'text' && !showLabel) {
    return renderCompactButton();
  }

  return renderFullButton();
};

export default RecordingButton;
