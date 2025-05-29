/**
 * Voice Recording Module Index
 * Main entry point for voice recording functionality
 */

// Components
export {
  VoiceRecorder,
  AudioVisualizer,
  RecordingButton,
  RecordingStatus,
  PermissionHandler
} from './components';

// Hooks
export { useVoiceRecording } from './hooks/useVoiceRecording';

// Services
export { default as AudioService } from './services/audioService';
export { default as voiceRecordingAPI } from './services/voiceRecordingAPI';

// Types
export type * from './types';

// Default export - main component
export { default } from './components/VoiceRecorder';
