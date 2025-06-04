/**
 * Pre-Diagnosis Summary Card Component
 * This component displays a generated pre-diagnosis summary with AI insights
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Button
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Schedule as ScheduleIcon,
  DataUsage as DataUsageIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as LocalHospitalIcon
} from '@mui/icons-material';
import { PreDiagnosisSummary } from '../../types/patient.types';
import { formatDistanceToNow } from 'date-fns';

interface PreDiagnosisSummaryCardProps {
  summary: PreDiagnosisSummary;
  onRefresh?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  loading?: boolean;
}

const PreDiagnosisSummaryCard: React.FC<PreDiagnosisSummaryCardProps> = ({
  summary,
  onRefresh,
  onDownload,
  onShare,
  loading = false
}) => {
  const [expanded, setExpanded] = useState<string | false>('summary');

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'info';
      case 'failed': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const formatProcessingTime = (time?: number) => {
    if (!time) return 'N/A';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  const renderListItems = (items: string[], icon: React.ReactNode) => (
    <List dense>
      {items.map((item, index) => (
        <ListItem key={index} sx={{ py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            {icon}
          </ListItemIcon>
          <ListItemText primary={item} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Card>
      <CardHeader
        avatar={<PsychologyIcon color="primary" />}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              Pre-Diagnosis Summary
            </Typography>
            <Chip
              label={summary.status}
              color={getStatusColor(summary.status) as any}
              size="small"
            />
            {summary.aiSummary && (
              <Chip
                label={`${summary.aiSummary.urgencyLevel.toUpperCase()} PRIORITY`}
                color={getUrgencyColor(summary.aiSummary.urgencyLevel) as any}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            Generated {formatDistanceToNow(new Date(summary.createdAt))} ago
            {summary.aiSummary && (
              <> • Confidence: {Math.round(summary.aiSummary.confidenceScore * 100)}%</>
            )}
          </Typography>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onRefresh && (
              <Tooltip title="Refresh Summary">
                <IconButton onClick={onRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {onDownload && (
              <Tooltip title="Download Summary">
                <IconButton onClick={onDownload}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            {onShare && (
              <Tooltip title="Share Summary">
                <IconButton onClick={onShare}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />

      <CardContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {summary.status === 'failed' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to generate summary. Please try again or contact support.
          </Alert>
        )}

        {summary.status === 'generating' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Summary is being generated. This may take a few moments...
          </Alert>
        )}

        {summary.aiSummary && (
          <>
            {/* AI Summary Section */}
            <Accordion
              expanded={expanded === 'summary'}
              onChange={handleAccordionChange('summary')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon color="primary" />
                  <Typography variant="h6">AI Analysis</Typography>
                  <Chip
                    label={`${Math.round(summary.aiSummary.confidenceScore * 100)}% Confidence`}
                    color={getConfidenceColor(summary.aiSummary.confidenceScore) as any}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Key Findings */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} color="success" />
                      Key Findings
                    </Typography>
                    {summary.aiSummary.keyFindings.length > 0 ? (
                      renderListItems(summary.aiSummary.keyFindings, <CheckCircleIcon color="success" />)
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No key findings identified
                      </Typography>
                    )}
                  </Grid>

                  {/* Risk Factors */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} color="warning" />
                      Risk Factors
                    </Typography>
                    {summary.aiSummary.riskFactors.length > 0 ? (
                      renderListItems(summary.aiSummary.riskFactors, <WarningIcon color="warning" />)
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No significant risk factors identified
                      </Typography>
                    )}
                  </Grid>

                  {/* Recommendations */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      <LocalHospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} color="primary" />
                      Recommendations
                    </Typography>
                    {summary.aiSummary.recommendations.length > 0 ? (
                      renderListItems(summary.aiSummary.recommendations, <LocalHospitalIcon color="primary" />)
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No specific recommendations
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Data Sources Section */}
            <Accordion
              expanded={expanded === 'sources'}
              onChange={handleAccordionChange('sources')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DataUsageIcon color="primary" />
                  <Typography variant="h6">Data Sources</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Local Records
                      </Typography>
                      <Chip
                        label={summary.dataSources.localRecords.available ? 'Available' : 'Not Available'}
                        color={summary.dataSources.localRecords.available ? 'success' : 'default'}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {summary.dataSources.localRecords.recordCount} records
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        ABDM Records
                      </Typography>
                      <Chip
                        label={summary.dataSources.abdmRecords.available ? 'Available' : 'Not Available'}
                        color={summary.dataSources.abdmRecords.available ? 'success' : 'default'}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {summary.dataSources.abdmRecords.recordCount} records
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Questionnaire
                      </Typography>
                      <Chip
                        label={summary.dataSources.questionnaire.completed ? 'Completed' : 'Not Completed'}
                        color={summary.dataSources.questionnaire.completed ? 'success' : 'default'}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {summary.dataSources.questionnaire.responseCount} responses
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Technical Details */}
            <Accordion
              expanded={expanded === 'technical'}
              onChange={handleAccordionChange('technical')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6">Technical Details</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      AI Model Information
                    </Typography>
                    <Typography variant="body2">
                      Model: {summary.aiSummary.model}
                    </Typography>
                    <Typography variant="body2">
                      Version: {summary.aiSummary.version}
                    </Typography>
                    <Typography variant="body2">
                      Processing Time: {formatProcessingTime(summary.aiSummary.processingTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Confidence Metrics
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 100 }}>
                        Confidence:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={summary.aiSummary.confidenceScore * 100}
                        sx={{ flexGrow: 1, mx: 1 }}
                        color={getConfidenceColor(summary.aiSummary.confidenceScore) as any}
                      />
                      <Typography variant="body2">
                        {Math.round(summary.aiSummary.confidenceScore * 100)}%
                      </Typography>
                    </Box>
                    {summary.aiSummary.tokenUsage && (
                      <Typography variant="body2">
                        Tokens Used: {summary.aiSummary.tokenUsage.totalTokens}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            size="small"
          >
            Schedule Follow-up
          </Button>
          <Button
            variant="contained"
            startIcon={<LocalHospitalIcon />}
            size="small"
          >
            Start Consultation
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PreDiagnosisSummaryCard;
