/**
 * Voice Recording API Service
 * Handles communication with the voice recording backend service
 */

import axios, { AxiosProgressEvent } from 'axios';
import {
  TranscriptionRequest,
  TranscriptionResponse,
  VoiceRecordingApiResponse,
  UploadProgressEvent,
  RecordingMetadata
} from '../types';

const API_BASE_URL = process.env.REACT_APP_VOICE_RECORDING_SERVICE_URL || 'http://localhost:8013';

export class VoiceRecordingAPI {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.setupInterceptors();
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Setup axios interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          console.error('Unauthorized access to voice recording service');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Upload audio file for transcription
   */
  async uploadAudio(
    audioBlob: Blob,
    metadata: RecordingMetadata,
    request: Partial<TranscriptionRequest> = {},
    onProgress?: (progress: UploadProgressEvent) => void
  ): Promise<VoiceRecordingApiResponse<TranscriptionResponse>> {
    try {
      const formData = new FormData();

      // Create file from blob
      const audioFile = new File([audioBlob], metadata.filename, {
        type: audioBlob.type
      });

      formData.append('audio', audioFile);
      formData.append('metadata', JSON.stringify(metadata));

      // Add request parameters
      if (request.encounterId) {
        formData.append('encounterId', request.encounterId);
      }
      if (request.patientId) {
        formData.append('patientId', request.patientId);
      }
      if (request.doctorId) {
        formData.append('doctorId', request.doctorId);
      }
      if (request.language) {
        formData.append('language', request.language);
      }
      if (request.priority) {
        formData.append('priority', request.priority);
      }
      if (request.context) {
        formData.append('context', JSON.stringify(request.context));
      }

      const response = await axios.post(
        `${this.baseURL}/api/transcriptions/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress: UploadProgressEvent = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
              };
              onProgress(progress);
            }
          },
          timeout: 300000 // 5 minutes timeout for large files
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to upload audio:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get transcription status
   */
  async getTranscriptionStatus(
    transcriptionId: string
  ): Promise<VoiceRecordingApiResponse<TranscriptionResponse>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/transcriptions/${transcriptionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get transcription status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get transcription result
   */
  async getTranscriptionResult(
    transcriptionId: string
  ): Promise<VoiceRecordingApiResponse<TranscriptionResponse>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/transcriptions/${transcriptionId}/result`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get transcription result:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cancel transcription
   */
  async cancelTranscription(
    transcriptionId: string
  ): Promise<VoiceRecordingApiResponse<void>> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/api/transcriptions/${transcriptionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to cancel transcription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get transcription history
   */
  async getTranscriptionHistory(
    params: {
      doctorId?: string;
      patientId?: string;
      encounterId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<VoiceRecordingApiResponse<TranscriptionResponse[]>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/transcriptions`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get transcription history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<VoiceRecordingApiResponse<any>> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('Failed to get health status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Test microphone and audio setup
   */
  async testAudioSetup(
    testAudioBlob: Blob
  ): Promise<VoiceRecordingApiResponse<{ quality: string; recommendations: string[] }>> {
    try {
      const formData = new FormData();
      const testFile = new File([testAudioBlob], 'test-audio.webm', {
        type: testAudioBlob.type
      });
      formData.append('audio', testFile);

      const response = await axios.post(
        `${this.baseURL}/api/audio/test`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to test audio setup:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get supported audio formats
   */
  async getSupportedFormats(): Promise<VoiceRecordingApiResponse<string[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/api/audio/formats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get supported formats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || error.response.data?.error || error.message;
        return new Error(`API Error: ${message}`);
      } else if (error.request) {
        // Request was made but no response received
        return new Error('Voice Recording Service is currently unavailable. Please try again later or contact support.');
      } else {
        // Something else happened
        return new Error(`Request Error: ${error.message}`);
      }
    }

    return error instanceof Error ? error : new Error('Unknown error occurred');
  }

  /**
   * Poll for transcription completion
   */
  async pollTranscriptionStatus(
    transcriptionId: string,
    onProgress?: (status: TranscriptionResponse) => void,
    maxAttempts: number = 60,
    interval: number = 2000
  ): Promise<TranscriptionResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;

          const response = await this.getTranscriptionStatus(transcriptionId);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to get transcription status');
          }

          const status = response.data;

          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            resolve(status);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(status.error || 'Transcription failed'));
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Transcription timeout: Maximum polling attempts reached'));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Create singleton instance
const voiceRecordingAPI = new VoiceRecordingAPI();

export default voiceRecordingAPI;
