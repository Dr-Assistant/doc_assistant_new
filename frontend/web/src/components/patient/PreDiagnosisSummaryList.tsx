/**
 * Pre-Diagnosis Summary List Component
 * This component displays a list of pre-diagnosis summaries with filtering and actions
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import preDiagnosisService from '../../services/preDiagnosis.service';
import { PreDiagnosisSummary } from '../../types/patient.types';

interface PreDiagnosisSummaryListProps {
  patientId?: string;
  showUrgentOnly?: boolean;
  maxItems?: number;
  onSummaryClick?: (summary: PreDiagnosisSummary) => void;
  title?: string;
}

const PreDiagnosisSummaryList: React.FC<PreDiagnosisSummaryListProps> = ({
  patientId,
  showUrgentOnly = false,
  maxItems = 10,
  onSummaryClick,
  title = 'Pre-Diagnosis Summaries'
}) => {
  const [summaries, setSummaries] = useState<PreDiagnosisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    urgency: '',
    search: ''
  });

  const fetchSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (patientId) {
        response = await preDiagnosisService.getSummariesByPatient(patientId, {
          limit: maxItems,
          status: filter.status || undefined
        });
      } else if (showUrgentOnly) {
        response = await preDiagnosisService.getUrgentSummaries(maxItems);
      } else {
        response = await preDiagnosisService.getRecentSummaries(maxItems);
      }

      let filteredSummaries = response.summaries;

      // Apply filters
      if (filter.urgency) {
        filteredSummaries = filteredSummaries.filter(
          summary => summary.aiSummary?.urgencyLevel === filter.urgency
        );
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredSummaries = filteredSummaries.filter(summary =>
          summary.aiSummary?.keyFindings.some(finding => 
            finding.toLowerCase().includes(searchLower)
          ) ||
          summary.aiSummary?.riskFactors.some(risk => 
            risk.toLowerCase().includes(searchLower)
          )
        );
      }

      setSummaries(filteredSummaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSummaries();
  };

  const handleFilterChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFilter(prev => ({
      ...prev,
      [field]: event.target.value as string
    }));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'generating': return <ScheduleIcon color="info" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'expired': return <WarningIcon color="warning" />;
      default: return <PsychologyIcon />;
    }
  };

  const getUrgentCount = () => {
    return summaries.filter(summary => 
      summary.aiSummary?.urgencyLevel === 'urgent'
    ).length;
  };

  useEffect(() => {
    fetchSummaries();
  }, [patientId, showUrgentOnly, maxItems, filter]);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6">
              {title}
            </Typography>
            {!showUrgentOnly && getUrgentCount() > 0 && (
              <Badge badgeContent={getUrgentCount()} color="error">
                <WarningIcon color="warning" />
              </Badge>
            )}
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filters */}
        {!patientId && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filter.search}
                onChange={handleFilterChange('search')}
                placeholder="Search findings, risks..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filter.status}
                  onChange={handleFilterChange('status')}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="generating">Generating</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Urgency</InputLabel>
                <Select
                  value={filter.urgency}
                  onChange={handleFilterChange('urgency')}
                  label="Urgency"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Summary List */}
        {summaries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No pre-diagnosis summaries found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patientId 
                ? 'Generate a new summary for this patient'
                : 'Summaries will appear here once generated'
              }
            </Typography>
          </Box>
        ) : (
          <List>
            {summaries.map((summary, index) => (
              <ListItem
                key={summary.id}
                divider={index < summaries.length - 1}
                sx={{
                  cursor: onSummaryClick ? 'pointer' : 'default',
                  '&:hover': onSummaryClick ? { backgroundColor: 'action.hover' } : {}
                }}
                onClick={() => onSummaryClick?.(summary)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getStatusIcon(summary.status)}
                      <Typography variant="subtitle2">
                        Summary #{summary.id.slice(-8)}
                      </Typography>
                      <Chip
                        label={summary.status}
                        size="small"
                        color={summary.status === 'completed' ? 'success' : 'default'}
                      />
                      {summary.aiSummary && (
                        <Chip
                          label={summary.aiSummary.urgencyLevel.toUpperCase()}
                          size="small"
                          color={getUrgencyColor(summary.aiSummary.urgencyLevel) as any}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created {formatDistanceToNow(new Date(summary.createdAt))} ago
                      </Typography>
                      {summary.aiSummary && (
                        <>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Confidence: {Math.round(summary.aiSummary.confidenceScore * 100)}%
                          </Typography>
                          {summary.aiSummary.keyFindings.length > 0 && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Key Finding: {summary.aiSummary.keyFindings[0]}
                              {summary.aiSummary.keyFindings.length > 1 && 
                                ` (+${summary.aiSummary.keyFindings.length - 1} more)`
                              }
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="View Summary">
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSummaryClick?.(summary);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Show More Button */}
        {summaries.length === maxItems && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
            >
              View All Summaries
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PreDiagnosisSummaryList;
