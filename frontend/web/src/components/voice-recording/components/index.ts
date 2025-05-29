/**
 * Voice Recording Components Index
 * Exports all voice recording components
 */

export { default as VoiceRecorder } from './VoiceRecorder';
export { default as AudioVisualizer } from './AudioVisualizer';
export { default as RecordingButton } from './RecordingButton';
export { default as RecordingStatus } from './RecordingStatus';
export { default as PermissionHandler } from './PermissionHandler';

// Re-export types for convenience
export type {
  VoiceRecorderProps,
  AudioVisualizerProps,
  RecordingButtonProps,
  RecordingStatusProps,
  PermissionHandlerProps
} from '../types';
