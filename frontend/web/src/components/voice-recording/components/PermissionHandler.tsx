/**
 * Permission Handler Component
 * Handles microphone permission requests and displays appropriate UI
 */

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { PermissionHandlerProps } from '../types';

const PermissionHandler: React.FC<PermissionHandlerProps> = ({
  permissionState,
  onRequestPermission,
  onRetry,
  showInstructions = true,
  className
}) => {
  const theme = useTheme();

  /**
   * Render permission granted state
   */
  const renderGrantedState = (): React.ReactNode => {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        <AlertTitle>Microphone Access Granted</AlertTitle>
        You can now start recording voice notes.
      </Alert>
    );
  };

  /**
   * Render permission loading state
   */
  const renderLoadingState = (): React.ReactNode => {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Checking Microphone Access</AlertTitle>
        Please wait while we check your microphone permissions...
      </Alert>
    );
  };

  /**
   * Render permission prompt state
   */
  const renderPromptState = (): React.ReactNode => {
    return (
      <Card className={className} sx={{ maxWidth: 500, mx: 'auto' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MicIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Microphone Access Required
              </Typography>
              <Typography variant="body2" color="text.secondary">
                To record voice notes, we need access to your microphone.
              </Typography>
            </Box>
          </Box>

          {showInstructions && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                What happens next:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Browser Permission Request"
                    secondary="Your browser will ask for microphone permission"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MicIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Allow Access"
                    secondary="Click 'Allow' to enable voice recording"
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            color="primary"
            onClick={onRequestPermission}
            startIcon={<MicIcon />}
            fullWidth
          >
            Request Microphone Access
          </Button>
        </CardActions>
      </Card>
    );
  };

  /**
   * Render permission denied state
   */
  const renderDeniedState = (): React.ReactNode => {
    return (
      <Card className={className} sx={{ maxWidth: 500, mx: 'auto' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MicOffIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom color="error">
                Microphone Access Denied
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Voice recording is not available without microphone access.
              </Typography>
            </Box>
          </Box>

          {permissionState.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {permissionState.error}
            </Alert>
          )}

          {showInstructions && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                To enable microphone access:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Browser Settings"
                    secondary="Go to your browser's site settings"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MicIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Allow Microphone"
                    secondary="Change microphone permission to 'Allow'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <RefreshIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Refresh Page"
                    secondary="Reload the page to apply changes"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Browser-specific instructions:</AlertTitle>
                <Typography variant="body2">
                  <strong>Chrome:</strong> Click the lock icon in the address bar → Site settings → Microphone → Allow
                  <br />
                  <strong>Firefox:</strong> Click the shield icon → Permissions → Microphone → Allow
                  <br />
                  <strong>Safari:</strong> Safari menu → Preferences → Websites → Microphone → Allow
                </Typography>
              </Alert>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
            fullWidth
          >
            Try Again
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
            fullWidth
          >
            Refresh Page
          </Button>
        </CardActions>
      </Card>
    );
  };

  /**
   * Render error state
   */
  const renderErrorState = (): React.ReactNode => {
    return (
      <Card className={className} sx={{ maxWidth: 500, mx: 'auto' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom color="error">
                Microphone Error
              </Typography>
              <Typography variant="body2" color="text.secondary">
                There was an issue accessing your microphone.
              </Typography>
            </Box>
          </Box>

          <Alert severity="error" sx={{ mb: 2 }}>
            {permissionState.error}
          </Alert>

          {showInstructions && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Possible solutions:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <MicIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Check Microphone"
                    secondary="Ensure your microphone is connected and working"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Close Other Apps"
                    secondary="Close other applications that might be using the microphone"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <RefreshIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Restart Browser"
                    secondary="Try restarting your browser and try again"
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            color="primary"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
            fullWidth
          >
            Try Again
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Render based on permission state
  if (permissionState.granted) {
    return renderGrantedState();
  }

  if (permissionState.loading) {
    return renderLoadingState();
  }

  if (permissionState.error) {
    return renderErrorState();
  }

  if (permissionState.denied) {
    return renderDeniedState();
  }

  // Default: prompt state
  return renderPromptState();
};

export default PermissionHandler;
