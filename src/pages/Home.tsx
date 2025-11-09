import { Link } from 'react-router-dom';
import { Play, Music, Headphones, Mic, Users, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-background to-primary-800">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Music className="h-8 w-8 text-accent-500" />
          <span className="text-2xl font-bold text-white">MusicStudio</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            to="/login" 
            className="px-4 py-2 text-white hover:text-accent-500 transition-colors"
          >
            登录
          </Link>
          <Link 
            to="/register" 
            className="px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            注册
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            创造你的
            <span className="text-accent-500 block">音乐世界</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
            专业级音乐制作平台，让每个人都能创作出令人惊艳的音乐作品
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-accent-500 text-white text-lg font-semibold rounded-lg hover:bg-accent-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              开始创作
            </Link>
            <Link 
              to="/dashboard" 
              className="px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-primary-900 transition-all flex items-center justify-center gap-2"
            >
              <Headphones className="h-5 w-5" />
              体验Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-black/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            强大的音乐制作功能
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-border">
              <div className="h-12 w-12 bg-accent-500 rounded-lg flex items-center justify-center mb-6">
                <Music className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">多轨录音</h3>
              <p className="text-foreground-secondary">
                支持多轨同时录音，专业级音频处理，让你的创作更加自由
              </p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-border">
              <div className="h-12 w-12 bg-accent-500 rounded-lg flex items-center justify-center mb-6">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">实时效果</h3>
              <p className="text-foreground-secondary">
                丰富的音频效果器，实时预览，让你的音乐更加动听
              </p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-border">
              <div className="h-12 w-12 bg-accent-500 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">协作创作</h3>
              <p className="text-foreground-secondary">
                与朋友一起创作，分享你的音乐灵感，共同打造完美作品
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            准备好开始你的音乐之旅了吗？
          </h2>
          <p className="text-xl text-foreground-secondary mb-8">
            加入我们的音乐社区，与全世界的音乐人一起创作
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-500 text-white text-lg font-semibold rounded-lg hover:bg-accent-600 transition-all transform hover:scale-105"
          >
            <Star className="h-5 w-5" />
            立即开始
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-black/20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Music className="h-6 w-6 text-accent-500" />
              <span className="text-lg font-semibold text-white">MusicStudio</span>
            </div>
            <p className="text-foreground-muted">
              © 2024 MusicStudio. 让音乐创作更简单。
            </p>
          </div>
          {/* Studio Logo */}
          <div className="text-center border-t border-border/30 pt-4">
            <p className="text-xs text-foreground-muted/70 font-light tracking-wider">
              KELLEN CAMPFORM STUDIO
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}