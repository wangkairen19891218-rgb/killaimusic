import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Headphones, Settings, Plus, Trash2, Play, Pause, Square } from 'lucide-react';
import { Waveform } from './AudioVisualizer';
import EffectChain from './EffectChain';

interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  offset: number; // Start offset within the audio file
}

interface EffectConfig {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
  order: number;
}

interface AudioTrackProps {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  clips: AudioClip[];
  effects: EffectConfig[];
  isPlaying?: boolean;
  currentTime?: number;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onNameChange: (name: string) => void;
  onClipsChange: (clips: AudioClip[]) => void;
  onEffectsChange: (effects: EffectConfig[]) => void;
  onClipPlay?: (clipId: string) => void;
  onClipStop?: (clipId: string) => void;
  onDeleteTrack?: () => void;
  timelineWidth?: number;
  pixelsPerSecond?: number;
  className?: string;
}

export const AudioTrackComponent: React.FC<AudioTrackProps> = ({
  id,
  name,
  volume,
  pan,
  muted,
  solo,
  clips,
  effects,
  isPlaying = false,
  currentTime = 0,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onNameChange,
  onClipsChange,
  onEffectsChange,
  onClipPlay,
  onClipStop,
  onDeleteTrack,
  timelineWidth = 800,
  pixelsPerSecond = 50,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [draggedClip, setDraggedClip] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const TRACK_HEIGHT = 80;
  const EXPANDED_HEIGHT = 160;
  const CONTROL_WIDTH = 200;

  useEffect(() => {
    setEditedName(name);
  }, [name]);

  const handleNameSubmit = () => {
    onNameChange(editedName.trim() || 'Untitled Track');
    setIsEditingName(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const newClip: AudioClip = {
          id: `clip_${Date.now()}_${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          startTime: currentTime,
          duration: audioBuffer.duration,
          audioBuffer,
          volume: 1,
          fadeIn: 0,
          fadeOut: 0,
          offset: 0
        };

        onClipsChange([...clips, newClip]);
      } catch (error) {
        console.error('Error loading audio file:', error);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClipDragStart = (clipId: string, event: React.MouseEvent) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    setDraggedClip(clipId);
    setSelectedClip(clipId);
    
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  };

  const handleClipDrag = (event: React.MouseEvent) => {
    if (!draggedClip || !trackRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const timelineX = event.clientX - trackRect.left - CONTROL_WIDTH - dragOffset.x;
    const newStartTime = Math.max(0, timelineX / pixelsPerSecond);

    const updatedClips = clips.map(clip =>
      clip.id === draggedClip
        ? { ...clip, startTime: newStartTime }
        : clip
    );

    onClipsChange(updatedClips);
  };

  const handleClipDragEnd = () => {
    setDraggedClip(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleClipResize = (clipId: string, newDuration: number, resizeType: 'start' | 'end') => {
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        if (resizeType === 'end') {
          return { ...clip, duration: Math.max(0.1, newDuration) };
        } else {
          // Resizing from start - adjust both startTime and duration
          const endTime = clip.startTime + clip.duration;
          const newStartTime = endTime - newDuration;
          return {
            ...clip,
            startTime: Math.max(0, newStartTime),
            duration: Math.max(0.1, newDuration)
          };
        }
      }
      return clip;
    });

    onClipsChange(updatedClips);
  };

  const deleteClip = (clipId: string) => {
    const updatedClips = clips.filter(clip => clip.id !== clipId);
    onClipsChange(updatedClips);
    if (selectedClip === clipId) {
      setSelectedClip(null);
    }
  };

  const duplicateClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    const newClip: AudioClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random()}`,
      name: `${clip.name} (Copy)`,
      startTime: clip.startTime + clip.duration + 0.1
    };

    onClipsChange([...clips, newClip]);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatVolume = (vol: number): string => {
    const db = vol === 0 ? -Infinity : 20 * Math.log10(vol);
    return db === -Infinity ? '-∞ dB' : `${db.toFixed(1)} dB`;
  };

  const formatPan = (panValue: number): string => {
    if (panValue === 0) return 'Center';
    const percentage = Math.abs(panValue * 100);
    const direction = panValue > 0 ? 'R' : 'L';
    return `${percentage.toFixed(0)}% ${direction}`;
  };

  const renderClip = (clip: AudioClip) => {
    const clipX = clip.startTime * pixelsPerSecond;
    const clipWidth = clip.duration * pixelsPerSecond;
    const isSelected = selectedClip === clip.id;
    const isDragging = draggedClip === clip.id;

    return (
      <div
        key={clip.id}
        className={`absolute bg-blue-500/80 border border-blue-400 rounded cursor-move transition-all ${
          isSelected ? 'ring-2 ring-blue-300 z-10' : 'z-0'
        } ${isDragging ? 'opacity-70' : ''}`}
        style={{
          left: clipX,
          width: clipWidth,
          height: isExpanded ? EXPANDED_HEIGHT - 40 : TRACK_HEIGHT - 20,
          top: 10
        }}
        onMouseDown={(e) => handleClipDragStart(clip.id, e)}
        onMouseMove={draggedClip === clip.id ? handleClipDrag : undefined}
        onMouseUp={handleClipDragEnd}
        onClick={() => setSelectedClip(clip.id)}
        onDoubleClick={() => onClipPlay?.(clip.id)}
      >
        {/* Clip Content */}
        <div className="p-1 h-full flex flex-col justify-between text-white text-xs overflow-hidden">
          <div className="font-medium truncate">{clip.name}</div>
          
          {/* Waveform */}
          {isExpanded && clip.audioBuffer && (
            <div className="flex-1 mt-1">
              <Waveform
                audioBuffer={clip.audioBuffer}
                currentTime={Math.max(0, currentTime - clip.startTime)}
                duration={clip.duration}
                width={Math.max(50, clipWidth - 4)}
                height={60}
                className="rounded"
              />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span>{formatTime(clip.startTime)}</span>
            <span>{formatTime(clip.duration)}</span>
          </div>
        </div>

        {/* Resize handles */}
        <div
          className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300/50 hover:bg-blue-300"
          onMouseDown={(e) => {
            e.stopPropagation();
            // Handle start resize
          }}
        />
        <div
          className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-300/50 hover:bg-blue-300"
          onMouseDown={(e) => {
            e.stopPropagation();
            // Handle end resize
          }}
        />

        {/* Clip controls (visible when selected) */}
        {isSelected && (
          <div className="absolute -top-8 left-0 flex gap-1 bg-popover border border-border rounded px-2 py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClipPlay?.(clip.id);
              }}
              className="p-1 hover:bg-accent rounded"
              title="Play clip"
            >
              <Play size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateClip(clip.id);
              }}
              className="p-1 hover:bg-accent rounded"
              title="Duplicate clip"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteClip(clip.id);
              }}
              className="p-1 hover:bg-accent rounded text-red-500"
              title="Delete clip"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`audio-track border-b border-border ${className}`} ref={trackRef}>
      <div className="flex">
        {/* Track Controls */}
        <div 
          className="bg-card border-r border-border p-3 flex flex-col justify-between"
          style={{ width: CONTROL_WIDTH, height: isExpanded ? EXPANDED_HEIGHT : TRACK_HEIGHT }}
        >
          {/* Track Header */}
          <div className="space-y-2">
            {/* Track Name */}
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSubmit();
                    if (e.key === 'Escape') {
                      setEditedName(name);
                      setIsEditingName(false);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                  autoFocus
                />
              ) : (
                <h3
                  className="flex-1 font-medium text-sm cursor-pointer hover:text-primary"
                  onClick={() => setIsEditingName(true)}
                >
                  {name}
                </h3>
              )}
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-accent rounded"
                title={isExpanded ? 'Collapse track' : 'Expand track'}
              >
                <Settings size={14} />
              </button>
            </div>

            {/* Mute/Solo/Record */}
            <div className="flex gap-1">
              <button
                onClick={onMuteToggle}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  muted
                    ? 'bg-red-500 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {muted ? <VolumeX size={12} /> : 'M'}
              </button>
              
              <button
                onClick={onSoloToggle}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  solo
                    ? 'bg-yellow-500 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {solo ? <Headphones size={12} /> : 'S'}
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Add audio file"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Volume and Pan Controls */}
          <div className="space-y-2">
            {/* Volume */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs text-muted-foreground">Volume</label>
                <span className="text-xs text-muted-foreground">{formatVolume(volume)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Pan */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs text-muted-foreground">Pan</label>
                <span className="text-xs text-muted-foreground">{formatPan(pan)}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={pan}
                onChange={(e) => onPanChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Track Actions */}
          <div className="flex gap-1">
            <button
              onClick={() => setShowEffects(!showEffects)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showEffects
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              FX
            </button>
            
            {onDeleteTrack && (
              <button
                onClick={onDeleteTrack}
                className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                title="Delete track"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Timeline Area */}
        <div 
          className="flex-1 bg-background relative overflow-hidden"
          style={{ height: isExpanded ? EXPANDED_HEIGHT : TRACK_HEIGHT }}
        >
          {/* Timeline Grid */}
          <div className="absolute inset-0">
            {Array.from({ length: Math.ceil(timelineWidth / pixelsPerSecond) }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-border/30"
                style={{ left: i * pixelsPerSecond }}
              />
            ))}
          </div>

          {/* Audio Clips */}
          <div className="relative h-full">
            {clips.map(renderClip)}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ left: currentTime * pixelsPerSecond }}
          />
        </div>
      </div>

      {/* Effects Panel */}
      {showEffects && (
        <div className="border-t border-border bg-card/50">
          <EffectChain
            effects={effects}
            onEffectsChange={onEffectsChange}
            className="p-4"
          />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default AudioTrackComponent;