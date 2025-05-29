/**
 * Audio Visualizer Component
 * Displays real-time audio visualization during recording
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { AudioVisualizerProps, AudioVisualizationData } from '../types';

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioContext,
  analyser,
  isRecording,
  width = 300,
  height = 100,
  barCount = 32,
  barWidth = 4,
  barSpacing = 2,
  color,
  backgroundColor,
  showFrequency = true,
  showWaveform = false,
  animationSpeed = 50,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const theme = useTheme();

  // Use theme colors if not provided
  const visualizerColor = color || theme.palette.primary.main;
  const bgColor = backgroundColor || theme.palette.background.paper;

  /**
   * Draw frequency bars
   */
  const drawFrequencyBars = useCallback((
    ctx: CanvasRenderingContext2D,
    frequencyData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const barWidth = (canvasWidth - (barCount - 1) * barSpacing) / barCount;
    const dataStep = Math.floor(frequencyData.length / barCount);

    ctx.fillStyle = visualizerColor;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = frequencyData[dataIndex] || 0;
      const barHeight = (value / 255) * canvasHeight * 0.8;
      
      const x = i * (barWidth + barSpacing);
      const y = canvasHeight - barHeight;

      // Add gradient effect
      const gradient = ctx.createLinearGradient(0, y, 0, canvasHeight);
      gradient.addColorStop(0, visualizerColor);
      gradient.addColorStop(1, visualizerColor + '80'); // Add transparency
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [visualizerColor, barCount, barSpacing]);

  /**
   * Draw waveform
   */
  const drawWaveform = useCallback((
    ctx: CanvasRenderingContext2D,
    timeData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    ctx.strokeStyle = visualizerColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvasWidth / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const value = timeData[i] / 128.0;
      const y = (value * canvasHeight) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }, [visualizerColor]);

  /**
   * Draw idle state
   */
  const drawIdleState = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const barWidth = (canvasWidth - (barCount - 1) * barSpacing) / barCount;
    
    ctx.fillStyle = visualizerColor + '30'; // Very transparent

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + barSpacing);
      const baseHeight = 4;
      const y = canvasHeight - baseHeight;

      ctx.fillRect(x, y, barWidth, baseHeight);
    }
  }, [visualizerColor, barCount, barSpacing]);

  /**
   * Animation loop
   */
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isRecording && analyser) {
      // Get audio data
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.frequencyBinCount);
      
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeData);

      // Draw visualization
      if (showFrequency) {
        drawFrequencyBars(ctx, frequencyData, canvas.width, canvas.height);
      }
      
      if (showWaveform) {
        drawWaveform(ctx, timeData, canvas.width, canvas.height);
      }
    } else {
      // Draw idle state
      drawIdleState(ctx, canvas.width, canvas.height);
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  }, [
    isRecording,
    analyser,
    bgColor,
    showFrequency,
    showWaveform,
    drawFrequencyBars,
    drawWaveform,
    drawIdleState
  ]);

  /**
   * Start animation
   */
  const startAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animate();
  }, [animate]);

  /**
   * Stop animation
   */
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, []);

  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set canvas style size for proper scaling
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Start animation
    startAnimation();

    return () => {
      stopAnimation();
    };
  }, [width, height, startAnimation, stopAnimation]);

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      startAnimation();
    }
  }, [isRecording, startAnimation]);

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: bgColor,
        border: `1px solid ${theme.palette.divider}`,
        ...(!isRecording && {
          opacity: 0.6
        })
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: theme.shape.borderRadius
        }}
      />
    </Box>
  );
};

export default AudioVisualizer;
