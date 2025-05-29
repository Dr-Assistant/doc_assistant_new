/**
 * Voice Recording Demo Page
 * Demonstrates voice recording functionality
 */

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  Alert,
  Divider
} from '@mui/material';
import { VoiceRecorder } from '../components/voice-recording';
import { RecordingMetadata, TranscriptionResponse } from '../components/voice-recording/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`voice-recording-tabpanel-${index}`}
      aria-labelledby={`voice-recording-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const VoiceRecordingDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [recordings, setRecordings] = useState<{
    blob: Blob;
    metadata: RecordingMetadata;
    transcription?: TranscriptionResponse;
  }[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRecordingComplete = (blob: Blob, metadata: RecordingMetadata) => {
    console.log('Recording completed:', { blob, metadata });
    setRecordings(prev => [...prev, { blob, metadata }]);
  };

  const handleTranscriptionComplete = (transcription: TranscriptionResponse) => {
    console.log('Transcription completed:', transcription);
    setRecordings(prev => 
      prev.map((recording, index) => 
        index === prev.length - 1 
          ? { ...recording, transcription }
          : recording
      )
    );
  };

  const handleError = (error: string) => {
    console.error('Voice recording error:', error);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Voice Recording Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Test the voice recording functionality with different variants and configurations
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="voice recording demo tabs">
          <Tab label="Full Variant" />
          <Tab label="Compact Variant" />
          <Tab label="Minimal Variant" />
          <Tab label="Custom Config" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Full Variant
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete voice recording interface with all features enabled
          </Typography>
          
          <VoiceRecorder
            variant="full"
            size="large"
            showVisualization={true}
            showTimer={true}
            autoTranscribe={true}
            encounterId="demo-encounter-1"
            patientId="demo-patient-1"
            doctorId="demo-doctor-1"
            onRecordingStop={handleRecordingComplete}
            onTranscriptionComplete={handleTranscriptionComplete}
            onRecordingError={handleError}
            onTranscriptionError={handleError}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Compact Variant
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Compact interface suitable for integration into other components
          </Typography>
          
          <VoiceRecorder
            variant="compact"
            size="medium"
            showVisualization={true}
            showTimer={true}
            autoTranscribe={false}
            encounterId="demo-encounter-2"
            onRecordingStop={handleRecordingComplete}
            onRecordingError={handleError}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Minimal Variant
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Minimal interface with just the recording button
              </Typography>
              
              <VoiceRecorder
                variant="minimal"
                size="small"
                showTimer={true}
                autoTranscribe={false}
                onRecordingStop={handleRecordingComplete}
                onRecordingError={handleError}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Minimal (Large)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Minimal interface with larger button
              </Typography>
              
              <VoiceRecorder
                variant="minimal"
                size="large"
                showTimer={false}
                color="secondary"
                autoTranscribe={false}
                onRecordingStop={handleRecordingComplete}
                onRecordingError={handleError}
              />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Custom Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Voice recorder with custom audio configuration
          </Typography>
          
          <VoiceRecorder
            variant="full"
            size="medium"
            showVisualization={true}
            showTimer={true}
            showWaveform={true}
            autoTranscribe={true}
            config={{
              sampleRate: 48000,
              channels: 1,
              format: 'webm',
              maxDuration: 300, // 5 minutes
              minDuration: 2,
              enableVisualization: true,
              enableNoiseReduction: true
            }}
            encounterId="demo-encounter-custom"
            onRecordingStop={handleRecordingComplete}
            onTranscriptionComplete={handleTranscriptionComplete}
            onRecordingError={handleError}
            onTranscriptionError={handleError}
          />
        </Paper>
      </TabPanel>

      {/* Recording History */}
      {recordings.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h5" gutterBottom>
            Recording History
          </Typography>
          
          <Grid container spacing={2}>
            {recordings.map((recording, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Recording {index + 1}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Duration: {recording.metadata.duration.toFixed(1)}s
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Size: {(recording.metadata.size / 1024).toFixed(1)} KB
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Format: {recording.metadata.format}
                  </Typography>
                  
                  {recording.transcription && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Transcription:</strong> {recording.transcription.transcript}
                      </Typography>
                      {recording.transcription.confidence && (
                        <Typography variant="caption" display="block">
                          Confidence: {(recording.transcription.confidence * 100).toFixed(1)}%
                        </Typography>
                      )}
                    </Alert>
                  )}
                  
                  <audio 
                    controls 
                    src={URL.createObjectURL(recording.blob)}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default VoiceRecordingDemo;
