import React, { useRef, useEffect, useState } from 'react';
import * as Tone from 'tone';

interface AudioVisualizerProps {
  audioBuffer?: AudioBuffer;
  isPlaying?: boolean;
  currentTime?: number;
  width?: number;
  height?: number;
  type?: 'waveform' | 'spectrum';
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioBuffer,
  isPlaying = false,
  currentTime = 0,
  width = 800,
  height = 200,
  type = 'waveform',
  color = '#3b82f6',
  backgroundColor = '#1f2937',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<Tone.Analyser>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (type === 'spectrum' && !analyzerRef.current) {
      // Create analyzer for real-time spectrum analysis
      analyzerRef.current = new Tone.Analyser('fft', 1024);
      Tone.getDestination().connect(analyzerRef.current);
      setIsInitialized(true);
    }
  }, [type]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    if (type === 'waveform' && audioBuffer) {
      drawWaveform(ctx, audioBuffer, currentTime);
    } else if (type === 'spectrum' && isPlaying && analyzerRef.current) {
      drawSpectrum(ctx);
    } else {
      clearCanvas(ctx);
    }
  }, [audioBuffer, currentTime, width, height, type, isPlaying]);

  useEffect(() => {
    if (type === 'spectrum' && isPlaying && analyzerRef.current) {
      startSpectrumAnimation();
    } else {
      stopSpectrumAnimation();
    }

    return () => stopSpectrumAnimation();
  }, [type, isPlaying]);

  const clearCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, buffer: AudioBuffer, playTime: number) => {
    clearCanvas(ctx);

    const channelData = buffer.getChannelData(0);
    const samplesPerPixel = channelData.length / width;
    const amplitude = height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Draw waveform
    for (let x = 0; x < width; x++) {
      const sampleIndex = Math.floor(x * samplesPerPixel);
      const sample = channelData[sampleIndex] || 0;
      const y = amplitude + (sample * amplitude * 0.8);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw playhead
    if (buffer.duration > 0) {
      const playheadX = (playTime / buffer.duration) * width;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

    // Draw time markers
    drawTimeMarkers(ctx, buffer.duration);
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D) => {
    if (!analyzerRef.current) return;

    clearCanvas(ctx);

    const frequencyData = analyzerRef.current.getValue() as Float32Array;
    const barWidth = width / frequencyData.length;

    ctx.fillStyle = color;

    for (let i = 0; i < frequencyData.length; i++) {
      // Convert dB to height (assuming -100dB to 0dB range)
      const dbValue = frequencyData[i];
      const normalizedHeight = Math.max(0, (dbValue + 100) / 100);
      const barHeight = normalizedHeight * height;

      const x = i * barWidth;
      const y = height - barHeight;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    // Draw frequency labels
    drawFrequencyLabels(ctx);
  };

  const drawTimeMarkers = (ctx: CanvasRenderingContext2D, duration: number) => {
    const markerInterval = Math.max(1, Math.floor(duration / 10)); // Show ~10 markers
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    for (let time = 0; time <= duration; time += markerInterval) {
      const x = (time / duration) * width;
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Draw marker line
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, height - 20);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw time label
      ctx.fillText(timeLabel, x, height - 5);
    }
  };

  const drawFrequencyLabels = (ctx: CanvasRenderingContext2D) => {
    const frequencies = [60, 250, 1000, 4000, 16000]; // Key frequencies in Hz
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    frequencies.forEach((freq, index) => {
      const x = (index / (frequencies.length - 1)) * width;
      const label = freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`;
      
      ctx.fillText(label, x, height - 5);
    });
  };

  const startSpectrumAnimation = () => {
    const animate = () => {
      if (canvasRef.current && analyzerRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawSpectrum(ctx);
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopSpectrumAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (type === 'waveform' && audioBuffer) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const clickTime = (x / width) * audioBuffer.duration;
      
      // Emit seek event (you can add a callback prop for this)
      console.log('Seek to time:', clickTime);
    }
  };

  return (
    <div className={`audio-visualizer ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="cursor-pointer border border-border rounded"
        style={{
          backgroundColor,
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

// Waveform component specifically for audio clips
interface WaveformProps {
  audioBuffer?: AudioBuffer;
  currentTime?: number;
  duration?: number;
  width?: number;
  height?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  audioBuffer,
  currentTime = 0,
  duration = 0,
  width = 400,
  height = 80,
  onSeek,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    if (audioBuffer) {
      drawMiniWaveform(ctx, audioBuffer);
    } else if (duration > 0) {
      drawPlaceholderWaveform(ctx, duration);
    }

    // Draw playhead
    if (duration > 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [audioBuffer, currentTime, duration, width, height]);

  const drawMiniWaveform = (ctx: CanvasRenderingContext2D, buffer: AudioBuffer) => {
    const channelData = buffer.getChannelData(0);
    const samplesPerPixel = channelData.length / width;
    const amplitude = height / 2;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const sampleIndex = Math.floor(x * samplesPerPixel);
      const sample = channelData[sampleIndex] || 0;
      const y = amplitude + (sample * amplitude * 0.8);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  const drawPlaceholderWaveform = (ctx: CanvasRenderingContext2D, duration: number) => {
    const amplitude = height / 2;
    const frequency = 0.02; // Adjust for desired wave frequency

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const time = (x / width) * duration;
      const y = amplitude + Math.sin(time * frequency) * amplitude * 0.3;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || duration === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickTime = (x / width) * duration;
    
    onSeek(Math.max(0, Math.min(clickTime, duration)));
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className={`cursor-pointer border border-border rounded ${className}`}
      style={{
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );
};

export default AudioVisualizer;