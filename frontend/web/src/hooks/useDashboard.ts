/**
 * Dashboard Hook
 * Custom hook for managing dashboard state and data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardService, { DashboardData } from '../services/dashboard.service';
import { DashboardState, DashboardSettings } from '../types/dashboard.types';

interface UseDashboardOptions {
  doctorId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  useMockData?: boolean;
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const {
    doctorId,
    autoRefresh = true,
    refreshInterval = 30, // 30 seconds
    useMockData = process.env.REACT_APP_USE_MOCK_SERVICES === 'true' // Use environment variable
  } = options;

  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [settings, setSettings] = useState<DashboardSettings>({
    autoRefresh: true,
    refreshInterval: 30,
    showCompletedTasks: false,
    showReadAlerts: false,
    defaultView: 'overview',
    compactMode: false
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch dashboard data
   */
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      let data: DashboardData;

      if (useMockData) {
        // Use mock data for development
        data = dashboardService.getMockDashboardData();
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Use real API
        data = await dashboardService.getDashboardData(doctorId);
      }

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching dashboard data:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch dashboard data'
        }));
      }
    }
  }, [doctorId, useMockData]);

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  /**
   * Update appointment status
   */
  const updateAppointmentStatus = useCallback(async (appointmentId: string, status: string) => {
    try {
      if (!useMockData) {
        await dashboardService.updateAppointmentStatus(appointmentId, status as any);
      }

      // Update local state optimistically
      setState(prev => {
        if (!prev.data) return prev;

        const updatedAppointments = prev.data.appointments.map((apt: any) =>
          apt.id === appointmentId ? { ...apt, status: status as any } : apt
        );

        return {
          ...prev,
          data: {
            ...prev.data,
            appointments: updatedAppointments
          }
        };
      });

      // Refresh data to get latest state
      setTimeout(() => refresh(), 1000);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      // Revert optimistic update on error
      refresh();
    }
  }, [useMockData, refresh]);

  /**
   * Mark alert as read
   */
  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      if (!useMockData) {
        await dashboardService.markAlertAsRead(alertId);
      }

      // Update local state optimistically
      setState(prev => {
        if (!prev.data) return prev;

        const updatedAlerts = prev.data.alerts.map((alert: any) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        );

        return {
          ...prev,
          data: {
            ...prev.data,
            alerts: updatedAlerts
          }
        };
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      refresh();
    }
  }, [useMockData, refresh]);

  /**
   * Update dashboard settings
   */
  const updateSettings = useCallback((newSettings: Partial<DashboardSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    if (autoRefresh && settings.autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, (settings.refreshInterval || refreshInterval) * 1000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, settings.autoRefresh, settings.refreshInterval, refreshInterval, refresh]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchDashboardData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchDashboardData]);

  /**
   * Get filtered data based on settings
   */
  const getFilteredData = useCallback(() => {
    if (!state.data) return null;

    const filteredData = { ...state.data };

    // Filter tasks based on settings
    if (!settings.showCompletedTasks) {
      filteredData.tasks = filteredData.tasks.filter((task: any) => task.status !== 'completed');
    }

    // Filter alerts based on settings
    if (!settings.showReadAlerts) {
      filteredData.alerts = filteredData.alerts.filter((alert: any) => !alert.isRead);
    }

    return filteredData;
  }, [state.data, settings]);

  return {
    // State
    ...state,
    settings,

    // Data
    filteredData: getFilteredData(),

    // Actions
    refresh,
    updateAppointmentStatus,
    markAlertAsRead,
    updateSettings,

    // Computed values
    isStale: state.lastUpdated ?
      (Date.now() - state.lastUpdated.getTime()) > (refreshInterval * 1000 * 2) :
      false,
    nextAppointment: state.data?.appointments.find((apt: any) =>
      ['confirmed', 'checked-in'].includes(apt.status)
    ),
    urgentTasks: state.data?.tasks.filter((task: any) =>
      task.priority === 'urgent' || task.isOverdue
    ) || [],
    criticalAlerts: state.data?.alerts.filter((alert: any) =>
      alert.severity === 'critical' && !alert.isRead
    ) || []
  };
};
