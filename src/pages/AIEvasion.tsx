import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Play,
  Pause,
  Target,
  Brain,
  Waves,
  FileAudio,
  X,
  Check,
  Volume2,
  SkipBack,
  SkipForward,
  Clock,
  FileText
} from 'lucide-react';

interface DetectionResult {
  id: string;
  timestamp: string;
  confidence: number;
  model: string;
  status: 'safe' | 'warning' | 'danger';
  details: string;
  technicalAnalysis?: {
    spectralFeatures: string;
    temporalFeatures: string;
    timbreFeatures: string;
    riskLevel: 'low' | 'medium' | 'high';
    detectedPatterns: string[];
    recommendations: string[];
  };
}

interface EvasionStrategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  intensity: number;
  category: 'audio' | 'metadata' | 'structure' | 'timing';
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  accuracy: number;
  lastTested: string;
  status: 'active' | 'inactive' | 'testing';
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  file: File;
  analysisResult?: DetectionResult;
  audioUrl?: string;
  duration?: number;
  isModifying?: boolean;
  modificationProgress?: number;
  modifiedFileUrl?: string;
  modificationStatus?: 'idle' | 'processing' | 'completed' | 'error';
}

const AIEvasion: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [protectionLevel, setProtectionLevel] = useState<'basic' | 'advanced' | 'premium'>('advanced');
  const [autoProtection, setAutoProtection] = useState(true);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);
  
  // 文件上传相关状态
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 新增音频播放相关状态
  const [currentPlayingFile, setCurrentPlayingFile] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 添加refs来跟踪活动的intervals和timeouts
  const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const activeTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const audioElementsRef = useRef<Set<HTMLAudioElement>>(new Set());

  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([
    {
      id: '1',
      timestamp: '2024-01-15 15:30:25',
      confidence: 0.15,
      model: 'OpenAI Classifier',
      status: 'safe',
      details: '音频特征分析通过，未检测到AI生成痕迹'
    },
    {
      id: '2',
      timestamp: '2024-01-15 15:28:12',
      confidence: 0.67,
      model: 'Google AudioLM Detector',
      status: 'warning',
      details: '检测到可疑的频谱模式，建议应用额外保护'
    },
    {
      id: '3',
      timestamp: '2024-01-15 15:25:45',
      confidence: 0.89,
      model: 'Meta MusicGen Detector',
      status: 'danger',
      details: '高置信度检测到AI生成特征，需要立即处理'
    }
  ]);

  const [evasionStrategies, setEvasionStrategies] = useState<EvasionStrategy[]>([
    {
      id: '1',
      name: '频谱噪声注入',
      description: '在不可听频段添加微量噪声，干扰AI检测算法',
      enabled: true,
      intensity: 0.3,
      category: 'audio'
    },
    {
      id: '2',
      name: '动态时间拉伸',
      description: '对音频进行微小的时间拉伸变化，破坏时序特征',
      enabled: true,
      intensity: 0.2,
      category: 'timing'
    },
    {
      id: '3',
      name: '元数据混淆',
      description: '修改音频文件的元数据信息，隐藏生成痕迹',
      enabled: false,
      intensity: 0.8,
      category: 'metadata'
    },
    {
      id: '4',
      name: '结构重组',
      description: '重新排列音频段落，改变整体结构特征',
      enabled: true,
      intensity: 0.5,
      category: 'structure'
    }
  ]);

  const [aiModels, setAiModels] = useState<AIModel[]>([
    {
      id: '1',
      name: 'OpenAI Classifier',
      provider: 'OpenAI',
      accuracy: 0.92,
      lastTested: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Google AudioLM Detector',
      provider: 'Google',
      accuracy: 0.88,
      lastTested: '2024-01-14',
      status: 'active'
    },
    {
      id: '3',
      name: 'Meta MusicGen Detector',
      provider: 'Meta',
      accuracy: 0.85,
      lastTested: '2024-01-13',
      status: 'testing'
    }
  ]);

  // 清理函数
  const cleanup = useCallback(() => {
    // 清理所有活动的intervals
    activeIntervalsRef.current.forEach(interval => {
      clearInterval(interval);
    });
    activeIntervalsRef.current.clear();

    // 清理所有活动的timeouts
    activeTimeoutsRef.current.forEach(timeout => {
      clearTimeout(timeout);
    });
    activeTimeoutsRef.current.clear();

    // 清理所有音频元素
    audioElementsRef.current.forEach(audio => {
      audio.pause();
      audio.src = '';
      audio.load();
    });
    audioElementsRef.current.clear();
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleScan = async () => {
    setIsScanning(true);
    
    // Simulate scanning process
    setTimeout(() => {
      const newResult: DetectionResult = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('zh-CN'),
        confidence: Math.random(),
        model: aiModels[Math.floor(Math.random() * aiModels.length)].name,
        status: Math.random() > 0.7 ? 'danger' : Math.random() > 0.4 ? 'warning' : 'safe',
        details: '扫描完成，分析结果已生成'
      };
      
      setDetectionResults([newResult, ...detectionResults.slice(0, 9)]);
      setIsScanning(false);
    }, 3000);
  };

  const handleStrategyToggle = (strategyId: string) => {
    setEvasionStrategies(strategies => 
      strategies.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, enabled: !strategy.enabled }
          : strategy
      )
    );
  };

  const handleIntensityChange = (strategyId: string, intensity: number) => {
    setEvasionStrategies(strategies => 
      strategies.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, intensity }
          : strategy
      )
    );
  };

  const getStatusColor = (status: DetectionResult['status']) => {
    switch (status) {
      case 'safe': return 'text-success-400';
      case 'warning': return 'text-accent-400';
      case 'danger': return 'text-red-400';
      default: return 'text-foreground-muted';
    }
  };

  const getStatusIcon = (status: DetectionResult['status']) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'danger': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: EvasionStrategy['category']) => {
    switch (category) {
      case 'audio': return <Waves className="w-4 h-4" />;
      case 'metadata': return <Settings className="w-4 h-4" />;
      case 'structure': return <BarChart3 className="w-4 h-4" />;
      case 'timing': return <Activity className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const enabledStrategies = evasionStrategies.filter(s => s.enabled).length;
  const averageIntensity = evasionStrategies.reduce((sum, s) => sum + (s.enabled ? s.intensity : 0), 0) / enabledStrategies || 0;

  // 文件上传处理函数
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
      'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-wav'
    ];
    
    if (file.size > maxSize) {
      return { valid: false, error: '文件大小不能超过50MB' };
    }
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|ogg|aac|m4a)$/i)) {
      return { valid: false, error: '仅支持音频文件格式 (MP3, WAV, FLAC, OGG, AAC, M4A)' };
    }
    
    return { valid: true };
  };

  // 生成专业技术分析
  const generateTechnicalAnalysis = (confidence: number, model: string) => {
    const riskLevel: 'low' | 'medium' | 'high' = confidence > 0.7 ? 'high' : confidence > 0.3 ? 'medium' : 'low';
    
    const analysisData = {
      'OpenAI Classifier': {
        high: {
          spectralFeatures: '检测到明显的AI生成频谱特征：频率分布过于规整，缺乏自然录音的随机性',
          temporalFeatures: '时域包络呈现典型的神经网络生成模式，动态范围压缩过度',
          timbreFeatures: '音色纹理显示合成痕迹，泛音结构不符合真实乐器物理特性',
          detectedPatterns: ['频谱规律性异常', '相位关系不自然', '噪声底层缺失', '瞬态响应过于完美'],
          recommendations: ['添加自然噪声层', '引入微妙的音高波动', '调整动态范围', '增加随机性元素']
        },
        medium: {
          spectralFeatures: '频谱分析显示部分AI生成特征，某些频段存在不自然的规律性',
          temporalFeatures: '时域特征基本正常，但在某些片段检测到轻微的合成痕迹',
          timbreFeatures: '音色整体自然，但在高频部分存在轻微的数字化痕迹',
          detectedPatterns: ['局部频谱异常', '轻微相位失真', '部分频段过于干净'],
          recommendations: ['优化高频响应', '增加微妙的不完美性', '调整局部频谱特征']
        },
        low: {
          spectralFeatures: '频谱特征接近自然录音，未发现明显的AI生成痕迹',
          temporalFeatures: '时域特征正常，动态变化符合自然音频特性',
          timbreFeatures: '音色纹理自然，泛音结构合理',
          detectedPatterns: ['整体特征自然'],
          recommendations: ['保持当前质量']
        }
      },
      'Google AudioLM Detector': {
        high: {
          spectralFeatures: '检测到AudioLM模型特有的频谱生成模式，梅尔频谱系数分布异常',
          temporalFeatures: '序列建模痕迹明显，时间依赖关系过于规整',
          timbreFeatures: '音色转换存在明显的量化痕迹，缺乏自然的微妙变化',
          detectedPatterns: ['序列生成模式', 'MFCC特征异常', '时间建模痕迹', '量化噪声特征'],
          recommendations: ['破坏序列规律性', '添加自然变化', '优化时间建模', '引入真实录音特征']
        },
        medium: {
          spectralFeatures: '梅尔频谱显示轻微的模型生成特征，但整体较为自然',
          temporalFeatures: '时间序列特征基本正常，存在轻微的建模痕迹',
          timbreFeatures: '音色质量良好，但在某些转换点存在轻微不自然',
          detectedPatterns: ['轻微序列痕迹', '局部MFCC异常'],
          recommendations: ['优化序列连续性', '改善音色转换']
        },
        low: {
          spectralFeatures: '梅尔频谱特征自然，符合真实音频分布',
          temporalFeatures: '时间序列建模良好，无明显人工痕迹',
          timbreFeatures: '音色变化自然流畅',
          detectedPatterns: ['特征分布自然'],
          recommendations: ['维持当前水平']
        }
      },
      'Meta MusicGen Detector': {
        high: {
          spectralFeatures: '检测到MusicGen特有的音乐生成模式，和声结构过于完美',
          temporalFeatures: '节拍和节奏显示明显的算法生成特征，缺乏人类演奏的微妙变化',
          timbreFeatures: '乐器音色呈现数字合成特征，缺乏物理建模的真实感',
          detectedPatterns: ['和声生成模式', '节奏算法痕迹', '乐器合成特征', '缺乏演奏变化'],
          recommendations: ['增加演奏变化', '调整和声进行', '优化乐器音色', '添加人性化元素']
        },
        medium: {
          spectralFeatures: '音乐结构基本自然，但在某些和声进行中存在生成痕迹',
          temporalFeatures: '节奏感良好，存在轻微的算法规律性',
          timbreFeatures: '乐器音色质量较高，但缺乏一些细微的真实感',
          detectedPatterns: ['局部和声异常', '轻微节奏规律性'],
          recommendations: ['优化和声自然度', '增加节奏变化']
        },
        low: {
          spectralFeatures: '音乐结构自然，和声进行符合传统音乐理论',
          temporalFeatures: '节奏和时间感自然，具有人类演奏特征',
          timbreFeatures: '乐器音色真实，具有良好的物理特性',
          detectedPatterns: ['音乐特征自然'],
          recommendations: ['保持音乐质量']
        }
      }
    } as const;

    const modelData = analysisData[model as keyof typeof analysisData];
    if (!modelData) {
      return {
        spectralFeatures: '频谱分析完成',
        temporalFeatures: '时域分析完成',
        timbreFeatures: '音色分析完成',
        riskLevel,
        detectedPatterns: ['分析完成'],
        recommendations: ['无特殊建议']
      };
    }

    return {
      ...modelData[riskLevel],
      riskLevel,
      detectedPatterns: [...modelData[riskLevel].detectedPatterns],
      recommendations: [...modelData[riskLevel].recommendations]
    };
  };

  const performAIAnalysis = async (uploadedFile: UploadedFile) => {
    // 模拟AI分析过程
    const confidence = Math.random();
    const selectedModel = aiModels[Math.floor(Math.random() * aiModels.length)];
    const status = confidence > 0.7 ? 'danger' : confidence > 0.3 ? 'warning' : 'safe';
    
    const technicalAnalysis = generateTechnicalAnalysis(confidence, selectedModel.name);
    
    const analysisResult: DetectionResult = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('zh-CN'),
      confidence,
      model: selectedModel.name,
      status,
      details: `${selectedModel.name} 检测完成 - ${technicalAnalysis.riskLevel === 'high' ? '高风险' : technicalAnalysis.riskLevel === 'medium' ? '中等风险' : '低风险'}`,
      technicalAnalysis
    };
    
    // 更新文件的分析结果
    setUploadedFiles(prev => prev.map(f => {
      if (f.id === uploadedFile.id) {
        return { ...f, analysisResult };
      }
      return f;
    }));
    
    // 添加到检测结果列表
    setDetectionResults(prev => [analysisResult, ...prev.slice(0, 9)]);
  };

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }
      
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const audioUrl = URL.createObjectURL(file);
      
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        status: 'uploading',
        file: file,
        audioUrl,
        modificationStatus: 'idle'
      };
      
      setUploadedFiles(prev => [...prev, uploadedFile]);
      setIsUploading(true);
      
      // 获取音频时长 - 优化版本
      const audio = new Audio(audioUrl);
      audioElementsRef.current.add(audio);
      
      const handleLoadedMetadata = () => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, duration: audio.duration } : f
        ));
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElementsRef.current.delete(audio);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // 模拟文件上传进度 - 添加清理机制
      const uploadInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === uploadedFile.id && f.uploadProgress < 100) {
            const newProgress = Math.min(f.uploadProgress + Math.random() * 20, 100);
            return { ...f, uploadProgress: newProgress };
          }
          return f;
        }));
      }, 200);
      
      activeIntervalsRef.current.add(uploadInterval);
      
      // 模拟上传完成 - 移除自动AI分析
      const uploadTimeout = setTimeout(async () => {
        activeIntervalsRef.current.delete(uploadInterval);
        clearInterval(uploadInterval);
        
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === uploadedFile.id) {
            return { ...f, uploadProgress: 100, status: 'completed' };
          }
          return f;
        }));
        
        // 移除自动触发AI检测，让用户手动点击"开始AI检测"按钮
        setIsUploading(false);
        
        activeTimeoutsRef.current.delete(uploadTimeout);
      }, 2000 + Math.random() * 2000);
      
      activeTimeoutsRef.current.add(uploadTimeout);
    }
  }, []);

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 音频播放控制函数
  const playAudio = (fileId: string, audioUrl: string) => {
    if (currentPlayingFile === fileId && isPlaying) {
      // 暂停当前播放
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // 播放新音频或恢复播放
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setCurrentPlayingFile(fileId);
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentPlayingFile(null);
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始修改音频文件
  const startModification = useCallback(async (fileId: string) => {
    setUploadedFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          modificationStatus: 'processing',
          modificationProgress: 0
        };
      }
      return f;
    }));

    // 模拟修改进度 - 添加清理机制
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => prev.map(f => {
        if (f.id === fileId && f.modificationStatus === 'processing') {
          const newProgress = (f.modificationProgress || 0) + Math.random() * 15;
          if (newProgress >= 100) {
            activeIntervalsRef.current.delete(progressInterval);
            clearInterval(progressInterval);
            return {
              ...f,
              modificationProgress: 100,
              modificationStatus: 'completed',
              modifiedFileUrl: URL.createObjectURL(f.file) // 模拟修改后的文件URL
            };
          }
          return { ...f, modificationProgress: newProgress };
        }
        return f;
      }));
    }, 500);
    
    activeIntervalsRef.current.add(progressInterval);
  }, []);

  // 下载修改后的文件
  const downloadModifiedFile = (file: UploadedFile) => {
    if (file.modifiedFileUrl) {
      const link = document.createElement('a');
      link.href = file.modifiedFileUrl;
      link.download = `modified_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 音频事件监听器 - 优化版本
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime !== currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audio.duration !== duration) {
        setDuration(audio.duration);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingFile(null);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTime, duration]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} />
      
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
                  <Shield className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">AI检测逃避控制</h1>
                  <p className="text-foreground-muted text-sm">智能保护系统 - 确保音乐创作安全</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-foreground-muted">实时监控</span>
                <button 
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    realTimeMonitoring ? 'bg-primary-600' : 'bg-gray-600'
                  }`}
                  onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    realTimeMonitoring ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <button 
                className="btn-primary px-4 py-2"
                onClick={handleScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    扫描中...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    开始扫描
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Protection Status */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">保护状态</h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    protectionLevel === 'premium' ? 'bg-success-400 glow' : 
                    protectionLevel === 'advanced' ? 'bg-accent-400' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-foreground-secondary">
                    {protectionLevel === 'premium' ? '专业级' : protectionLevel === 'advanced' ? '高级' : '基础'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-success-400 mb-2">
                    {enabledStrategies}
                  </div>
                  <div className="text-sm text-foreground-muted">启用策略</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-400 mb-2">
                    {Math.round(averageIntensity * 100)}%
                  </div>
                  <div className="text-sm text-foreground-muted">平均强度</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-400 mb-2">
                    {realTimeMonitoring ? '开启' : '关闭'}
                  </div>
                  <div className="text-sm text-foreground-muted">实时监控</div>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">文件上传</h2>
              
              {/* Upload Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-primary-400 bg-primary-400/10' 
                    : 'border-primary-600/30 hover:border-primary-400/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-primary-600/20 rounded-full">
                    <Upload className="w-8 h-8 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">点击或拖拽音频文件到此处</h3>
                    <p className="text-foreground-muted text-sm">
                      支持 MP3, WAV, FLAC, OGG, AAC, M4A<br />
                      最大文件大小: 50MB
                    </p>
                  </div>
                  <button
                    className="btn-primary px-6 py-2"
                    onClick={handleFileInputClick}
                    disabled={isUploading}
                  >
                    <FileAudio className="w-4 h-4 mr-2" />
                    选择文件
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">已上传文件</h2>
                <div className="space-y-4">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="border border-primary-800/30 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary-600/20 rounded-lg">
                            <FileAudio className="w-5 h-5 text-primary-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{file.name}</h3>
                            <p className="text-sm text-foreground-muted">
                              {formatFileSize(file.size)} • {file.duration ? formatTime(file.duration) : '计算中...'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeUploadedFile(file.id)}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Upload Progress */}
                      {file.status === 'uploading' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground-muted">上传进度</span>
                            <span className="text-foreground">{Math.round(file.uploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-background-secondary rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Audio Player */}
                      {file.status === 'completed' && file.audioUrl && (
                        <div className="mb-4 p-3 bg-background-secondary rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => playAudio(file.id, file.audioUrl!)}
                                className="p-2 bg-primary-600/20 hover:bg-primary-600/30 rounded-lg transition-colors"
                              >
                                {currentPlayingFile === file.id && isPlaying ? (
                                  <Pause className="w-4 h-4 text-primary-400" />
                                ) : (
                                  <Play className="w-4 h-4 text-primary-400" />
                                )}
                              </button>
                              <span className="text-sm text-foreground-muted">
                                {currentPlayingFile === file.id ? formatTime(currentTime) : '0:00'} / {formatTime(file.duration || 0)}
                              </span>
                            </div>
                            <Volume2 className="w-4 h-4 text-foreground-muted" />
                          </div>
                          {currentPlayingFile === file.id && (
                            <div className="w-full bg-background-tertiary rounded-full h-1">
                              <div 
                                className="bg-primary-500 h-1 rounded-full transition-all duration-100"
                                style={{ width: `${(currentTime / (file.duration || 1)) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Detection Results */}
                      {file.analysisResult && (
                        <div className="mb-4 p-3 bg-background-secondary rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-foreground">AI检测结果</h4>
                            <div className={`flex items-center space-x-1 ${getStatusColor(file.analysisResult.status)}`}>
                              {getStatusIcon(file.analysisResult.status)}
                              <span className="text-sm font-medium">
                                {Math.round(file.analysisResult.confidence * 100)}% 置信度
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground-muted">检测模型:</span>
                              <span className="text-foreground font-medium">{file.analysisResult.model}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground-muted">风险等级:</span>
                              <span className={`font-medium ${
                                file.analysisResult.technicalAnalysis?.riskLevel === 'high' ? 'text-red-400' :
                                file.analysisResult.technicalAnalysis?.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {file.analysisResult.technicalAnalysis?.riskLevel === 'high' ? '高风险' :
                                 file.analysisResult.technicalAnalysis?.riskLevel === 'medium' ? '中等风险' : '低风险'}
                              </span>
                            </div>
                          </div>

                          {/* Technical Analysis Details */}
                          {file.analysisResult.technicalAnalysis && (
                            <div className="mt-4 space-y-3">
                              <div className="border-t border-primary-800/30 pt-3">
                                <h5 className="text-sm font-medium text-foreground mb-2">技术分析详情</h5>
                                
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <span className="text-accent-400 font-medium">频谱特征:</span>
                                    <p className="text-foreground-muted mt-1">{file.analysisResult.technicalAnalysis.spectralFeatures}</p>
                                  </div>
                                  
                                  <div>
                                    <span className="text-accent-400 font-medium">时域特征:</span>
                                    <p className="text-foreground-muted mt-1">{file.analysisResult.technicalAnalysis.temporalFeatures}</p>
                                  </div>
                                  
                                  <div>
                                    <span className="text-accent-400 font-medium">音色特征:</span>
                                    <p className="text-foreground-muted mt-1">{file.analysisResult.technicalAnalysis.timbreFeatures}</p>
                                  </div>
                                </div>

                                {/* Detected Patterns */}
                                {file.analysisResult.technicalAnalysis.detectedPatterns.length > 0 && (
                                  <div className="mt-3">
                                    <span className="text-accent-400 font-medium text-xs">检测到的模式:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {file.analysisResult.technicalAnalysis.detectedPatterns.map((pattern, index) => (
                                        <span key={index} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                                          {pattern}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Recommendations */}
                                {file.analysisResult.technicalAnalysis.recommendations.length > 0 && (
                                  <div className="mt-3">
                                    <span className="text-accent-400 font-medium text-xs">优化建议:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {file.analysisResult.technicalAnalysis.recommendations.map((rec, index) => (
                                        <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                          {rec}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Modification Suggestions */}
                          {file.analysisResult.status !== 'safe' && (
                            <div className="mt-3 p-2 bg-accent-500/10 border border-accent-500/20 rounded">
                              <p className="text-sm text-accent-400 mb-2">建议应用以下修改策略:</p>
                              <div className="flex flex-wrap gap-1">
                                {evasionStrategies.filter(s => s.enabled).map(strategy => (
                                  <span key={strategy.id} className="px-2 py-1 bg-accent-500/20 text-accent-300 text-xs rounded">
                                    {strategy.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Modification Progress */}
                      {file.modificationStatus === 'processing' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground-muted">正在处理修改...</span>
                            <span className="text-foreground">{Math.round(file.modificationProgress || 0)}%</span>
                          </div>
                          <div className="w-full bg-background-secondary rounded-full h-2">
                            <div 
                              className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.modificationProgress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {/* 开始AI检测按钮 - 当文件上传完成但还没有分析结果时显示 */}
                        {file.status === 'completed' && !file.analysisResult && (
                          <button
                            onClick={() => performAIAnalysis(file)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                          >
                            <Brain className="w-5 h-5" />
                            <span className="text-base">开始AI检测</span>
                          </button>
                        )}

                        {/* 应用修改/优化音频按钮 - 当有分析结果且修改状态为idle时显示 */}
                        {file.analysisResult && file.modificationStatus === 'idle' && (
                          <button
                            onClick={() => startModification(file.id)}
                            className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 glow"
                          >
                            <Settings className="w-5 h-5" />
                            <span className="text-base">
                              {file.analysisResult.status === 'safe' ? '优化音频' : '应用修改'}
                            </span>
                          </button>
                        )}

                        {/* 修改进行中状态 */}
                        {file.modificationStatus === 'processing' && (
                          <div className="flex items-center space-x-2 px-6 py-3 bg-yellow-500/20 text-yellow-400 rounded-lg">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span className="text-base">处理中... {Math.round(file.modificationProgress || 0)}%</span>
                          </div>
                        )}
                        
                        {/* 下载修改版按钮 */}
                        {file.modificationStatus === 'completed' && (
                          <button
                            onClick={() => downloadModifiedFile(file)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                          >
                            <Download className="w-5 h-5" />
                            <span className="text-base">下载修改版</span>
                          </button>
                        )}

                        {/* 重新检测按钮 - 当已有分析结果时显示 */}
                        {file.analysisResult && file.modificationStatus !== 'processing' && (
                          <button
                            onClick={() => performAIAnalysis(file)}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-sm">重新检测</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evasion Strategies */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">逃避策略配置</h2>
              <div className="space-y-4">
                {evasionStrategies.map((strategy) => (
                  <div key={strategy.id} className="border border-primary-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-600/20 rounded-lg">
                          {getCategoryIcon(strategy.category)}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{strategy.name}</h3>
                          <p className="text-sm text-foreground-muted">{strategy.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStrategyToggle(strategy.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          strategy.enabled ? 'bg-primary-600' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          strategy.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    {strategy.enabled && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-foreground-muted">强度</span>
                          <span className="text-foreground">{Math.round(strategy.intensity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={strategy.intensity}
                          onChange={(e) => handleIntensityChange(strategy.id, parseFloat(e.target.value))}
                          className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Detection Results */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">检测结果</h3>
              <div className="space-y-4">
                {detectionResults.slice(0, 5).map((result) => (
                  <div key={result.id} className="p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={getStatusColor(result.status)}>
                          {getStatusIcon(result.status)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{result.model}</div>
                          <div className="text-xs text-foreground-muted">{result.timestamp}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                        {Math.round(result.confidence * 100)}%
                      </div>
                    </div>
                    
                    {/* Risk Level and Technical Summary */}
                    {result.technicalAnalysis && (
                      <div className="mt-2 pt-2 border-t border-primary-800/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-foreground-muted">风险等级:</span>
                          <span className={`text-xs font-medium ${
                            result.technicalAnalysis.riskLevel === 'high' ? 'text-red-400' :
                            result.technicalAnalysis.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {result.technicalAnalysis.riskLevel === 'high' ? '高风险' :
                             result.technicalAnalysis.riskLevel === 'medium' ? '中等风险' : '低风险'}
                          </span>
                        </div>
                        
                        {/* Key Issues */}
                        {result.technicalAnalysis.detectedPatterns.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-accent-400 font-medium">主要问题:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.technicalAnalysis.detectedPatterns.slice(0, 2).map((pattern, index) => (
                                <span key={index} className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                                  {pattern}
                                </span>
                              ))}
                              {result.technicalAnalysis.detectedPatterns.length > 2 && (
                                <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-300 text-xs rounded">
                                  +{result.technicalAnalysis.detectedPatterns.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Top Recommendations */}
                        {result.technicalAnalysis.recommendations.length > 0 && result.status !== 'safe' && (
                          <div>
                            <span className="text-xs text-blue-400 font-medium">建议:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.technicalAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                                <span key={index} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                                  {rec}
                                </span>
                              ))}
                              {result.technicalAnalysis.recommendations.length > 2 && (
                                <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-300 text-xs rounded">
                                  +{result.technicalAnalysis.recommendations.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Models Status */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">AI模型状态</h3>
              <div className="space-y-3">
                {aiModels.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-foreground">{model.name}</div>
                      <div className="text-xs text-foreground-muted">{model.provider}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        model.status === 'active' ? 'text-success-400' : 
                        model.status === 'testing' ? 'text-accent-400' : 'text-gray-400'
                      }`}>
                        {Math.round(model.accuracy * 100)}%
                      </div>
                      <div className="text-xs text-foreground-muted">{model.lastTested}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">快速操作</h3>
              <div className="space-y-3">
                <button className="btn-primary w-full justify-center">
                  <Brain className="w-4 h-4 mr-2" />
                  智能分析
                </button>
                <button 
                  className="btn-secondary w-full justify-center"
                  onClick={handleFileInputClick}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  上传文件
                </button>
                <button className="btn-ghost w-full justify-center">
                  <Settings className="w-4 h-4 mr-2" />
                  高级设置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEvasion;