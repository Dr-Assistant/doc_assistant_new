/**
 * Voice Recording Hook
 * Main hook for managing voice recording state and operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  VoiceRecordingHookReturn, 
  RecordingState, 
  AudioPermissionState, 
  VoiceRecordingConfig,
  AudioVisualizationData,
  RecordingMetadata
} from '../types';
import AudioService from '../services/audioService';

export const useVoiceRecording = (
  config: Partial<VoiceRecordingConfig> = {}
): VoiceRecordingHookReturn => {
  // State
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isProcessing: false,
    duration: 0,
    startTime: undefined,
    endTime: undefined,
    error: undefined
  });

  const [permissionState, setPermissionState] = useState<AudioPermissionState>({
    granted: false,
    denied: false,
    prompt: false,
    loading: false,
    error: undefined
  });

  const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [visualizationData, setVisualizationData] = useState<AudioVisualizationData | undefined>();

  // Refs
  const audioServiceRef = useRef<AudioService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visualizationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio service
  useEffect(() => {
    audioServiceRef.current = new AudioService(config);
    
    return () => {
      cleanup();
    };
  }, [config]);

  // Check initial permission status
  useEffect(() => {
    checkPermission();
  }, []);

  /**
   * Check microphone permission
   */
  const checkPermission = useCallback(async () => {
    if (!audioServiceRef.current) return;

    setPermissionState(prev => ({ ...prev, loading: true }));
    
    try {
      const permission = await audioServiceRef.current.checkPermission();
      setPermissionState(permission);
    } catch (error) {
      setPermissionState({
        granted: false,
        denied: false,
        prompt: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Permission check failed'
      });
    }
  }, []);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async () => {
    if (!audioServiceRef.current) return;

    setPermissionState(prev => ({ ...prev, loading: true }));
    
    try {
      const permission = await audioServiceRef.current.requestPermission();
      setPermissionState(permission);
    } catch (error) {
      setPermissionState({
        granted: false,
        denied: true,
        prompt: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Permission request failed'
      });
    }
  }, []);

  /**
   * Start duration tracking
   */
  const startDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(() => {
      if (audioServiceRef.current) {
        const duration = audioServiceRef.current.getRecordingDuration();
        setRecordingState(prev => ({ ...prev, duration }));
      }
    }, 100);
  }, []);

  /**
   * Stop duration tracking
   */
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  /**
   * Start visualization tracking
   */
  const startVisualizationTracking = useCallback(() => {
    if (!config.enableVisualization) return;

    if (visualizationIntervalRef.current) {
      clearInterval(visualizationIntervalRef.current);
    }

    visualizationIntervalRef.current = setInterval(() => {
      if (audioServiceRef.current) {
        const data = audioServiceRef.current.getVisualizationData();
        if (data) {
          setVisualizationData(data);
        }
      }
    }, 50); // 20 FPS
  }, [config.enableVisualization]);

  /**
   * Stop visualization tracking
   */
  const stopVisualizationTracking = useCallback(() => {
    if (visualizationIntervalRef.current) {
      clearInterval(visualizationIntervalRef.current);
      visualizationIntervalRef.current = null;
    }
    setVisualizationData(undefined);
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    if (!audioServiceRef.current) {
      throw new Error('Audio service not initialized');
    }

    try {
      setRecordingState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: undefined 
      }));

      // Check permission first
      if (!permissionState.granted) {
        await requestPermission();
      }

      await audioServiceRef.current.startRecording();

      const startTime = new Date();
      setRecordingState({
        isRecording: true,
        isPaused: false,
        isProcessing: false,
        duration: 0,
        startTime,
        endTime: undefined,
        error: undefined
      });

      // Clear previous audio data
      setAudioBlob(undefined);
      setAudioUrl(undefined);

      // Start tracking
      startDurationTracking();
      startVisualizationTracking();

    } catch (error) {
      setRecordingState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      }));
      throw error;
    }
  }, [permissionState.granted, requestPermission, startDurationTracking, startVisualizationTracking]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    if (!audioServiceRef.current) {
      throw new Error('Audio service not initialized');
    }

    try {
      setRecordingState(prev => ({ ...prev, isProcessing: true }));

      const result = await audioServiceRef.current.stopRecording();
      const endTime = new Date();

      // Create audio URL for playback
      const url = URL.createObjectURL(result.blob);

      setAudioBlob(result.blob);
      setAudioUrl(url);
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        isProcessing: false,
        endTime,
        duration: result.metadata.duration
      }));

      // Stop tracking
      stopDurationTracking();
      stopVisualizationTracking();

      return result;

    } catch (error) {
      setRecordingState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording'
      }));
      throw error;
    }
  }, [stopDurationTracking, stopVisualizationTracking]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (!audioServiceRef.current) return;

    audioServiceRef.current.pauseRecording();
    setRecordingState(prev => ({ ...prev, isPaused: true }));
    stopDurationTracking();
    stopVisualizationTracking();
  }, [stopDurationTracking, stopVisualizationTracking]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (!audioServiceRef.current) return;

    audioServiceRef.current.resumeRecording();
    setRecordingState(prev => ({ ...prev, isPaused: false }));
    startDurationTracking();
    startVisualizationTracking();
  }, [startDurationTracking, startVisualizationTracking]);

  /**
   * Cancel recording
   */
  const cancelRecording = useCallback(() => {
    if (!audioServiceRef.current) return;

    audioServiceRef.current.cancelRecording();
    
    setRecordingState({
      isRecording: false,
      isPaused: false,
      isProcessing: false,
      duration: 0,
      startTime: undefined,
      endTime: undefined,
      error: undefined
    });

    // Clear audio data
    setAudioBlob(undefined);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(undefined);
    }

    // Stop tracking
    stopDurationTracking();
    stopVisualizationTracking();
  }, [audioUrl, stopDurationTracking, stopVisualizationTracking]);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    if (audioServiceRef.current) {
      audioServiceRef.current.cleanup();
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    if (visualizationIntervalRef.current) {
      clearInterval(visualizationIntervalRef.current);
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setRecordingState({
      isRecording: false,
      isPaused: false,
      isProcessing: false,
      duration: 0,
      startTime: undefined,
      endTime: undefined,
      error: undefined
    });

    setAudioBlob(undefined);
    setAudioUrl(undefined);
    setVisualizationData(undefined);
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    recordingState,
    permissionState,
    
    // Controls
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    
    // Data
    audioBlob,
    audioUrl,
    visualizationData,
    
    // Permissions
    requestPermission,
    checkPermission,
    
    // Cleanup
    cleanup
  };
};

export default useVoiceRecording;
