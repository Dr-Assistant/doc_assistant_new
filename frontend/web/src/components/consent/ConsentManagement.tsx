/**
 * Consent Management Component
 * Main component for managing ABDM consent requests
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Pagination,
  Alert,
  Skeleton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  ConsentRequest,
  ConsentListResponse,
  ConsentStatus
} from '../../types/consent.types';
import ConsentStatusCard from './ConsentStatusCard';
import ConsentRequestForm from './ConsentRequestForm';
import consentService from '../../services/consent.service';

interface ConsentManagementProps {
  patientId?: string;
  showCreateButton?: boolean;
}

const ConsentManagement: React.FC<ConsentManagementProps> = ({
  patientId,
  showCreateButton = true
}) => {
  const [consents, setConsents] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const limit = 10;

  const loadConsents = async (pageNum: number = page, status?: string) => {
    try {
      setLoading(pageNum === 1);
      setError(null);

      let response: ConsentListResponse;
      
      if (patientId) {
        // Load consents for specific patient
        response = await consentService.getActiveConsents(patientId);
      } else {
        // Load all consents for doctor
        response = await consentService.getConsentsByDoctor(pageNum, limit, status);
      }

      setConsents(response.consents);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (err: any) {
      setError(err.message);
      setConsents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConsents(1, statusFilter);
  }, [patientId, statusFilter]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    loadConsents(value, statusFilter);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConsents(page, statusFilter);
  };

  const handleConsentRefresh = (consentId: string) => {
    // Refresh specific consent status
    loadConsents(page, statusFilter);
  };

  const handleConsentRevoke = async (consentId: string, reason: string) => {
    try {
      await consentService.revokeConsent(consentId, reason);
      // Refresh the list after revocation
      loadConsents(page, statusFilter);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    loadConsents(1, statusFilter);
  };

  const filteredConsents = consents.filter(consent => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      consent.purposeText.toLowerCase().includes(searchLower) ||
      consent.abdmRequestId?.toLowerCase().includes(searchLower) ||
      consent.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusCounts = () => {
    const counts: { [key: string]: number } = {};
    consents.forEach(consent => {
      counts[consent.status] = (counts[consent.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && page === 1) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="90%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {patientId ? 'Patient Consents' : 'Consent Management'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const statusInfo = consentService.formatConsentStatus(status);
              return (
                <Chip
                  key={status}
                  label={`${statusInfo.label}: ${count}`}
                  color={statusInfo.color}
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outlined"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {showCreateButton && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              variant="contained"
            >
              Request Consent
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search consents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="REQUESTED">Pending</MenuItem>
                  <MenuItem value="GRANTED">Granted</MenuItem>
                  <MenuItem value="DENIED">Denied</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                  <MenuItem value="REVOKED">Revoked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Consent Cards */}
      {filteredConsents.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No consent requests found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {patientId 
                ? "This patient doesn't have any consent requests yet."
                : "You haven't created any consent requests yet."
              }
            </Typography>
            {showCreateButton && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Request First Consent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredConsents.map((consent) => (
            <Grid item xs={12} lg={6} key={consent.id}>
              <ConsentStatusCard
                consent={consent}
                onRefresh={() => handleConsentRefresh(consent.id)}
                onRevoke={handleConsentRevoke}
                loading={refreshing}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Create Consent Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Request New Consent</DialogTitle>
        <DialogContent>
          <ConsentRequestForm
            patientId={patientId || ''}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ConsentManagement;
