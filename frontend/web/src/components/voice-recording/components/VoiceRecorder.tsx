/**
 * Voice Recorder Component
 * Main component that combines all voice recording functionality
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import { VoiceRecorderProps, TranscriptionResponse } from '../types';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import voiceRecordingAPI from '../services/voiceRecordingAPI';
import AudioVisualizer from './AudioVisualizer';
import RecordingButton from './RecordingButton';
import RecordingStatus from './RecordingStatus';
import PermissionHandler from './PermissionHandler';

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  config,
  encounterId,
  patientId,
  doctorId,
  onRecordingStart,
  onRecordingStop,
  onRecordingError,
  onTranscriptionComplete,
  onTranscriptionError,
  showVisualization = true,
  showTimer = true,
  showWaveform = false,
  variant = 'full',
  size = 'medium',
  color = 'primary',
  autoStart = false,
  autoStop = false,
  autoTranscribe = true,
  className,
  style
}) => {
  const theme = useTheme();

  // Voice recording hook
  const {
    recordingState,
    permissionState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    audioBlob,
    audioUrl,
    visualizationData,
    requestPermission,
    checkPermission,
    cleanup
  } = useVoiceRecording(config);

  // Local state
  const [transcriptionState, setTranscriptionState] = useState<{
    isTranscribing: boolean;
    transcriptionId?: string;
    error?: string;
  }>({
    isTranscribing: false
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  /**
   * Show snackbar message
   */
  const showMessage = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  /**
   * Handle recording start
   */
  const handleRecordingStart = useCallback(async () => {
    try {
      await startRecording();
      onRecordingStart?.();
      showMessage('Recording started', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      onRecordingError?.(errorMessage);
      showMessage(errorMessage, 'error');
    }
  }, [startRecording, onRecordingStart, onRecordingError, showMessage]);

  /**
   * Handle recording stop
   */
  const handleRecordingStop = useCallback(async () => {
    try {
      const result = await stopRecording();

      if (result) {
        onRecordingStop?.(result.blob, result.metadata);
        showMessage('Recording completed', 'success');

        // Auto-transcribe if enabled
        if (autoTranscribe) {
          await handleTranscription(result.blob, result.metadata);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      onRecordingError?.(errorMessage);
      showMessage(errorMessage, 'error');
    }
  }, [stopRecording, onRecordingStop, onRecordingError, autoTranscribe, showMessage]);

  /**
   * Handle transcription
   */
  const handleTranscription = useCallback(async (blob: Blob, metadata: any) => {
    if (!autoTranscribe) return;

    try {
      setTranscriptionState({ isTranscribing: true });
      showMessage('Starting transcription...', 'info');

      // Upload audio for transcription
      const response = await voiceRecordingAPI.uploadAudio(
        blob,
        metadata,
        {
          encounterId,
          patientId,
          doctorId,
          priority: 'normal',
          context: {
            specialty: 'General Medicine',
            encounterType: 'consultation'
          }
        }
      );

      if (response.success && response.data) {
        const transcriptionId = response.data.id;
        setTranscriptionState({
          isTranscribing: true,
          transcriptionId
        });

        // Poll for completion
        const result = await voiceRecordingAPI.pollTranscriptionStatus(
          transcriptionId,
          (status) => {
            if (status.status === 'processing') {
              showMessage('Transcription in progress...', 'info');
            }
          }
        );

        setTranscriptionState({ isTranscribing: false });
        onTranscriptionComplete?.(result);
        showMessage('Transcription completed', 'success');

      } else {
        throw new Error(response.error || 'Failed to start transcription');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
      setTranscriptionState({
        isTranscribing: false,
        error: errorMessage
      });
      onTranscriptionError?.(errorMessage);
      showMessage(errorMessage, 'error');
    }
  }, [
    autoTranscribe,
    encounterId,
    patientId,
    doctorId,
    onTranscriptionComplete,
    onTranscriptionError,
    showMessage
  ]);

  /**
   * Handle permission request
   */
  const handlePermissionRequest = useCallback(async () => {
    try {
      await requestPermission();
      showMessage('Microphone access granted', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Permission request failed';
      showMessage(errorMessage, 'error');
    }
  }, [requestPermission, showMessage]);

  /**
   * Handle permission retry
   */
  const handlePermissionRetry = useCallback(async () => {
    try {
      await checkPermission();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Permission check failed';
      showMessage(errorMessage, 'error');
    }
  }, [checkPermission, showMessage]);

  /**
   * Auto-start recording if enabled
   */
  useEffect(() => {
    if (autoStart && permissionState.granted && !recordingState.isRecording) {
      handleRecordingStart();
    }
  }, [autoStart, permissionState.granted, recordingState.isRecording, handleRecordingStart]);

  /**
   * Auto-stop recording if enabled and max duration reached
   */
  useEffect(() => {
    if (autoStop && recordingState.isRecording && config?.maxDuration) {
      if (recordingState.duration >= config.maxDuration) {
        handleRecordingStop();
      }
    }
  }, [autoStop, recordingState.isRecording, recordingState.duration, config?.maxDuration, handleRecordingStop]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /**
   * Render minimal variant
   */
  const renderMinimal = (): React.ReactNode => {
    if (!permissionState.granted) {
      return (
        <PermissionHandler
          permissionState={permissionState}
          onRequestPermission={handlePermissionRequest}
          onRetry={handlePermissionRetry}
          showInstructions={false}
          className={className}
        />
      );
    }

    return (
      <Box
        className={className}
        style={style}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <RecordingButton
          isRecording={recordingState.isRecording}
          isPaused={recordingState.isPaused}
          isProcessing={recordingState.isProcessing || transcriptionState.isTranscribing}
          onStart={handleRecordingStart}
          onStop={handleRecordingStop}
          onPause={pauseRecording}
          onResume={resumeRecording}
          size={size}
          color={color}
          showLabel={false}
        />

        {showTimer && (
          <RecordingStatus
            recordingState={recordingState}
            permissionState={permissionState}
            duration={recordingState.duration}
            showDuration={true}
            showStatus={false}
            showPermissionStatus={false}
            format="compact"
          />
        )}
      </Box>
    );
  };

  /**
   * Render compact variant
   */
  const renderCompact = (): React.ReactNode => {
    if (!permissionState.granted) {
      return (
        <PermissionHandler
          permissionState={permissionState}
          onRequestPermission={handlePermissionRequest}
          onRetry={handlePermissionRetry}
          showInstructions={false}
          className={className}
        />
      );
    }

    return (
      <Paper
        className={className}
        style={style}
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RecordingButton
            isRecording={recordingState.isRecording}
            isPaused={recordingState.isPaused}
            isProcessing={recordingState.isProcessing || transcriptionState.isTranscribing}
            onStart={handleRecordingStart}
            onStop={handleRecordingStop}
            onPause={pauseRecording}
            onResume={resumeRecording}
            size={size}
            color={color}
          />

          <RecordingStatus
            recordingState={recordingState}
            permissionState={permissionState}
            duration={recordingState.duration}
            showDuration={showTimer}
            showStatus={true}
            showPermissionStatus={false}
            format="compact"
          />
        </Box>

        {showVisualization && (
          <AudioVisualizer
            isRecording={recordingState.isRecording && !recordingState.isPaused}
            width={300}
            height={60}
            showFrequency={true}
            showWaveform={showWaveform}
          />
        )}

        {transcriptionState.isTranscribing && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Transcribing audio... Please wait.
          </Alert>
        )}
      </Paper>
    );
  };

  /**
   * Render full variant
   */
  const renderFull = (): React.ReactNode => {
    if (!permissionState.granted) {
      return (
        <PermissionHandler
          permissionState={permissionState}
          onRequestPermission={handlePermissionRequest}
          onRetry={handlePermissionRetry}
          showInstructions={true}
          className={className}
        />
      );
    }

    return (
      <Paper
        className={className}
        style={style}
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Voice Recording
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Record your consultation notes
          </Typography>
        </Box>

        {/* Recording Status */}
        <RecordingStatus
          recordingState={recordingState}
          permissionState={permissionState}
          duration={recordingState.duration}
          showDuration={showTimer}
          showStatus={true}
          showPermissionStatus={true}
          format="detailed"
        />

        {/* Audio Visualization */}
        {showVisualization && (
          <AudioVisualizer
            isRecording={recordingState.isRecording && !recordingState.isPaused}
            width={400}
            height={100}
            showFrequency={true}
            showWaveform={showWaveform}
          />
        )}

        {/* Recording Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <RecordingButton
            isRecording={recordingState.isRecording}
            isPaused={recordingState.isPaused}
            isProcessing={recordingState.isProcessing || transcriptionState.isTranscribing}
            onStart={handleRecordingStart}
            onStop={handleRecordingStop}
            onPause={pauseRecording}
            onResume={resumeRecording}
            size={size}
            color={color}
          />
        </Box>

        {/* Transcription Status */}
        {transcriptionState.isTranscribing && (
          <Alert severity="info">
            <Typography variant="body2">
              Transcribing audio... This may take a few moments.
            </Typography>
          </Alert>
        )}

        {/* Error Display */}
        {(recordingState.error || transcriptionState.error) && (
          <Alert severity="error">
            {recordingState.error || transcriptionState.error}
          </Alert>
        )}
      </Paper>
    );
  };

  return (
    <>
      {/* Main Component */}
      {variant === 'minimal' && renderMinimal()}
      {variant === 'compact' && renderCompact()}
      {variant === 'full' && renderFull()}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default VoiceRecorder;
