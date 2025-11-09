import * as Tone from 'tone';

// Audio context and engine management
export class AudioEngine {
  private static instance: AudioEngine;
  private isInitialized = false;
  private masterVolume: Tone.Volume;
  private limiter: Tone.Limiter;

  private constructor() {
    this.masterVolume = new Tone.Volume(-10).toDestination();
    this.limiter = new Tone.Limiter(-1).connect(this.masterVolume);
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Tone.start();
      console.log('Audio engine initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  public setMasterVolume(volume: number): void {
    // Convert 0-100 to dB (-60 to 0)
    const dbValue = volume === 0 ? -60 : (volume - 100) * 0.6;
    this.masterVolume.volume.value = dbValue;
  }

  public getMasterOutput(): Tone.Volume {
    return this.masterVolume;
  }

  public getLimiter(): Tone.Limiter {
    return this.limiter;
  }

  public dispose(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.masterVolume.dispose();
    this.limiter.dispose();
    this.isInitialized = false;
  }
}

// Audio file loading utilities
export const loadAudioBuffer = async (url: string): Promise<AudioBuffer> => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = Tone.getContext().rawContext;
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Failed to load audio buffer:', error);
    throw error;
  }
};

// Audio format validation
export const validateAudioFile = (file: File): boolean => {
  const supportedFormats = ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac'];
  return supportedFormats.includes(file.type);
};

// Time conversion utilities
export const secondsToTimeString = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const timeStringToSeconds = (timeString: string): number => {
  const [minutes, seconds] = timeString.split(':').map(Number);
  return minutes * 60 + seconds;
};

// Audio analysis utilities
export const analyzeAudioBuffer = (buffer: AudioBuffer) => {
  const channelData = buffer.getChannelData(0);
  let sum = 0;
  let peak = 0;
  
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.abs(channelData[i]);
    sum += sample * sample;
    peak = Math.max(peak, sample);
  }
  
  const rms = Math.sqrt(sum / channelData.length);
  const duration = buffer.duration;
  
  return {
    duration,
    peak,
    rms,
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels
  };
};

// Effect chain utilities
export const createEffectChain = (effects: string[]) => {
  const chain: Tone.ToneAudioNode[] = [];
  
  effects.forEach(effectType => {
    switch (effectType) {
      case 'reverb':
        chain.push(new Tone.Reverb(2));
        break;
      case 'delay':
        chain.push(new Tone.FeedbackDelay('8n', 0.3));
        break;
      case 'chorus':
        chain.push(new Tone.Chorus(4, 2.5, 0.5));
        break;
      case 'distortion':
        chain.push(new Tone.Distortion(0.8));
        break;
      case 'filter':
        chain.push(new Tone.Filter(1000, 'lowpass'));
        break;
      case 'compressor':
        chain.push(new Tone.Compressor(-30, 3));
        break;
      default:
        console.warn(`Unknown effect type: ${effectType}`);
    }
  });
  
  return chain;
};

// MIDI utilities
export const midiNoteToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

export const frequencyToMidiNote = (frequency: number): number => {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
};

// Audio export utilities
export const exportAudioBuffer = async (buffer: AudioBuffer, format: 'wav' | 'mp3' = 'wav'): Promise<Blob> => {
  if (format === 'wav') {
    return audioBufferToWav(buffer);
  }
  throw new Error('MP3 export not implemented yet');
};

const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};