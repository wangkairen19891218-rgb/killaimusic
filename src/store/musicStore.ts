import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 音轨类型
export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'instrument';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  color: string;
  effects: Effect[];
  clips: Clip[];
}

// 音频片段类型
export interface Clip {
  id: string;
  trackId: string;
  name: string;
  startTime: number;
  duration: number;
  offset: number;
  gain: number;
  fadeIn: number;
  fadeOut: number;
  audioBuffer?: AudioBuffer;
  midiData?: any;
}

// 效果器类型
export interface Effect {
  id: string;
  type: 'reverb' | 'delay' | 'chorus' | 'distortion' | 'eq' | 'compressor' | 'filter';
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

// 项目类型
export interface Project {
  id: string;
  name: string;
  bpm: number;
  timeSignature: [number, number];
  key: string;
  scale: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
  tracks: Track[];
  masterVolume: number;
  masterEffects: Effect[];
}

// AI逃避策略类型
export interface AIEvasionStrategy {
  id: string;
  name: string;
  type: 'frequency' | 'timing' | 'harmonic' | 'dynamic' | 'spectral';
  intensity: number;
  enabled: boolean;
  parameters: Record<string, any>;
}

// AI检测结果类型
export interface AIDetectionResult {
  id: string;
  timestamp: string;
  confidence: number;
  detectedModel: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface MusicStore {
  // 当前项目
  currentProject: Project | null;
  
  // 播放状态
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  
  // 选中状态
  selectedTrackId: string | null;
  selectedClipIds: string[];
  
  // 缩放和视图
  zoomLevel: number;
  viewportStart: number;
  viewportEnd: number;
  
  // AI逃避
  evasionStrategies: AIEvasionStrategy[];
  detectionResults: AIDetectionResult[];
  aiProtectionEnabled: boolean;
  
  // Actions
  setCurrentProject: (project: Project) => void;
  updateProject: (updates: Partial<Project>) => void;
  
  // 播放控制
  play: () => void;
  pause: () => void;
  stop: () => void;
  record: () => void;
  setCurrentTime: (time: number) => void;
  setLoop: (start: number, end: number, enabled: boolean) => void;
  
  // 轨道管理
  addTrack: (type: Track['type']) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  selectTrack: (trackId: string | null) => void;
  
  // 片段管理
  addClip: (trackId: string, clip: Omit<Clip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  selectClips: (clipIds: string[]) => void;
  
  // 效果器管理
  addEffect: (trackId: string | 'master', effect: Omit<Effect, 'id'>) => void;
  removeEffect: (trackId: string | 'master', effectId: string) => void;
  updateEffect: (trackId: string | 'master', effectId: string, updates: Partial<Effect>) => void;
  
  // 视图控制
  setZoom: (level: number) => void;
  setViewport: (start: number, end: number) => void;
  
  // AI逃避
  updateEvasionStrategy: (strategyId: string, updates: Partial<AIEvasionStrategy>) => void;
  addDetectionResult: (result: AIDetectionResult) => void;
  setAIProtection: (enabled: boolean) => void;
}

export const useMusicStore = create<MusicStore>()(devtools((set, get) => ({
  // 初始状态
  currentProject: null,
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  loopStart: 0,
  loopEnd: 60,
  loopEnabled: false,
  selectedTrackId: null,
  selectedClipIds: [],
  zoomLevel: 1,
  viewportStart: 0,
  viewportEnd: 60,
  evasionStrategies: [
    {
      id: '1',
      name: '频率微调',
      type: 'frequency',
      intensity: 0.3,
      enabled: true,
      parameters: { shift: 0.1, randomness: 0.05 }
    },
    {
      id: '2',
      name: '时序变化',
      type: 'timing',
      intensity: 0.2,
      enabled: false,
      parameters: { jitter: 0.02, swing: 0.1 }
    },
    {
      id: '3',
      name: '谐波调制',
      type: 'harmonic',
      intensity: 0.4,
      enabled: true,
      parameters: { depth: 0.15, rate: 0.3 }
    }
  ],
  detectionResults: [],
  aiProtectionEnabled: true,
  
  // Actions
  setCurrentProject: (project) => set({ currentProject: project }),
  
  updateProject: (updates) => set((state) => ({
    currentProject: state.currentProject ? { ...state.currentProject, ...updates } : null
  })),
  
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentTime: 0 }),
  record: () => set((state) => ({ isRecording: !state.isRecording })),
  
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setLoop: (start, end, enabled) => set({ loopStart: start, loopEnd: end, loopEnabled: enabled }),
  
  addTrack: (type) => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `${type === 'audio' ? '音频' : type === 'midi' ? 'MIDI' : '乐器'}轨道 ${get().currentProject?.tracks.length || 0 + 1}`,
      type,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      effects: [],
      clips: []
    };
    
    set((state) => ({
      currentProject: state.currentProject ? {
        ...state.currentProject,
        tracks: [...state.currentProject.tracks, newTrack]
      } : null
    }));
  },
  
  removeTrack: (trackId) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      tracks: state.currentProject.tracks.filter(t => t.id !== trackId)
    } : null,
    selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId
  })),
  
  updateTrack: (trackId, updates) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      tracks: state.currentProject.tracks.map(t => 
        t.id === trackId ? { ...t, ...updates } : t
      )
    } : null
  })),
  
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),
  
  addClip: (trackId, clip) => {
    const newClip: Clip = {
      ...clip,
      id: Date.now().toString()
    };
    
    set((state) => ({
      currentProject: state.currentProject ? {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => 
          t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
        )
      } : null
    }));
  },
  
  removeClip: (clipId) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      tracks: state.currentProject.tracks.map(t => ({
        ...t,
        clips: t.clips.filter(c => c.id !== clipId)
      }))
    } : null,
    selectedClipIds: state.selectedClipIds.filter(id => id !== clipId)
  })),
  
  updateClip: (clipId, updates) => set((state) => ({
    currentProject: state.currentProject ? {
      ...state.currentProject,
      tracks: state.currentProject.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
      }))
    } : null
  })),
  
  selectClips: (clipIds) => set({ selectedClipIds: clipIds }),
  
  addEffect: (trackId, effect) => {
    const newEffect: Effect = {
      ...effect,
      id: Date.now().toString()
    };
    
    if (trackId === 'master') {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          masterEffects: [...state.currentProject.masterEffects, newEffect]
        } : null
      }));
    } else {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(t => 
            t.id === trackId ? { ...t, effects: [...t.effects, newEffect] } : t
          )
        } : null
      }));
    }
  },
  
  removeEffect: (trackId, effectId) => {
    if (trackId === 'master') {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          masterEffects: state.currentProject.masterEffects.filter(e => e.id !== effectId)
        } : null
      }));
    } else {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(t => 
            t.id === trackId ? { ...t, effects: t.effects.filter(e => e.id !== effectId) } : t
          )
        } : null
      }));
    }
  },
  
  updateEffect: (trackId, effectId, updates) => {
    if (trackId === 'master') {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          masterEffects: state.currentProject.masterEffects.map(e => 
            e.id === effectId ? { ...e, ...updates } : e
          )
        } : null
      }));
    } else {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(t => 
            t.id === trackId ? {
              ...t,
              effects: t.effects.map(e => e.id === effectId ? { ...e, ...updates } : e)
            } : t
          )
        } : null
      }));
    }
  },
  
  setZoom: (level) => set({ zoomLevel: level }),
  
  setViewport: (start, end) => set({ viewportStart: start, viewportEnd: end }),
  
  updateEvasionStrategy: (strategyId, updates) => set((state) => ({
    evasionStrategies: state.evasionStrategies.map(s => 
      s.id === strategyId ? { ...s, ...updates } : s
    )
  })),
  
  addDetectionResult: (result) => set((state) => ({
    detectionResults: [result, ...state.detectionResults].slice(0, 50) // 保留最近50条记录
  })),
  
  setAIProtection: (enabled) => set({ aiProtectionEnabled: enabled })
}), { name: 'music-store' }));