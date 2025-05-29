/**
 * Metrics Display Component
 * Shows practice metrics and key performance indicators
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import type { PracticeMetrics } from '../../services/dashboard.service';

interface MetricsDisplayProps {
  metrics: PracticeMetrics;
  showCharts?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  progress?: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  progress,
  trend,
  trendValue
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'down': return <TrendingUpIcon sx={{ fontSize: 16, color: 'error.main', transform: 'rotate(180deg)' }} />;
      default: return null;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
          {trend && trendValue && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getTrendIcon()}
              <Typography variant="caption" color={trend === 'up' ? 'success.main' : 'error.main'}>
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
          {value}
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}

        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
              {progress}% completion rate
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  metrics,
  showCharts = true,
  loading = false,
  onRefresh
}) => {
  // Prepare chart data
  const appointmentData = [
    { name: 'Completed', value: metrics.patientsSeenToday, color: '#4caf50' },
    { name: 'Remaining', value: metrics.patientsScheduledToday - metrics.patientsSeenToday, color: '#e0e0e0' }
  ];

  const performanceData = [
    { name: 'Wait Time', value: metrics.averageWaitTime, target: 15 },
    { name: 'Consult Time', value: metrics.averageConsultationTime, target: 20 },
    { name: 'Completion', value: metrics.completionRate, target: 90 }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader title="Practice Metrics" />
        <CardContent>
          <Typography color="textSecondary">Loading metrics...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Today's Metrics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showCharts && (
            <Tooltip title="View detailed charts">
              <IconButton size="small">
                <BarChartIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Refresh metrics">
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Patients Seen"
            value={`${metrics.patientsSeenToday}/${metrics.patientsScheduledToday}`}
            subtitle="Today's appointments"
            icon={<PeopleIcon />}
            color="primary"
            progress={(metrics.patientsSeenToday / metrics.patientsScheduledToday) * 100}
            trend="up"
            trendValue="+12%"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average Wait Time"
            value={`${metrics.averageWaitTime}min`}
            subtitle="Patient waiting time"
            icon={<TimerIcon />}
            color={metrics.averageWaitTime > 20 ? 'warning' : 'success'}
            trend={metrics.averageWaitTime > 20 ? 'up' : 'down'}
            trendValue={metrics.averageWaitTime > 20 ? '+5min' : '-3min'}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Tasks"
            value={metrics.pendingTasksCount}
            subtitle="Requires attention"
            icon={<AssignmentIcon />}
            color={metrics.pendingTasksCount > 5 ? 'warning' : 'info'}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Critical Alerts"
            value={metrics.criticalAlertsCount}
            subtitle="Immediate action needed"
            icon={<WarningIcon />}
            color={metrics.criticalAlertsCount > 0 ? 'error' : 'success'}
          />
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Completion Rate"
            value={`${metrics.completionRate}%`}
            subtitle="Appointments completed on time"
            icon={<ScheduleIcon />}
            color={metrics.completionRate >= 90 ? 'success' : 'warning'}
            progress={metrics.completionRate}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Consultation Time"
            value={`${metrics.averageConsultationTime}min`}
            subtitle="Average per patient"
            icon={<TimerIcon />}
            color="info"
          />
        </Grid>

        {metrics.revenueToday && (
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Revenue Today"
              value={`₹${metrics.revenueToday.toLocaleString()}`}
              subtitle="Total earnings"
              icon={<MoneyIcon />}
              color="success"
              trend="up"
              trendValue="+8%"
            />
          </Grid>
        )}

        {metrics.patientSatisfactionScore && (
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Patient Satisfaction"
              value={`${metrics.patientSatisfactionScore}/5`}
              subtitle="Average rating"
              icon={<StarIcon />}
              color="warning"
              progress={(metrics.patientSatisfactionScore / 5) * 100}
            />
          </Grid>
        )}
      </Grid>

      {/* Charts */}
      {showCharts && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Appointment Progress" />
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={appointmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {appointmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Chip label={`Completed: ${metrics.patientsSeenToday}`} color="success" size="small" />
                  <Chip label={`Remaining: ${metrics.patientsScheduledToday - metrics.patientsSeenToday}`} variant="outlined" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Performance Metrics" />
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#1976d2" />
                    <Bar dataKey="target" fill="#e0e0e0" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MetricsDisplay;
