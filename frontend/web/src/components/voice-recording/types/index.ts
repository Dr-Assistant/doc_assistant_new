/**
 * Voice Recording Types and Interfaces
 */

export interface AudioPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  loading: boolean;
  error?: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  duration: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  volume: number;
  peak: number;
}

export interface VoiceRecordingConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  format: 'wav' | 'mp3' | 'webm';
  maxDuration: number; // in seconds
  minDuration: number; // in seconds
  enableVisualization: boolean;
  enableNoiseReduction: boolean;
}

export interface RecordingMetadata {
  id: string;
  filename: string;
  duration: number;
  size: number;
  format: string;
  sampleRate: number;
  channels: number;
  createdAt: Date;
  encounterId?: string;
  patientId?: string;
  doctorId?: string;
  tags?: string[];
  notes?: string;
}

export interface TranscriptionRequest {
  audioFile: File;
  encounterId?: string;
  patientId?: string;
  doctorId?: string;
  language?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  context?: {
    specialty?: string;
    encounterType?: string;
    patientInfo?: any;
  };
}

export interface TranscriptionResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  transcript?: string;
  confidence?: number;
  duration?: number;
  language?: string;
  processingTime?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface VoiceRecordingHookReturn {
  // Recording state
  recordingState: RecordingState;
  permissionState: AudioPermissionState;

  // Recording controls
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ blob: Blob; metadata: RecordingMetadata } | undefined>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;

  // Audio data
  audioBlob?: Blob;
  audioUrl?: string;
  visualizationData?: AudioVisualizationData;

  // Permissions
  requestPermission: () => Promise<void>;
  checkPermission: () => Promise<void>;

  // Cleanup
  cleanup: () => void;
}

export interface VoiceRecorderProps {
  // Configuration
  config?: Partial<VoiceRecordingConfig>;

  // Context
  encounterId?: string;
  patientId?: string;
  doctorId?: string;

  // Callbacks
  onRecordingStart?: () => void;
  onRecordingStop?: (audioBlob: Blob, metadata: RecordingMetadata) => void;
  onRecordingError?: (error: string) => void;
  onTranscriptionComplete?: (transcription: TranscriptionResponse) => void;
  onTranscriptionError?: (error: string) => void;

  // UI customization
  showVisualization?: boolean;
  showTimer?: boolean;
  showWaveform?: boolean;
  variant?: 'compact' | 'full' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

  // Auto features
  autoStart?: boolean;
  autoStop?: boolean;
  autoTranscribe?: boolean;

  // Styling
  className?: string;
  style?: React.CSSProperties;
}

export interface AudioVisualizerProps {
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  isRecording: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  color?: string;
  backgroundColor?: string;
  showFrequency?: boolean;
  showWaveform?: boolean;
  animationSpeed?: number;
  className?: string;
}

export interface RecordingButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  showLabel?: boolean;
  className?: string;
}

export interface RecordingStatusProps {
  recordingState: RecordingState;
  permissionState: AudioPermissionState;
  duration: number;
  showDuration?: boolean;
  showStatus?: boolean;
  showPermissionStatus?: boolean;
  format?: 'compact' | 'detailed';
  className?: string;
}

export interface PermissionHandlerProps {
  permissionState: AudioPermissionState;
  onRequestPermission: () => void;
  onRetry: () => void;
  showInstructions?: boolean;
  className?: string;
}

export interface ErrorDisplayProps {
  error?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
  className?: string;
}

// API Response types
export interface VoiceRecordingApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

// Event types
export type RecordingEventType =
  | 'recording-started'
  | 'recording-stopped'
  | 'recording-paused'
  | 'recording-resumed'
  | 'recording-cancelled'
  | 'recording-error'
  | 'permission-granted'
  | 'permission-denied'
  | 'transcription-started'
  | 'transcription-completed'
  | 'transcription-error';

export interface RecordingEvent {
  type: RecordingEventType;
  timestamp: Date;
  data?: any;
  error?: string;
}

// Utility types
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'processing' | 'error';
export type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'prompt';
export type AudioFormat = 'wav' | 'mp3' | 'webm' | 'ogg';
export type RecordingQuality = 'low' | 'medium' | 'high' | 'lossless';
