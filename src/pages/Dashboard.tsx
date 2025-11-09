import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  Plus,
  Play,
  Pause,
  Edit3,
  Trash2,
  Download,
  Upload,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Folder,
  Settings
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  lastModified: string;
  duration: string;
  status: 'draft' | 'processing' | 'completed';
  aiDetectionRisk: 'low' | 'medium' | 'high';
  thumbnail?: string;
}

interface AIStatus {
  isActive: boolean;
  lastScan: string;
  threatsDetected: number;
  protectionLevel: 'basic' | 'advanced' | 'premium';
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: '夏日回忆',
      lastModified: '2024-01-15 14:30',
      duration: '3:45',
      status: 'completed',
      aiDetectionRisk: 'low'
    },
    {
      id: '2',
      name: '电子梦境',
      lastModified: '2024-01-14 09:15',
      duration: '4:12',
      status: 'processing',
      aiDetectionRisk: 'medium'
    },
    {
      id: '3',
      name: '未命名项目',
      lastModified: '2024-01-13 16:45',
      duration: '2:30',
      status: 'draft',
      aiDetectionRisk: 'high'
    }
  ]);

  const [aiStatus, setAiStatus] = useState<AIStatus>({
    isActive: true,
    lastScan: '2024-01-15 15:30',
    threatsDetected: 2,
    protectionLevel: 'advanced'
  });

  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'text-success-400';
      case 'processing': return 'text-accent-400';
      case 'draft': return 'text-foreground-muted';
      default: return 'text-foreground-muted';
    }
  };

  const getRiskColor = (risk: Project['aiDetectionRisk']) => {
    switch (risk) {
      case 'low': return 'text-success-400';
      case 'medium': return 'text-accent-400';
      case 'high': return 'text-red-400';
      default: return 'text-foreground-muted';
    }
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `新项目 ${projects.length + 1}`,
      lastModified: new Date().toLocaleString('zh-CN'),
      duration: '0:00',
      status: 'draft',
      aiDetectionRisk: 'low'
    };
    setProjects([newProject, ...projects]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      {/* Header */}
      <header className="border-b border-primary-800/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary-600/20 rounded-lg glow">
                <Music className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">音乐制作工作室</h1>
                <p className="text-foreground-muted text-sm">专业音乐制作与AI检测逃避平台</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/settings" className="btn-ghost p-2">
                <Settings className="w-5 h-5" />
              </Link>
              <button className="btn-primary px-4 py-2" onClick={handleCreateProject}>
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground-muted text-sm">总项目数</p>
                    <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                  </div>
                  <Folder className="w-8 h-8 text-primary-400" />
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground-muted text-sm">已完成</p>
                    <p className="text-2xl font-bold text-success-400">
                      {projects.filter(p => p.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success-400" />
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground-muted text-sm">处理中</p>
                    <p className="text-2xl font-bold text-accent-400">
                      {projects.filter(p => p.status === 'processing').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-accent-400" />
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">我的项目</h2>
                <div className="flex items-center space-x-2">
                  <button className="btn-ghost px-3 py-1 text-sm">
                    <Upload className="w-4 h-4 mr-1" />
                    导入
                  </button>
                  <button className="btn-ghost px-3 py-1 text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    导出
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border transition-all duration-200 hover:border-primary-600/50 cursor-pointer ${
                      selectedProject === project.id
                        ? 'border-primary-600/50 bg-primary-600/10'
                        : 'border-primary-800/30 bg-background-secondary/50'
                    }`}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600/20 to-accent-600/20 rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{project.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-foreground-muted">
                            <span>时长: {project.duration}</span>
                            <span>修改: {project.lastModified}</span>
                            <span className={getStatusColor(project.status)}>
                              状态: {project.status === 'completed' ? '已完成' : project.status === 'processing' ? '处理中' : '草稿'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs ${getRiskColor(project.aiDetectionRisk)}`}>
                          AI风险: {project.aiDetectionRisk === 'low' ? '低' : project.aiDetectionRisk === 'medium' ? '中' : '高'}
                        </div>
                        <Link to={`/editor/${project.id}`} className="btn-ghost p-2">
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button className="btn-ghost p-2 text-red-400 hover:text-red-300">
                          <Play className="w-4 h-4" />
                        </button>
                        <button 
                          className="btn-ghost p-2 text-red-400 hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground-secondary mb-2">还没有项目</h3>
                  <p className="text-foreground-muted mb-4">创建您的第一个音乐项目开始制作</p>
                  <button className="btn-primary px-6 py-2" onClick={handleCreateProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    创建项目
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Status Monitor */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">AI检测状态</h3>
                <div className={`w-3 h-3 rounded-full ${aiStatus.isActive ? 'bg-success-400 glow' : 'bg-red-400'}`}></div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-sm">保护级别</span>
                  <span className="text-accent-400 font-medium">
                    {aiStatus.protectionLevel === 'basic' ? '基础' : aiStatus.protectionLevel === 'advanced' ? '高级' : '专业'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-sm">最后扫描</span>
                  <span className="text-foreground-secondary text-sm">{aiStatus.lastScan}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-sm">检测到威胁</span>
                  <span className="text-red-400 font-medium">{aiStatus.threatsDetected}</span>
                </div>
                
                <Link to="/ai-evasion" className="btn-accent w-full py-2 text-center block">
                  <Shield className="w-4 h-4 mr-2 inline" />
                  管理AI逃避
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">快速操作</h3>
              <div className="space-y-3">
                <Link to="/editor/new" className="btn-primary w-full py-2 text-center block">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  新建项目
                </Link>
                <Link to="/library" className="btn-ghost w-full py-2 text-center block">
                  <Folder className="w-4 h-4 mr-2 inline" />
                  素材库
                </Link>
                <Link to="/ai-evasion" className="btn-ghost w-full py-2 text-center block">
                  <Shield className="w-4 h-4 mr-2 inline" />
                  AI逃避控制
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">系统状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 text-success-400 mr-2" />
                    <span className="text-sm text-foreground-secondary">音频引擎</span>
                  </div>
                  <span className="text-success-400 text-sm">正常</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-success-400 mr-2" />
                    <span className="text-sm text-foreground-secondary">AI保护</span>
                  </div>
                  <span className="text-success-400 text-sm">激活</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-accent-400 mr-2" />
                    <span className="text-sm text-foreground-secondary">存储空间</span>
                  </div>
                  <span className="text-accent-400 text-sm">75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with Studio Logo */}
      <footer className="py-6 px-6 border-t border-primary-800/30 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-foreground-muted/70 font-light tracking-wider">
            KELLEN CAMPFORM STUDIO
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;