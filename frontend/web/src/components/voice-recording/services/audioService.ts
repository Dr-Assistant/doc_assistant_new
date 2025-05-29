/**
 * Audio Service for Voice Recording
 * Handles audio recording, permissions, and audio processing
 */

import { 
  AudioPermissionState, 
  VoiceRecordingConfig, 
  AudioVisualizationData,
  RecordingMetadata 
} from '../types';

export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private config: VoiceRecordingConfig;

  constructor(config: Partial<VoiceRecordingConfig> = {}) {
    this.config = {
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      format: 'webm',
      maxDuration: 3600, // 1 hour
      minDuration: 1, // 1 second
      enableVisualization: true,
      enableNoiseReduction: true,
      ...config
    };
  }

  /**
   * Check microphone permission status
   */
  async checkPermission(): Promise<AudioPermissionState> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          denied: true,
          prompt: false,
          loading: false,
          error: 'Media devices not supported in this browser'
        };
      }

      // Check permission status if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          return {
            granted: permission.state === 'granted',
            denied: permission.state === 'denied',
            prompt: permission.state === 'prompt',
            loading: false
          };
        } catch (error) {
          // Fallback if permissions API not available
        }
      }

      // Fallback: try to access microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        stream.getTracks().forEach(track => track.stop());
        return {
          granted: true,
          denied: false,
          prompt: false,
          loading: false
        };
      } catch (error) {
        return {
          granted: false,
          denied: true,
          prompt: false,
          loading: false,
          error: 'Microphone access denied'
        };
      }
    } catch (error) {
      return {
        granted: false,
        denied: false,
        prompt: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<AudioPermissionState> {
    try {
      const constraints = {
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: this.config.enableNoiseReduction,
          autoGainControl: true
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      return {
        granted: true,
        denied: false,
        prompt: false,
        loading: false
      };
    } catch (error) {
      let errorMessage = 'Failed to access microphone';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied by user';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        granted: false,
        denied: true,
        prompt: false,
        loading: false,
        error: errorMessage
      };
    }
  }

  /**
   * Initialize audio context and analyzer for visualization
   */
  private async initializeAudioContext(): Promise<void> {
    if (!this.stream) {
      throw new Error('No audio stream available');
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.microphone.connect(this.analyser);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    try {
      if (!this.stream) {
        const permissionState = await this.requestPermission();
        if (!permissionState.granted) {
          throw new Error(permissionState.error || 'Microphone permission required');
        }
      }

      // Initialize audio context for visualization
      if (this.config.enableVisualization) {
        await this.initializeAudioContext();
      }

      // Configure MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream!, { mimeType });
      
      this.chunks = [];
      this.startTime = Date.now();

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        throw new Error('Recording failed');
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<{ blob: Blob; metadata: RecordingMetadata }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(this.chunks, { 
            type: this.getSupportedMimeType() 
          });
          
          const duration = (Date.now() - this.startTime) / 1000;
          
          if (duration < this.config.minDuration) {
            reject(new Error(`Recording too short. Minimum duration is ${this.config.minDuration} seconds`));
            return;
          }

          const metadata: RecordingMetadata = {
            id: this.generateId(),
            filename: `recording_${Date.now()}.${this.getFileExtension()}`,
            duration,
            size: blob.size,
            format: this.config.format,
            sampleRate: this.config.sampleRate,
            channels: this.config.channels,
            createdAt: new Date()
          };

          this.cleanup();
          resolve({ blob, metadata });
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Cancel recording
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.chunks = [];
    }
    this.cleanup();
  }

  /**
   * Get visualization data
   */
  getVisualizationData(): AudioVisualizationData | null {
    if (!this.analyser) {
      return null;
    }

    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Uint8Array(this.analyser.frequencyBinCount);
    
    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeData);

    // Calculate volume and peak
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
      peak = Math.max(peak, frequencyData[i]);
    }
    const volume = sum / frequencyData.length;

    return {
      frequencyData,
      timeData,
      volume: volume / 255,
      peak: peak / 255
    };
  }

  /**
   * Get recording state
   */
  getRecordingState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Get recording duration
   */
  getRecordingDuration(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.microphone = null;
    this.chunks = [];
    this.startTime = 0;
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Get file extension based on format
   */
  private getFileExtension(): string {
    const mimeType = this.getSupportedMimeType();
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('wav')) return 'wav';
    return 'webm';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get audio context for external use
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get analyser node for external use
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}

export default AudioService;
