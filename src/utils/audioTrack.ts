import * as Tone from 'tone';
import { AudioEngine } from './audioUtils';

export interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  offset: number;
  volume: number;
  muted: boolean;
  buffer?: AudioBuffer;
  url?: string;
}

export interface TrackEffect {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

export class AudioTrack {
  public id: string;
  public name: string;
  public volume: number = 75;
  public pan: number = 0;
  public muted: boolean = false;
  public soloed: boolean = false;
  public clips: AudioClip[] = [];
  public effects: TrackEffect[] = [];
  
  private player: Tone.Player;
  private volumeNode: Tone.Volume;
  private panNode: Tone.Panner;
  private effectChain: Tone.ToneAudioNode[] = [];
  private audioEngine: AudioEngine;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.audioEngine = AudioEngine.getInstance();
    
    // Create audio nodes
    this.player = new Tone.Player();
    this.volumeNode = new Tone.Volume(-10);
    this.panNode = new Tone.Panner(0);
    
    // Connect the audio chain
    this.connectAudioChain();
  }

  private connectAudioChain(): void {
    // Basic chain: Player -> Effects -> Volume -> Pan -> Master
    let currentNode: Tone.ToneAudioNode = this.player;
    
    // Connect effects
    this.effectChain.forEach(effect => {
      currentNode.connect(effect);
      currentNode = effect;
    });
    
    // Connect volume and pan
    currentNode.connect(this.volumeNode);
    this.volumeNode.connect(this.panNode);
    this.panNode.connect(this.audioEngine.getLimiter());
  }

  public addClip(clip: AudioClip): void {
    this.clips.push(clip);
    this.sortClips();
  }

  public removeClip(clipId: string): void {
    this.clips = this.clips.filter(clip => clip.id !== clipId);
  }

  public updateClip(clipId: string, updates: Partial<AudioClip>): void {
    const clipIndex = this.clips.findIndex(clip => clip.id === clipId);
    if (clipIndex !== -1) {
      this.clips[clipIndex] = { ...this.clips[clipIndex], ...updates };
      this.sortClips();
    }
  }

  private sortClips(): void {
    this.clips.sort((a, b) => a.startTime - b.startTime);
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(100, volume));
    // Convert 0-100 to dB (-60 to 0)
    const dbValue = this.volume === 0 ? -60 : (this.volume - 100) * 0.6;
    this.volumeNode.volume.value = dbValue;
  }

  public setPan(pan: number): void {
    this.pan = Math.max(-100, Math.min(100, pan));
    // Convert -100 to 100 to -1 to 1
    this.panNode.pan.value = this.pan / 100;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.volumeNode.mute = muted;
  }

  public setSoloed(soloed: boolean): void {
    this.soloed = soloed;
    // Solo logic should be handled at the mixer level
  }

  public addEffect(effect: TrackEffect): void {
    this.effects.push(effect);
    this.rebuildEffectChain();
  }

  public removeEffect(effectId: string): void {
    this.effects = this.effects.filter(effect => effect.id !== effectId);
    this.rebuildEffectChain();
  }

  public updateEffect(effectId: string, updates: Partial<TrackEffect>): void {
    const effectIndex = this.effects.findIndex(effect => effect.id === effectId);
    if (effectIndex !== -1) {
      this.effects[effectIndex] = { ...this.effects[effectIndex], ...updates };
      this.rebuildEffectChain();
    }
  }

  private rebuildEffectChain(): void {
    // Dispose old effects
    this.effectChain.forEach(effect => effect.dispose());
    this.effectChain = [];
    
    // Create new effects
    this.effects.forEach(effectConfig => {
      if (!effectConfig.enabled) return;
      
      let effect: Tone.ToneAudioNode;
      
      switch (effectConfig.type) {
        case 'reverb':
          effect = new Tone.Reverb(effectConfig.parameters.roomSize || 2);
          break;
        case 'delay':
          effect = new Tone.FeedbackDelay(
            effectConfig.parameters.time || '8n',
            effectConfig.parameters.feedback || 0.3
          );
          break;
        case 'chorus':
          effect = new Tone.Chorus(
            effectConfig.parameters.frequency || 4,
            effectConfig.parameters.delayTime || 2.5,
            effectConfig.parameters.depth || 0.5
          );
          break;
        case 'distortion':
          effect = new Tone.Distortion(effectConfig.parameters.amount || 0.8);
          break;
        case 'filter':
          effect = new Tone.Filter(
            effectConfig.parameters.frequency || 1000,
            effectConfig.parameters.type || 'lowpass'
          );
          break;
        case 'compressor':
          effect = new Tone.Compressor(
            effectConfig.parameters.threshold || -30,
            effectConfig.parameters.ratio || 3
          );
          break;
        case 'eq':
          effect = new Tone.EQ3(
            effectConfig.parameters.low || 0,
            effectConfig.parameters.mid || 0,
            effectConfig.parameters.high || 0
          );
          break;
        default:
          console.warn(`Unknown effect type: ${effectConfig.type}`);
          return;
      }
      
      this.effectChain.push(effect);
    });
    
    // Reconnect the audio chain
    this.connectAudioChain();
  }

  public async loadAudioFile(file: File): Promise<AudioClip> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioContext = Tone.getContext().rawContext;
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const clip: AudioClip = {
            id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            startTime: 0,
            duration: buffer.duration,
            offset: 0,
            volume: 100,
            muted: false,
            buffer
          };
          
          resolve(clip);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  public playClip(clipId: string, startTime?: number): void {
    const clip = this.clips.find(c => c.id === clipId);
    if (!clip || !clip.buffer) return;
    
    // Create a new player for this clip
    const clipPlayer = new Tone.Player(clip.buffer);
    clipPlayer.connect(this.volumeNode);
    
    // Schedule playback
    const when = startTime || Tone.now();
    clipPlayer.start(when + clip.startTime, clip.offset, clip.duration);
    
    // Clean up after playback
    setTimeout(() => {
      clipPlayer.dispose();
    }, (clip.duration + 1) * 1000);
  }

  public getClipAtTime(time: number): AudioClip | null {
    return this.clips.find(clip => 
      time >= clip.startTime && time < clip.startTime + clip.duration
    ) || null;
  }

  public getTotalDuration(): number {
    if (this.clips.length === 0) return 0;
    return Math.max(...this.clips.map(clip => clip.startTime + clip.duration));
  }

  public dispose(): void {
    this.player.dispose();
    this.volumeNode.dispose();
    this.panNode.dispose();
    this.effectChain.forEach(effect => effect.dispose());
  }
}

// Track factory
export const createAudioTrack = (name: string): AudioTrack => {
  const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return new AudioTrack(id, name);
};

// Preset effects
export const EFFECT_PRESETS = {
  reverb: {
    hall: { roomSize: 4, decay: 3, wet: 0.3 },
    room: { roomSize: 2, decay: 1.5, wet: 0.2 },
    plate: { roomSize: 1, decay: 2, wet: 0.25 }
  },
  delay: {
    short: { time: '8n', feedback: 0.2, wet: 0.3 },
    medium: { time: '4n', feedback: 0.3, wet: 0.4 },
    long: { time: '2n', feedback: 0.4, wet: 0.5 }
  },
  distortion: {
    light: { amount: 0.3, oversample: '2x' },
    medium: { amount: 0.6, oversample: '2x' },
    heavy: { amount: 0.9, oversample: '4x' }
  }
};