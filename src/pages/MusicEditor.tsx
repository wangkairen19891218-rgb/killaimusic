import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  Mic,
  Headphones,
  Settings,
  Save,
  Download,
  Upload,
  Plus,
  Minus,
  Scissors,
  Copy,
  Trash2,
  Layers,
  Sliders,
  Music,
  ArrowLeft,
  Maximize2,
  Grid3X3,
  Zap,
  Circle,
  Clock
} from 'lucide-react';
import AudioTrackComponent from '../components/AudioTrackComponent';
import AudioVisualizer from '../components/AudioVisualizer';
import MidiEditor from '../components/MidiEditor';
import * as Tone from 'tone';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'instrument';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
  effects: Effect[];
  clips: any[];
}

interface Effect {
  id: string;
  name: string;
  type: 'reverb' | 'delay' | 'eq' | 'compressor' | 'distortion';
  enabled: boolean;
  parameters: Record<string, number>;
  order: number;
}

const MusicEditor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240); // 4 minutes
  const [zoom, setZoom] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [showMixer, setShowMixer] = useState(false);
  const [showMidiEditor, setShowMidiEditor] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [isRecording, setIsRecording] = useState(false);

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      if (!audioContext) {
        await Tone.start();
        setAudioContext(Tone.getContext().rawContext as AudioContext);
      }
    };
    initAudio();
  }, [audioContext]);
  
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      name: '主旋律',
      type: 'midi',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      color: '#3B82F6',
      effects: [],
      clips: []
    },
    {
      id: '2',
      name: '鼓组',
      type: 'audio',
      volume: 0.9,
      pan: 0,
      muted: false,
      solo: false,
      color: '#EF4444',
      effects: [],
      clips: []
    },
    {
      id: '3',
      name: '贝斯',
      type: 'instrument',
      volume: 0.7,
      pan: -0.2,
      muted: false,
      solo: false,
      color: '#10B981',
      effects: [],
      clips: []
    }
  ]);

  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!isPlaying && Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleAddTrack = () => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `轨道 ${tracks.length + 1}`,
      type: 'audio',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      effects: [],
      clips: []
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (trackId: string) => {
    setTracks(tracks.filter(track => track.id !== trackId));
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
  };

  const handleTrackMute = (trackId: string) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  };

  const handleTrackSolo = (trackId: string) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, solo: !track.solo } : track
    ));
  };

  const handleDeleteTrack = (trackId: string) => {
    setTracks(tracks.filter(track => track.id !== trackId));
  };

  const handleTrackUpdate = (trackId: string, updates: any) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
  };

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-primary-800/30 bg-background-secondary/50 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <Music className="w-6 h-6 text-primary-400" />
              <h1 className="text-xl font-semibold text-foreground">
                {projectId === 'new' ? '新项目' : `项目 ${projectId}`}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="btn-ghost px-3 py-2 text-sm">
              <Upload className="w-4 h-4 mr-1" />
              导入
            </button>
            <button className="btn-ghost px-3 py-2 text-sm">
              <Save className="w-4 h-4 mr-1" />
              保存
            </button>
            <button className="btn-primary px-3 py-2 text-sm">
              <Download className="w-4 h-4 mr-1" />
              导出
            </button>
            <button 
              className="btn-ghost p-2"
              onClick={() => setShowMixer(!showMixer)}
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Transport Controls */}
          <div className="border-b border-primary-800/30 bg-background-secondary/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button className="btn-ghost p-2" onClick={handleStop}>
                    <Square className="w-5 h-5" />
                  </button>
                  <button className="btn-primary p-2" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button className="btn-ghost p-2">
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-foreground font-mono text-lg">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-foreground-muted">/</span>
                  <span className="text-foreground-muted font-mono">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-foreground-muted" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-foreground-muted w-8">
                    {Math.round(masterVolume * 100)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    className="btn-ghost p-1"
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-foreground-muted w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    className="btn-ghost p-1"
                    onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline and Tracks */}
          <div className="flex-1 bg-background border border-border rounded-lg overflow-hidden">
            {/* Timeline Header */}
            <div className="h-12 bg-card border-b border-border flex items-center px-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Timeline</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Time:</span>
                  <span className="text-sm font-mono">
                    {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}.{Math.floor((currentTime % 1) * 100).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Zoom:</span>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={pixelsPerSecond}
                    onChange={(e) => setPixelsPerSecond(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">{pixelsPerSecond}px/s</span>
                </div>
                <button
                  onClick={() => setShowMidiEditor(!showMidiEditor)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    showMidiEditor
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  MIDI Editor
                </button>
              </div>
            </div>

            {/* Tracks Area */}
            <div className="flex-1 overflow-auto">
              {tracks.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="mb-2">No tracks yet</p>
                    <button
                      onClick={handleAddTrack}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add First Track
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {tracks.map((track) => (
                    <AudioTrackComponent
                      key={track.id}
                      id={track.id}
                      name={track.name}
                      volume={track.volume}
                      pan={track.pan}
                      muted={track.muted}
                      solo={track.solo}
                      clips={track.clips}
                      effects={track.effects}
                      isPlaying={isPlaying}
                      currentTime={currentTime}
                      onVolumeChange={(volume) => handleTrackUpdate(track.id, { volume })}
                      onPanChange={(pan) => handleTrackUpdate(track.id, { pan })}
                      onMuteToggle={() => handleTrackUpdate(track.id, { muted: !track.muted })}
                      onSoloToggle={() => handleTrackUpdate(track.id, { solo: !track.solo })}
                      onNameChange={(name) => handleTrackUpdate(track.id, { name })}
                      onClipsChange={(clips) => handleTrackUpdate(track.id, { clips })}
                      onEffectsChange={(effects) => handleTrackUpdate(track.id, { effects })}
                      onDeleteTrack={() => removeTrack(track.id)}
                      timelineWidth={800}
                      pixelsPerSecond={pixelsPerSecond}
                      className={selectedTrack === track.id ? 'bg-accent/20' : ''}
                      onClipPlay={(clipId) => {
                        console.log('Play clip:', clipId);
                      }}
                      onClipStop={(clipId) => {
                        console.log('Stop clip:', clipId);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Mixer/MIDI Editor */}
        {(showMixer || showMidiEditor) && (
          <div className="w-80 bg-card border border-border rounded-lg overflow-hidden">
            {/* Panel Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => {
                  setShowMixer(true);
                  setShowMidiEditor(false);
                }}
                className={`flex-1 px-4 py-2 text-sm transition-colors ${
                  showMixer && !showMidiEditor
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mixer
              </button>
              <button
                onClick={() => {
                  setShowMidiEditor(true);
                  setShowMixer(false);
                }}
                className={`flex-1 px-4 py-2 text-sm transition-colors ${
                  showMidiEditor && !showMixer
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                MIDI
              </button>
              <button
                onClick={() => {
                  setShowMixer(false);
                  setShowMidiEditor(false);
                }}
                className="p-2 hover:bg-accent"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 h-full overflow-auto">
              {/* Mixer Panel */}
              {showMixer && !showMidiEditor && (
                <div>
                  {/* Master Section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3">Master</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Volume</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(masterVolume * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.01"
                          value={masterVolume}
                          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      {/* Master Visualizer */}
                      <div className="mt-4">
                        <AudioVisualizer
                          type="spectrum"
                          isPlaying={isPlaying}
                          width={240}
                          height={100}
                          className="rounded border border-border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Track Mixers */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Tracks</h4>
                    {tracks.map((track) => (
                      <div key={track.id} className="p-3 bg-background rounded border border-border">
                        <h5 className="text-sm font-medium mb-3">{track.name}</h5>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Volume</span>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(track.volume * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              step="0.01"
                              value={track.volume}
                              onChange={(e) => handleTrackUpdate(track.id, { volume: parseFloat(e.target.value) })}
                              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Pan</span>
                              <span className="text-xs text-muted-foreground">
                                {track.pan === 0 ? 'Center' : track.pan > 0 ? `R${Math.round(track.pan * 100)}%` : `L${Math.round(Math.abs(track.pan) * 100)}%`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-1"
                              max="1"
                              step="0.01"
                              value={track.pan}
                              onChange={(e) => handleTrackUpdate(track.id, { pan: parseFloat(e.target.value) })}
                              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTrackUpdate(track.id, { muted: !track.muted })}
                              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                track.muted ? 'bg-red-500 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              Mute
                            </button>
                            <button
                              onClick={() => handleTrackUpdate(track.id, { solo: !track.solo })}
                              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                track.solo ? 'bg-yellow-500 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              Solo
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MIDI Editor Panel */}
              {showMidiEditor && !showMixer && (
                <div className="h-full">
                  <MidiEditor
                    notes={[]} // You would get this from the selected track
                    onNotesChange={(notes) => {
                      console.log('MIDI notes changed:', notes);
                    }}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    onPlay={handlePlayPause}
                    onPause={handlePause}
                    onStop={handleStop}
                    onSeek={handleSeek}
                    width={320}
                    height={400}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel - Transport Controls */}
      <div className="h-16 bg-card border-t border-border flex items-center justify-between px-4">
        {/* Left Section - Transport Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleStop}
              className="p-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-2 rounded transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Circle className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Center Section - Project Info */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            <span>{tracks.length} tracks</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{tempo} BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span>Master: {Math.round(masterVolume * 100)}%</span>
          </div>
        </div>

        {/* Right Section - Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddTrack}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
          >
            Add Track
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Tempo:</label>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="w-16 px-2 py-1 text-sm bg-background border border-border rounded"
              min="60"
              max="200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Time:</label>
            <select
              value={`${timeSignature.numerator}/${timeSignature.denominator}`}
              onChange={(e) => {
                const [num, den] = e.target.value.split('/').map(Number);
                setTimeSignature({ numerator: num, denominator: den });
              }}
              className="px-2 py-1 text-sm bg-background border border-border rounded"
            >
              <option value="4/4">4/4</option>
              <option value="3/4">3/4</option>
              <option value="2/4">2/4</option>
              <option value="6/8">6/8</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicEditor;