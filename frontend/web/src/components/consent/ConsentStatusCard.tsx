/**
 * Consent Status Card Component
 * Displays consent request status and management options
 */

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Block as RevokeIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  ConsentRequest,
  ConsentAuditEntry
} from '../../types/consent.types';
import consentService from '../../services/consent.service';

interface ConsentStatusCardProps {
  consent: ConsentRequest;
  onRefresh?: () => void;
  onRevoke?: (consentId: string, reason: string) => void;
  loading?: boolean;
}

const ConsentStatusCard: React.FC<ConsentStatusCardProps> = ({
  consent,
  onRefresh,
  onRevoke,
  loading = false
}) => {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [auditTrail, setAuditTrail] = useState<ConsentAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const statusInfo = consentService.formatConsentStatus(consent.status);
  const canRevoke = consentService.canRevokeConsent(consent.status);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRevokeClick = () => {
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!revokeReason.trim()) {
      return;
    }

    setRevokeLoading(true);
    try {
      if (onRevoke) {
        await onRevoke(consent.id, revokeReason);
      }
      setRevokeDialogOpen(false);
      setRevokeReason('');
    } catch (error) {
      console.error('Error revoking consent:', error);
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleAuditClick = async () => {
    setAuditDialogOpen(true);
    setAuditLoading(true);
    
    try {
      const response = await consentService.getConsentAuditTrail(consent.id);
      setAuditTrail(response.auditTrail);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRANTED':
        return <CheckIcon color="success" />;
      case 'DENIED':
      case 'REVOKED':
        return <CancelIcon color="error" />;
      case 'EXPIRED':
        return <AccessTimeIcon color="disabled" />;
      case 'REQUESTED':
      default:
        return <ScheduleIcon color="warning" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getAuditActionIcon = (action: string) => {
    if (action.includes('GRANTED')) return <CheckIcon color="success" fontSize="small" />;
    if (action.includes('DENIED') || action.includes('REVOKED')) return <CancelIcon color="error" fontSize="small" />;
    if (action.includes('REQUESTED')) return <ScheduleIcon color="warning" fontSize="small" />;
    return <InfoIcon color="info" fontSize="small" />;
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(consent.status)}
              <Typography variant="h6">
                Consent Request
              </Typography>
              <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
              />
            </Box>
          }
          subheader={`Created: ${formatDateTime(consent.createdAt)}`}
          action={
            <Tooltip title="Refresh Status">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
        />
        
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Purpose
              </Typography>
              <Typography variant="body2" gutterBottom>
                {consent.purposeText}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Health Information Types
              </Typography>
              <Typography variant="body2" gutterBottom>
                {consentService.formatHealthInfoTypes(consent.hiTypes)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Date Range
              </Typography>
              <Typography variant="body2" gutterBottom>
                {formatDate(consent.dateRangeFrom)} - {formatDate(consent.dateRangeTo)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Expires
              </Typography>
              <Typography variant="body2" gutterBottom>
                {formatDateTime(consent.expiry)}
              </Typography>
            </Grid>
            
            {consent.abdmRequestId && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  ABDM Request ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {consent.abdmRequestId}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
        
        <Divider />
        
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button
            startIcon={<HistoryIcon />}
            onClick={handleAuditClick}
            size="small"
          >
            View Audit Trail
          </Button>
          
          {canRevoke && (
            <Button
              startIcon={<RevokeIcon />}
              onClick={handleRevokeClick}
              color="error"
              size="small"
            >
              Revoke Consent
            </Button>
          )}
        </CardActions>
      </Card>

      {/* Revoke Consent Dialog */}
      <Dialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Revoke Consent</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will revoke the patient's consent and prevent further access to their health records.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Revocation"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Please provide a reason for revoking this consent..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRevokeConfirm}
            color="error"
            variant="contained"
            disabled={!revokeReason.trim() || revokeLoading}
          >
            {revokeLoading ? 'Revoking...' : 'Revoke Consent'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog
        open={auditDialogOpen}
        onClose={() => setAuditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Consent Audit Trail</DialogTitle>
        <DialogContent>
          {auditLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Loading audit trail...</Typography>
            </Box>
          ) : (
            <List>
              {auditTrail.map((entry, index) => (
                <ListItem key={entry.id} divider={index < auditTrail.length - 1}>
                  <ListItemIcon>
                    {getAuditActionIcon(entry.action)}
                  </ListItemIcon>
                  <ListItemText
                    primary={entry.action.replace(/_/g, ' ')}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {formatDateTime(entry.createdAt)} • {entry.actorType}
                        </Typography>
                        {entry.details && (
                          <Typography variant="caption" color="text.secondary">
                            {JSON.stringify(entry.details, null, 2)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {auditTrail.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No audit entries found"
                    secondary="This consent request has no recorded activities"
                  />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConsentStatusCard;
