import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  Folder,
  Search,
  Filter,
  Download,
  Upload,
  Play,
  Pause,
  Heart,
  Share2,
  MoreHorizontal,
  Grid3X3,
  List,
  Clock,
  Star,
  Tag,
  Volume2,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  FolderPlus,
  SortAsc,
  SortDesc,
  Eye,
  Headphones,
  Mic,
  Piano,
  Drum,
  Guitar
} from 'lucide-react';

interface AudioSample {
  id: string;
  name: string;
  category: string;
  duration: number;
  bpm: number;
  key: string;
  tags: string[];
  size: string;
  format: string;
  dateAdded: string;
  isPlaying: boolean;
  isFavorite: boolean;
  downloadCount: number;
  rating: number;
  preview?: string;
}

interface MidiTemplate {
  id: string;
  name: string;
  category: string;
  tracks: number;
  duration: number;
  bpm: number;
  key: string;
  tags: string[];
  dateAdded: string;
  isFavorite: boolean;
  downloadCount: number;
  rating: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

const AssetLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'samples' | 'midi'>('samples');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating' | 'downloads'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const categories: Category[] = [
    { id: 'all', name: '全部', icon: <Folder className="w-4 h-4" />, count: 1247, color: 'text-foreground' },
    { id: 'drums', name: '鼓组', icon: <Drum className="w-4 h-4" />, count: 324, color: 'text-red-400' },
    { id: 'bass', name: '贝斯', icon: <Guitar className="w-4 h-4" />, count: 189, color: 'text-blue-400' },
    { id: 'synth', name: '合成器', icon: <Piano className="w-4 h-4" />, count: 267, color: 'text-purple-400' },
    { id: 'vocal', name: '人声', icon: <Mic className="w-4 h-4" />, count: 156, color: 'text-green-400' },
    { id: 'fx', name: '音效', icon: <Volume2 className="w-4 h-4" />, count: 98, color: 'text-yellow-400' },
    { id: 'ambient', name: '氛围', icon: <Volume2 className="w-4 h-4" />, count: 213, color: 'text-cyan-400' }
  ];

  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([
    {
      id: '1',
      name: 'Deep House Kick 01',
      category: 'drums',
      duration: 2.5,
      bpm: 128,
      key: 'C',
      tags: ['kick', 'deep house', 'punchy'],
      size: '2.1 MB',
      format: 'WAV',
      dateAdded: '2024-01-15',
      isPlaying: false,
      isFavorite: true,
      downloadCount: 1247,
      rating: 4.8
    },
    {
      id: '2',
      name: 'Analog Bass Loop',
      category: 'bass',
      duration: 8.0,
      bpm: 120,
      key: 'Am',
      tags: ['bass', 'analog', 'loop', 'warm'],
      size: '5.3 MB',
      format: 'WAV',
      dateAdded: '2024-01-14',
      isPlaying: false,
      isFavorite: false,
      downloadCount: 892,
      rating: 4.6
    },
    {
      id: '3',
      name: 'Ethereal Pad',
      category: 'synth',
      duration: 16.0,
      bpm: 0,
      key: 'Dm',
      tags: ['pad', 'ethereal', 'ambient', 'cinematic'],
      size: '8.7 MB',
      format: 'WAV',
      dateAdded: '2024-01-13',
      isPlaying: false,
      isFavorite: true,
      downloadCount: 634,
      rating: 4.9
    },
    {
      id: '4',
      name: 'Vocal Chop Melody',
      category: 'vocal',
      duration: 4.2,
      bpm: 140,
      key: 'F#',
      tags: ['vocal', 'chop', 'melody', 'processed'],
      size: '3.8 MB',
      format: 'WAV',
      dateAdded: '2024-01-12',
      isPlaying: false,
      isFavorite: false,
      downloadCount: 456,
      rating: 4.3
    }
  ]);

  const [midiTemplates, setMidiTemplates] = useState<MidiTemplate[]>([
    {
      id: '1',
      name: 'Progressive House Template',
      category: 'electronic',
      tracks: 8,
      duration: 240,
      bpm: 128,
      key: 'Am',
      tags: ['progressive', 'house', 'template', 'full'],
      dateAdded: '2024-01-15',
      isFavorite: true,
      downloadCount: 567,
      rating: 4.7,
      complexity: 'intermediate'
    },
    {
      id: '2',
      name: 'Jazz Piano Chord Progression',
      category: 'jazz',
      tracks: 2,
      duration: 32,
      bpm: 120,
      key: 'Cmaj7',
      tags: ['jazz', 'piano', 'chords', 'progression'],
      dateAdded: '2024-01-14',
      isFavorite: false,
      downloadCount: 234,
      rating: 4.5,
      complexity: 'advanced'
    },
    {
      id: '3',
      name: 'Trap Beat Pattern',
      category: 'hip-hop',
      tracks: 4,
      duration: 16,
      bpm: 140,
      key: 'Gm',
      tags: ['trap', 'beat', 'pattern', 'drums'],
      dateAdded: '2024-01-13',
      isFavorite: true,
      downloadCount: 789,
      rating: 4.6,
      complexity: 'beginner'
    }
  ]);

  const handlePlay = (sampleId: string) => {
    if (currentlyPlaying === sampleId) {
      setCurrentlyPlaying(null);
      setAudioSamples(samples => 
        samples.map(sample => 
          sample.id === sampleId 
            ? { ...sample, isPlaying: false }
            : sample
        )
      );
    } else {
      setCurrentlyPlaying(sampleId);
      setAudioSamples(samples => 
        samples.map(sample => ({
          ...sample,
          isPlaying: sample.id === sampleId
        }))
      );
    }
  };

  const handleFavorite = (id: string, type: 'sample' | 'midi') => {
    if (type === 'sample') {
      setAudioSamples(samples => 
        samples.map(sample => 
          sample.id === id 
            ? { ...sample, isFavorite: !sample.isFavorite }
            : sample
        )
      );
    } else {
      setMidiTemplates(templates => 
        templates.map(template => 
          template.id === id 
            ? { ...template, isFavorite: !template.isFavorite }
            : template
        )
      );
    }
  };

  const filteredSamples = audioSamples.filter(sample => {
    const matchesSearch = sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sample.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || sample.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredMidi = midiTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getComplexityColor = (complexity: MidiTemplate['complexity']) => {
    switch (complexity) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-foreground-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      {/* Header */}
      <header className="border-b border-primary-800/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="btn-ghost p-2">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary-600/20 rounded-lg glow">
                  <Music className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">素材库</h1>
                  <p className="text-foreground-muted text-sm">音频样本 & MIDI模板</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="btn-ghost px-3 py-2">
                <Upload className="w-4 h-4 mr-2" />
                上传素材
              </button>
              <button className="btn-primary px-4 py-2">
                <FolderPlus className="w-4 h-4 mr-2" />
                新建文件夹
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-6">
            {/* Tabs */}
            <div className="card p-4">
              <div className="flex space-x-2">
                <button 
                  className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                    activeTab === 'samples' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-background-tertiary text-foreground-muted hover:bg-background-secondary'
                  }`}
                  onClick={() => setActiveTab('samples')}
                >
                  <Headphones className="w-4 h-4 mr-1 inline" />
                  音频样本
                </button>
                <button 
                  className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                    activeTab === 'midi' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-background-tertiary text-foreground-muted hover:bg-background-secondary'
                  }`}
                  onClick={() => setActiveTab('midi')}
                >
                  <Piano className="w-4 h-4 mr-1 inline" />
                  MIDI模板
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">分类</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={category.color}>{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-xs text-foreground-muted">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">快速筛选</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-2 p-2 rounded text-sm text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>我的收藏</span>
                </button>
                <button className="w-full flex items-center space-x-2 p-2 rounded text-sm text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors">
                  <Star className="w-4 h-4" />
                  <span>高评分</span>
                </button>
                <button className="w-full flex items-center space-x-2 p-2 rounded text-sm text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors">
                  <Clock className="w-4 h-4" />
                  <span>最近添加</span>
                </button>
                <button className="w-full flex items-center space-x-2 p-2 rounded text-sm text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors">
                  <Download className="w-4 h-4" />
                  <span>热门下载</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Search and Controls */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                      type="text"
                      placeholder="搜索素材..."
                      className="input pl-10 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    className={`btn-ghost px-3 py-2 ${
                      showFilters ? 'bg-primary-600/20 text-primary-400' : ''
                    }`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select 
                    className="input text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="date">按日期</option>
                    <option value="name">按名称</option>
                    <option value="rating">按评分</option>
                    <option value="downloads">按下载量</option>
                  </select>
                  
                  <button 
                    className="btn-ghost p-2"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex border border-primary-800/30 rounded-lg">
                    <button 
                      className={`p-2 rounded-l-lg transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-primary-600 text-white' 
                          : 'text-foreground-muted hover:bg-background-secondary'
                      }`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button 
                      className={`p-2 rounded-r-lg transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-primary-600 text-white' 
                          : 'text-foreground-muted hover:bg-background-secondary'
                      }`}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {showFilters && (
                <div className="border-t border-primary-800/30 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-foreground-muted mb-2">BPM范围</label>
                      <div className="flex space-x-2">
                        <input type="number" placeholder="最小" className="input text-sm" />
                        <input type="number" placeholder="最大" className="input text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-foreground-muted mb-2">音调</label>
                      <select className="input text-sm w-full">
                        <option value="">全部</option>
                        <option value="C">C</option>
                        <option value="C#">C#</option>
                        <option value="D">D</option>
                        <option value="D#">D#</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                        <option value="F#">F#</option>
                        <option value="G">G</option>
                        <option value="G#">G#</option>
                        <option value="A">A</option>
                        <option value="A#">A#</option>
                        <option value="B">B</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-foreground-muted mb-2">文件格式</label>
                      <select className="input text-sm w-full">
                        <option value="">全部</option>
                        <option value="WAV">WAV</option>
                        <option value="MP3">MP3</option>
                        <option value="FLAC">FLAC</option>
                        <option value="AIFF">AIFF</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Grid/List */}
            <div className="card p-6">
              {activeTab === 'samples' ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredSamples.map((sample) => (
                    <div key={sample.id} className={`border border-primary-800/30 rounded-lg p-4 hover:border-primary-600/50 transition-colors ${
                      viewMode === 'list' ? 'flex items-center space-x-4' : ''
                    }`}>
                      {viewMode === 'grid' ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <button 
                                className={`p-2 rounded-lg transition-colors ${
                                  sample.isPlaying 
                                    ? 'bg-primary-600 text-white' 
                                    : 'bg-background-tertiary text-foreground-muted hover:bg-primary-600/20 hover:text-primary-400'
                                }`}
                                onClick={() => handlePlay(sample.id)}
                              >
                                {sample.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <div className="text-sm text-foreground-muted">
                                {formatDuration(sample.duration)}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button 
                                className={`p-1 rounded transition-colors ${
                                  sample.isFavorite 
                                    ? 'text-red-400 hover:text-red-300' 
                                    : 'text-foreground-muted hover:text-red-400'
                                }`}
                                onClick={() => handleFavorite(sample.id, 'sample')}
                              >
                                <Heart className={`w-4 h-4 ${sample.isFavorite ? 'fill-current' : ''}`} />
                              </button>
                              <button className="p-1 rounded text-foreground-muted hover:text-foreground transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <h3 className="font-medium text-foreground mb-1">{sample.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-foreground-muted">
                              <span>{sample.bpm} BPM</span>
                              <span>•</span>
                              <span>{sample.key}</span>
                              <span>•</span>
                              <span>{sample.format}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {sample.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-background-tertiary text-xs text-foreground-muted rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-foreground-muted">{sample.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3 text-foreground-muted" />
                              <span className="text-foreground-muted">{sample.downloadCount}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <button 
                            className={`p-3 rounded-lg transition-colors ${
                              sample.isPlaying 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-background-tertiary text-foreground-muted hover:bg-primary-600/20 hover:text-primary-400'
                            }`}
                            onClick={() => handlePlay(sample.id)}
                          >
                            {sample.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground mb-1">{sample.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-foreground-muted">
                              <span>{formatDuration(sample.duration)}</span>
                              <span>{sample.bpm} BPM</span>
                              <span>{sample.key}</span>
                              <span>{sample.format}</span>
                              <span>{sample.size}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {sample.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-background-tertiary text-xs text-foreground-muted rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-foreground-muted">{sample.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3 text-foreground-muted" />
                              <span className="text-foreground-muted">{sample.downloadCount}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button 
                              className={`p-2 rounded transition-colors ${
                                sample.isFavorite 
                                  ? 'text-red-400 hover:text-red-300' 
                                  : 'text-foreground-muted hover:text-red-400'
                              }`}
                              onClick={() => handleFavorite(sample.id, 'sample')}
                            >
                              <Heart className={`w-4 h-4 ${sample.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <button className="p-2 rounded text-foreground-muted hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredMidi.map((template) => (
                    <div key={template.id} className={`border border-primary-800/30 rounded-lg p-4 hover:border-primary-600/50 transition-colors ${
                      viewMode === 'list' ? 'flex items-center space-x-4' : ''
                    }`}>
                      {viewMode === 'grid' ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-background-tertiary rounded-lg">
                                <Piano className="w-4 h-4 text-foreground-muted" />
                              </div>
                              <div className="text-sm text-foreground-muted">
                                {template.tracks} 轨道
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button 
                                className={`p-1 rounded transition-colors ${
                                  template.isFavorite 
                                    ? 'text-red-400 hover:text-red-300' 
                                    : 'text-foreground-muted hover:text-red-400'
                                }`}
                                onClick={() => handleFavorite(template.id, 'midi')}
                              >
                                <Heart className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
                              </button>
                              <button className="p-1 rounded text-foreground-muted hover:text-foreground transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <h3 className="font-medium text-foreground mb-1">{template.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-foreground-muted">
                              <span>{template.bpm} BPM</span>
                              <span>•</span>
                              <span>{template.key}</span>
                              <span>•</span>
                              <span className={getComplexityColor(template.complexity)}>
                                {template.complexity === 'beginner' ? '初级' : 
                                 template.complexity === 'intermediate' ? '中级' : '高级'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-background-tertiary text-xs text-foreground-muted rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-foreground-muted">{template.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3 text-foreground-muted" />
                              <span className="text-foreground-muted">{template.downloadCount}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-background-tertiary rounded-lg">
                            <Piano className="w-5 h-5 text-foreground-muted" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground mb-1">{template.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-foreground-muted">
                              <span>{template.tracks} 轨道</span>
                              <span>{formatDuration(template.duration)}</span>
                              <span>{template.bpm} BPM</span>
                              <span>{template.key}</span>
                              <span className={getComplexityColor(template.complexity)}>
                                {template.complexity === 'beginner' ? '初级' : 
                                 template.complexity === 'intermediate' ? '中级' : '高级'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-background-tertiary text-xs text-foreground-muted rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-foreground-muted">{template.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3 text-foreground-muted" />
                              <span className="text-foreground-muted">{template.downloadCount}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button 
                              className={`p-2 rounded transition-colors ${
                                template.isFavorite 
                                  ? 'text-red-400 hover:text-red-300' 
                                  : 'text-foreground-muted hover:text-red-400'
                              }`}
                              onClick={() => handleFavorite(template.id, 'midi')}
                            >
                              <Heart className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <button className="p-2 rounded text-foreground-muted hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden audio element for preview */}
      <audio ref={audioRef} />
    </div>
  );
};

export default AssetLibrary;