import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface MidiNote {
  id: string;
  note: number; // MIDI note number (0-127)
  velocity: number; // 0-127
  startTime: number; // in beats
  duration: number; // in beats
  channel: number; // MIDI channel (0-15)
}

interface MidiEditorProps {
  notes: MidiNote[];
  onNotesChange: (notes: MidiNote[]) => void;
  isPlaying?: boolean;
  currentTime?: number; // in beats
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSeek?: (time: number) => void;
  width?: number;
  height?: number;
  beatsPerMeasure?: number;
  noteRange?: { min: number; max: number };
  snapToGrid?: boolean;
  gridResolution?: number; // beats per grid line
  className?: string;
}

export const MidiEditor: React.FC<MidiEditorProps> = ({
  notes,
  onNotesChange,
  isPlaying = false,
  currentTime = 0,
  onPlay,
  onPause,
  onStop,
  onSeek,
  width = 800,
  height = 400,
  beatsPerMeasure = 4,
  noteRange = { min: 36, max: 96 }, // C2 to C7
  snapToGrid = true,
  gridResolution = 0.25, // 16th notes
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState({ x: 1, y: 1 });

  // Constants for drawing
  const PIANO_KEY_WIDTH = 60;
  const NOTE_HEIGHT = 12;
  const BEAT_WIDTH = 40;
  const HEADER_HEIGHT = 30;

  const totalNotes = noteRange.max - noteRange.min + 1;
  const pianoHeight = totalNotes * NOTE_HEIGHT;
  const timelineWidth = width - PIANO_KEY_WIDTH;

  useEffect(() => {
    drawEditor();
  }, [notes, selectedNotes, currentTime, viewOffset, zoom, width, height]);

  const drawEditor = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Draw timeline header
    drawTimelineHeader(ctx);

    // Draw piano roll
    drawPianoRoll(ctx);

    // Draw grid
    drawGrid(ctx);

    // Draw notes
    drawNotes(ctx);

    // Draw playhead
    drawPlayhead(ctx);

    // Draw selection
    if (selectedNotes.size > 0) {
      drawSelection(ctx);
    }
  };

  const drawTimelineHeader = (ctx: CanvasRenderingContext2D) => {
    const headerY = 0;
    const headerHeight = HEADER_HEIGHT;

    // Background
    ctx.fillStyle = '#374151';
    ctx.fillRect(PIANO_KEY_WIDTH, headerY, timelineWidth, headerHeight);

    // Beat markers
    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    const beatsVisible = Math.ceil(timelineWidth / (BEAT_WIDTH * zoom.x));
    const startBeat = Math.floor(viewOffset.x / (BEAT_WIDTH * zoom.x));

    for (let beat = startBeat; beat < startBeat + beatsVisible + 1; beat++) {
      const x = PIANO_KEY_WIDTH + (beat * BEAT_WIDTH * zoom.x) - viewOffset.x;
      
      if (x >= PIANO_KEY_WIDTH && x <= width) {
        // Draw beat number
        const measure = Math.floor(beat / beatsPerMeasure) + 1;
        const beatInMeasure = (beat % beatsPerMeasure) + 1;
        const label = `${measure}.${beatInMeasure}`;
        
        ctx.fillText(label, x, headerHeight - 5);
        
        // Draw beat line
        ctx.strokeStyle = beat % beatsPerMeasure === 0 ? '#6b7280' : '#4b5563';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, headerHeight);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  };

  const drawPianoRoll = (ctx: CanvasRenderingContext2D) => {
    const pianoX = 0;
    const pianoY = HEADER_HEIGHT;
    const availableHeight = height - HEADER_HEIGHT;
    const noteHeight = availableHeight / totalNotes;

    // Background
    ctx.fillStyle = '#374151';
    ctx.fillRect(pianoX, pianoY, PIANO_KEY_WIDTH, availableHeight);

    // Draw piano keys
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i < totalNotes; i++) {
      const noteNumber = noteRange.max - i;
      const y = pianoY + (i * noteHeight);
      const isBlackKey = isBlackNote(noteNumber);
      
      // Key background
      ctx.fillStyle = isBlackKey ? '#1f2937' : '#f3f4f6';
      ctx.fillRect(pianoX, y, PIANO_KEY_WIDTH, noteHeight);
      
      // Key border
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.strokeRect(pianoX, y, PIANO_KEY_WIDTH, noteHeight);
      
      // Note name
      if (noteHeight > 10) {
        ctx.fillStyle = isBlackKey ? '#f3f4f6' : '#1f2937';
        const noteName = getNoteNameFromMidi(noteNumber);
        ctx.fillText(noteName, pianoX + PIANO_KEY_WIDTH / 2, y + noteHeight / 2 + 3);
      }
      
      // Horizontal grid line for note row
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PIANO_KEY_WIDTH, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridY = HEADER_HEIGHT;
    const availableHeight = height - HEADER_HEIGHT;
    
    // Vertical grid lines (sub-beats)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    const subBeatsVisible = Math.ceil(timelineWidth / (BEAT_WIDTH * zoom.x * gridResolution));
    const startSubBeat = Math.floor(viewOffset.x / (BEAT_WIDTH * zoom.x * gridResolution));
    
    for (let subBeat = startSubBeat; subBeat < startSubBeat + subBeatsVisible + 1; subBeat++) {
      const x = PIANO_KEY_WIDTH + (subBeat * BEAT_WIDTH * zoom.x * gridResolution) - viewOffset.x;
      
      if (x >= PIANO_KEY_WIDTH && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, gridY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  };

  const drawNotes = (ctx: CanvasRenderingContext2D) => {
    const noteY = HEADER_HEIGHT;
    const availableHeight = height - HEADER_HEIGHT;
    const noteHeight = availableHeight / totalNotes;
    
    notes.forEach(note => {
      const x = PIANO_KEY_WIDTH + (note.startTime * BEAT_WIDTH * zoom.x) - viewOffset.x;
      const y = noteY + ((noteRange.max - note.note) * noteHeight);
      const noteWidth = note.duration * BEAT_WIDTH * zoom.x;
      
      // Only draw if note is visible
      if (x + noteWidth >= PIANO_KEY_WIDTH && x <= width && y + noteHeight >= noteY && y <= height) {
        const isSelected = selectedNotes.has(note.id);
        
        // Note background
        const alpha = note.velocity / 127;
        ctx.fillStyle = isSelected 
          ? `rgba(239, 68, 68, ${alpha})` 
          : `rgba(59, 130, 246, ${alpha})`;
        ctx.fillRect(x, y, noteWidth, noteHeight);
        
        // Note border
        ctx.strokeStyle = isSelected ? '#ef4444' : '#3b82f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, noteWidth, noteHeight);
        
        // Note name (if space allows)
        if (noteWidth > 30 && noteHeight > 10) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '9px monospace';
          ctx.textAlign = 'left';
          const noteName = getNoteNameFromMidi(note.note);
          ctx.fillText(noteName, x + 2, y + noteHeight / 2 + 3);
        }
      }
    });
  };

  const drawPlayhead = (ctx: CanvasRenderingContext2D) => {
    const x = PIANO_KEY_WIDTH + (currentTime * BEAT_WIDTH * zoom.x) - viewOffset.x;
    
    if (x >= PIANO_KEY_WIDTH && x <= width) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const drawSelection = (ctx: CanvasRenderingContext2D) => {
    // Draw selection outline for selected notes
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    selectedNotes.forEach(noteId => {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
      
      const noteY = HEADER_HEIGHT;
      const availableHeight = height - HEADER_HEIGHT;
      const noteHeight = availableHeight / totalNotes;
      
      const x = PIANO_KEY_WIDTH + (note.startTime * BEAT_WIDTH * zoom.x) - viewOffset.x;
      const y = noteY + ((noteRange.max - note.note) * noteHeight);
      const noteWidth = note.duration * BEAT_WIDTH * zoom.x;
      
      ctx.strokeRect(x - 1, y - 1, noteWidth + 2, noteHeight + 2);
    });
    
    ctx.setLineDash([]);
  };

  const isBlackNote = (midiNote: number): boolean => {
    const noteInOctave = midiNote % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  };

  const getNoteNameFromMidi = (midiNote: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  };

  const getTimeFromX = (x: number): number => {
    return (x - PIANO_KEY_WIDTH + viewOffset.x) / (BEAT_WIDTH * zoom.x);
  };

  const getNoteFromY = (y: number): number => {
    const noteY = HEADER_HEIGHT;
    const availableHeight = height - HEADER_HEIGHT;
    const noteHeight = availableHeight / totalNotes;
    const noteIndex = Math.floor((y - noteY) / noteHeight);
    return Math.max(noteRange.min, Math.min(noteRange.max, noteRange.max - noteIndex));
  };

  const snapToGridTime = (time: number): number => {
    if (!snapToGrid) return time;
    return Math.round(time / gridResolution) * gridResolution;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on timeline for seeking
    if (y <= HEADER_HEIGHT && x >= PIANO_KEY_WIDTH) {
      const time = getTimeFromX(x);
      onSeek?.(Math.max(0, time));
      return;
    }

    // Check if clicking on a note
    const clickedNote = findNoteAtPosition(x, y);
    
    if (clickedNote) {
      if (!event.shiftKey) {
        setSelectedNotes(new Set([clickedNote.id]));
      } else {
        const newSelection = new Set(selectedNotes);
        if (newSelection.has(clickedNote.id)) {
          newSelection.delete(clickedNote.id);
        } else {
          newSelection.add(clickedNote.id);
        }
        setSelectedNotes(newSelection);
      }
      setIsDragging(true);
      setDragStart({ x, y });
    } else {
      // Start drawing new note
      if (x >= PIANO_KEY_WIDTH && y >= HEADER_HEIGHT) {
        setIsDrawing(true);
        setDragStart({ x, y });
        setSelectedNotes(new Set());
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isDrawing) {
      // Update drawing preview (you could add visual feedback here)
    } else if (isDragging && selectedNotes.size > 0) {
      // Move selected notes
      const deltaTime = getTimeFromX(x) - getTimeFromX(dragStart.x);
      const deltaNote = getNoteFromY(y) - getNoteFromY(dragStart.y);
      
      // Apply movement to selected notes
      const updatedNotes = notes.map(note => {
        if (selectedNotes.has(note.id)) {
          const newStartTime = snapToGridTime(Math.max(0, note.startTime + deltaTime));
          const newNote = Math.max(noteRange.min, Math.min(noteRange.max, note.note + deltaNote));
          
          return {
            ...note,
            startTime: newStartTime,
            note: newNote
          };
        }
        return note;
      });
      
      onNotesChange(updatedNotes);
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && dragStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const startTime = snapToGridTime(getTimeFromX(Math.min(dragStart.x, x)));
      const endTime = snapToGridTime(getTimeFromX(Math.max(dragStart.x, x)));
      const duration = Math.max(gridResolution, endTime - startTime);
      const note = getNoteFromY(y);

      // Create new note
      const newNote: MidiNote = {
        id: `note_${Date.now()}_${Math.random()}`,
        note,
        velocity: 100,
        startTime,
        duration,
        channel: 0
      };

      onNotesChange([...notes, newNote]);
      setSelectedNotes(new Set([newNote.id]));
    }

    setIsDragging(false);
    setIsDrawing(false);
    setDragStart(null);
  };

  const findNoteAtPosition = (x: number, y: number): MidiNote | null => {
    const noteY = HEADER_HEIGHT;
    const availableHeight = height - HEADER_HEIGHT;
    const noteHeight = availableHeight / totalNotes;
    
    for (const note of notes) {
      const noteX = PIANO_KEY_WIDTH + (note.startTime * BEAT_WIDTH * zoom.x) - viewOffset.x;
      const noteYPos = noteY + ((noteRange.max - note.note) * noteHeight);
      const noteWidth = note.duration * BEAT_WIDTH * zoom.x;
      
      if (x >= noteX && x <= noteX + noteWidth && y >= noteYPos && y <= noteYPos + noteHeight) {
        return note;
      }
    }
    
    return null;
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Delete selected notes
      const updatedNotes = notes.filter(note => !selectedNotes.has(note.id));
      onNotesChange(updatedNotes);
      setSelectedNotes(new Set());
    } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      // Select all notes
      event.preventDefault();
      setSelectedNotes(new Set(notes.map(note => note.id)));
    }
  }, [notes, selectedNotes, onNotesChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`midi-editor ${className}`}>
      {/* Transport Controls */}
      <div className="flex items-center gap-2 p-2 bg-card border-b border-border">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={onStop}
          className="p-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          <Square size={16} />
        </button>
        <button
          onClick={() => onSeek?.(0)}
          className="p-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          <RotateCcw size={16} />
        </button>
        
        <div className="ml-4 text-sm text-muted-foreground">
          Time: {currentTime.toFixed(2)} beats | Selected: {selectedNotes.size} notes
        </div>
      </div>
      
      {/* MIDI Editor Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="cursor-crosshair border border-border"
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

export default MidiEditor;