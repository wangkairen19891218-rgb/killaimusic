import * as Tone from 'tone';
import { AudioTrack } from './audioTrack';
import { AudioEngine } from './audioUtils';

export interface MixerState {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  totalDuration: number;
  masterVolume: number;
  tempo: number;
  timeSignature: [number, number];
}

export class AudioMixer {
  private static instance: AudioMixer;
  private tracks: Map<string, AudioTrack> = new Map();
  private audioEngine: AudioEngine;
  private state: MixerState;
  private playbackStartTime: number = 0;
  private playbackOffset: number = 0;
  private animationFrame: number | null = null;
  private stateListeners: ((state: MixerState) => void)[] = [];

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
    this.state = {
      isPlaying: false,
      isRecording: false,
      currentTime: 0,
      totalDuration: 0,
      masterVolume: 75,
      tempo: 120,
      timeSignature: [4, 4]
    };
    
    this.setupTransport();
  }

  public static getInstance(): AudioMixer {
    if (!AudioMixer.instance) {
      AudioMixer.instance = new AudioMixer();
    }
    return AudioMixer.instance;
  }

  private setupTransport(): void {
    Tone.Transport.bpm.value = this.state.tempo;
    Tone.Transport.timeSignature = this.state.timeSignature;
    
    // Update current time during playback
    Tone.Transport.scheduleRepeat((time) => {
      this.updateCurrentTime();
    }, '16n');
  }

  public addTrack(track: AudioTrack): void {
    this.tracks.set(track.id, track);
    this.updateTotalDuration();
    this.notifyStateChange();
  }

  public removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.dispose();
      this.tracks.delete(trackId);
      this.updateTotalDuration();
      this.notifyStateChange();
    }
  }

  public getTrack(trackId: string): AudioTrack | undefined {
    return this.tracks.get(trackId);
  }

  public getAllTracks(): AudioTrack[] {
    return Array.from(this.tracks.values());
  }

  public async play(): Promise<void> {
    if (this.state.isPlaying) return;
    
    try {
      await this.audioEngine.initialize();
      
      this.playbackStartTime = Tone.now();
      this.playbackOffset = this.state.currentTime;
      
      // Start transport
      Tone.Transport.start('+0.1', this.state.currentTime);
      
      // Play all clips that should be playing at current time
      this.scheduleClipsFromCurrentTime();
      
      this.state.isPlaying = true;
      this.startTimeUpdate();
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to start playback:', error);
    }
  }

  public pause(): void {
    if (!this.state.isPlaying) return;
    
    Tone.Transport.pause();
    this.state.isPlaying = false;
    this.stopTimeUpdate();
    this.notifyStateChange();
  }

  public stop(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.playbackOffset = 0;
    
    this.stopTimeUpdate();
    this.notifyStateChange();
  }

  public seek(time: number): void {
    const wasPlaying = this.state.isPlaying;
    
    if (wasPlaying) {
      this.pause();
    }
    
    this.state.currentTime = Math.max(0, Math.min(time, this.state.totalDuration));
    this.playbackOffset = this.state.currentTime;
    
    if (wasPlaying) {
      this.play();
    } else {
      this.notifyStateChange();
    }
  }

  private scheduleClipsFromCurrentTime(): void {
    const currentTime = this.state.currentTime;
    
    this.tracks.forEach(track => {
      if (track.muted) return;
      
      track.clips.forEach(clip => {
        if (clip.muted) return;
        
        const clipStartTime = clip.startTime;
        const clipEndTime = clip.startTime + clip.duration;
        
        // If clip should be playing now or will start soon
        if (clipEndTime > currentTime) {
          const delay = Math.max(0, clipStartTime - currentTime);
          const offset = Math.max(0, currentTime - clipStartTime);
          
          setTimeout(() => {
            if (this.state.isPlaying) {
              track.playClip(clip.id, Tone.now() + delay);
            }
          }, delay * 1000);
        }
      });
    });
  }

  private startTimeUpdate(): void {
    const updateTime = () => {
      if (this.state.isPlaying) {
        this.updateCurrentTime();
        this.animationFrame = requestAnimationFrame(updateTime);
      }
    };
    updateTime();
  }

  private stopTimeUpdate(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private updateCurrentTime(): void {
    if (this.state.isPlaying) {
      const elapsed = Tone.now() - this.playbackStartTime;
      this.state.currentTime = this.playbackOffset + elapsed;
      
      // Auto-stop at end
      if (this.state.currentTime >= this.state.totalDuration) {
        this.stop();
      }
    }
  }

  private updateTotalDuration(): void {
    let maxDuration = 0;
    this.tracks.forEach(track => {
      const trackDuration = track.getTotalDuration();
      maxDuration = Math.max(maxDuration, trackDuration);
    });
    this.state.totalDuration = maxDuration;
  }

  public setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(100, volume));
    this.audioEngine.setMasterVolume(this.state.masterVolume);
    this.notifyStateChange();
  }

  public setTempo(bpm: number): void {
    this.state.tempo = Math.max(60, Math.min(200, bpm));
    Tone.Transport.bpm.value = this.state.tempo;
    this.notifyStateChange();
  }

  public setTimeSignature(numerator: number, denominator: number): void {
    this.state.timeSignature = [numerator, denominator];
    Tone.Transport.timeSignature = this.state.timeSignature;
    this.notifyStateChange();
  }

  public soloTrack(trackId: string): void {
    // Mute all other tracks
    this.tracks.forEach((track, id) => {
      if (id === trackId) {
        track.setSoloed(true);
        track.setMuted(false);
      } else {
        track.setSoloed(false);
        track.setMuted(true);
      }
    });
    this.notifyStateChange();
  }

  public unsoloAll(): void {
    this.tracks.forEach(track => {
      track.setSoloed(false);
      track.setMuted(false);
    });
    this.notifyStateChange();
  }

  public muteTrack(trackId: string, muted: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.setMuted(muted);
      this.notifyStateChange();
    }
  }

  public setTrackVolume(trackId: string, volume: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.setVolume(volume);
      this.notifyStateChange();
    }
  }

  public setTrackPan(trackId: string, pan: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.setPan(pan);
      this.notifyStateChange();
    }
  }

  // Recording functionality
  public async startRecording(): Promise<void> {
    if (this.state.isRecording) return;
    
    try {
      // Initialize recording setup
      const mediaRecorder = await this.setupRecording();
      this.state.isRecording = true;
      this.notifyStateChange();
      
      // Start recording and playback simultaneously
      await this.play();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  public stopRecording(): void {
    if (!this.state.isRecording) return;
    
    this.state.isRecording = false;
    this.pause();
    this.notifyStateChange();
  }

  private async setupRecording(): Promise<MediaRecorder> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      // Handle recorded audio blob
      this.handleRecordedAudio(blob);
    };
    
    mediaRecorder.start();
    return mediaRecorder;
  }

  private handleRecordedAudio(blob: Blob): void {
    // Convert blob to audio buffer and add as new clip
    const url = URL.createObjectURL(blob);
    console.log('Recording completed:', url);
    // Implementation for adding recorded audio to a track
  }

  // State management
  public getState(): MixerState {
    return { ...this.state };
  }

  public onStateChange(listener: (state: MixerState) => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      const index = this.stateListeners.indexOf(listener);
      if (index > -1) {
        this.stateListeners.splice(index, 1);
      }
    };
  }

  private notifyStateChange(): void {
    const state = this.getState();
    this.stateListeners.forEach(listener => listener(state));
  }

  // Export functionality
  public async exportMix(): Promise<Blob> {
    // This is a simplified version - real implementation would be more complex
    const duration = this.state.totalDuration;
    const sampleRate = 44100;
    const channels = 2;
    const length = duration * sampleRate;
    
    const audioBuffer = new AudioBuffer({
      numberOfChannels: channels,
      length,
      sampleRate
    });
    
    // Render all tracks to the buffer
    // This is a placeholder - actual implementation would render each track
    
    return new Promise((resolve) => {
      // Convert audio buffer to WAV blob
      const blob = this.audioBufferToWav(audioBuffer);
      resolve(blob);
    });
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
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
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  public dispose(): void {
    this.stop();
    this.tracks.forEach(track => track.dispose());
    this.tracks.clear();
    this.audioEngine.dispose();
  }
}