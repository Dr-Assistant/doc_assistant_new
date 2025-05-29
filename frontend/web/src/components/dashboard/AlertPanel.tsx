/**
 * Alert Panel Component
 * Displays critical alerts and notifications
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  Tooltip,
  Avatar,
  Divider,
  Badge
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocalHospital as ClinicalIcon,
  Computer as SystemIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import type { Alert as DashboardAlert } from '../../services/dashboard.service';
import type { AlertSeverity } from '../../types/dashboard.types';

interface AlertPanelProps {
  alerts: DashboardAlert[];
  onAlertClick?: (alert: DashboardAlert) => void;
  onAlertDismiss?: (alertId: string) => void;
  maxItems?: number;
  loading?: boolean;
}

const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onAlertClick,
  onAlertDismiss,
  maxItems = 5,
  loading = false
}) => {
  const [showAll, setShowAll] = useState(false);

  const getAlertIcon = (type: string, severity: AlertSeverity) => {
    const iconProps = {
      fontSize: 'small' as const,
      sx: { color: getSeverityColor(severity) }
    };

    switch (type) {
      case 'patient': return <PersonIcon {...iconProps} />;
      case 'schedule': return <ScheduleIcon {...iconProps} />;
      case 'clinical': return <ClinicalIcon {...iconProps} />;
      case 'system': return <SystemIcon {...iconProps} />;
      default: return <InfoIcon {...iconProps} />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'error.main';
      case 'high': return 'warning.main';
      case 'medium': return 'info.main';
      case 'low': return 'text.secondary';
      default: return 'text.secondary';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return <ErrorIcon fontSize="small" />;
      case 'high': return <WarningIcon fontSize="small" />;
      case 'medium': return <InfoIcon fontSize="small" />;
      case 'low': return <InfoIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getSeverityWeight = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  };

  // Filter and sort alerts
  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const sortedAlerts = [...unreadAlerts].sort((a, b) => {
    // Sort by severity first, then by creation time
    const severityDiff = getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
    if (severityDiff !== 0) return severityDiff;

    return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
  });

  const displayAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, maxItems);
  const hasMoreAlerts = sortedAlerts.length > maxItems;
  const criticalCount = sortedAlerts.filter(alert => alert.severity === 'critical').length;

  if (loading) {
    return (
      <Card>
        <CardHeader title="Alerts" />
        <CardContent>
          <Typography color="textSecondary">Loading alerts...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Alerts</Typography>
            {criticalCount > 0 && (
              <Badge badgeContent={criticalCount} color="error">
                <NotificationsActiveIcon color="error" />
              </Badge>
            )}
          </Box>
        }
        subheader={`${unreadAlerts.length} unread alerts`}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<ViewIcon />}
          >
            View All
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {sortedAlerts.length === 0 ? (
          <Box textAlign="center" py={4}>
            <InfoIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No active alerts
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All systems are running smoothly.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayAlerts.map((alert, index) => (
              <Box key={alert.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    backgroundColor: alert.severity === 'critical' ? 'error.50' : 'transparent',
                    border: alert.severity === 'critical' ? '1px solid' : 'none',
                    borderColor: alert.severity === 'critical' ? 'error.main' : 'transparent',
                    '&:hover': {
                      backgroundColor: alert.severity === 'critical' ? 'error.100' : 'grey.50'
                    }
                  }}
                  onClick={() => onAlertClick?.(alert)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: getSeverityColor(alert.severity),
                        color: 'white'
                      }}
                    >
                      {getAlertIcon(alert.type, alert.severity)}
                    </Avatar>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {alert.title}
                        </Typography>
                        {alert.actionRequired && (
                          <Chip
                            label="Action Required"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          {alert.message}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {/* Severity */}
                          <Chip
                            icon={getSeverityIcon(alert.severity)}
                            label={alert.severity}
                            size="small"
                            color={alert.severity === 'critical' ? 'error' :
                                   alert.severity === 'high' ? 'warning' : 'default'}
                            variant="outlined"
                          />

                          {/* Type */}
                          <Chip
                            label={alert.type}
                            size="small"
                            variant="outlined"
                          />

                          {/* Patient */}
                          {alert.patientName && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="textSecondary">
                                {alert.patientName}
                              </Typography>
                            </Box>
                          )}

                          {/* Time */}
                          <Typography variant="caption" color="textSecondary">
                            {formatTimeAgo(alert.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Tooltip title="Dismiss alert">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAlertDismiss?.(alert.id);
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>

                {index < displayAlerts.length - 1 && (
                  <Divider sx={{ my: 0.5 }} />
                )}
              </Box>
            ))}
          </List>
        )}

        {!showAll && hasMoreAlerts && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowAll(true)}
            >
              View {sortedAlerts.length - maxItems} more alerts
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertPanel;
