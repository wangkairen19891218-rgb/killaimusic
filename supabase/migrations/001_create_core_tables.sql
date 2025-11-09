-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  subscription VARCHAR(50) DEFAULT 'free' CHECK (subscription IN ('free', 'pro', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  bpm INTEGER DEFAULT 120 CHECK (bpm > 0 AND bpm <= 300),
  key_signature VARCHAR(10) DEFAULT 'C',
  time_signature VARCHAR(10) DEFAULT '4/4',
  duration DECIMAL(10,2) DEFAULT 0.0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建音轨表
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('audio', 'midi', 'instrument', 'vocal', 'drums', 'bass', 'synth', 'other')),
  instrument VARCHAR(100),
  volume DECIMAL(5,2) DEFAULT 1.0 CHECK (volume >= 0.0 AND volume <= 2.0),
  pan DECIMAL(3,2) DEFAULT 0.0 CHECK (pan >= -1.0 AND pan <= 1.0),
  muted BOOLEAN DEFAULT FALSE,
  solo BOOLEAN DEFAULT FALSE,
  color VARCHAR(7) DEFAULT '#3B82F6',
  order_index INTEGER DEFAULT 0,
  audio_file_url TEXT,
  midi_data JSONB,
  effects JSONB DEFAULT '[]'::jsonb,
  automation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建AI分析表
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('chord_progression', 'melody_analysis', 'rhythm_analysis', 'harmony_suggestion', 'mixing_advice', 'mastering_tips')),
  input_data JSONB NOT NULL,
  result JSONB NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  processing_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ai_analyses_target_check CHECK (
    (project_id IS NOT NULL AND track_id IS NULL) OR 
    (project_id IS NULL AND track_id IS NOT NULL)
  )
);

-- 创建资产库表
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('sample', 'loop', 'preset', 'template', 'plugin')),
  category VARCHAR(100),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration DECIMAL(10,2),
  bpm INTEGER,
  key_signature VARCHAR(10),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) CHECK (rating >= 0.0 AND rating <= 5.0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建协作表
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tracks_project_id ON tracks(project_id);
CREATE INDEX IF NOT EXISTS idx_tracks_type ON tracks(type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_project_id ON ai_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_track_id ON ai_analyses(track_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_public ON assets(is_public);
CREATE INDEX IF NOT EXISTS idx_collaborations_project_id ON collaborations(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_user_id ON collaborations(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON ai_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaborations_updated_at BEFORE UPDATE ON collaborations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- 用户表的RLS策略
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 项目表的RLS策略
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 音轨表的RLS策略
CREATE POLICY "Users can view tracks of their projects" ON tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tracks.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create tracks in their projects" ON tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tracks.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update tracks in their projects" ON tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tracks.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete tracks in their projects" ON tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tracks.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

-- AI分析表的RLS策略
CREATE POLICY "Users can view AI analyses of their content" ON ai_analyses
  FOR SELECT USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = ai_analyses.project_id 
      AND projects.user_id::text = auth.uid()::text
    )) OR
    (track_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tracks 
      JOIN projects ON projects.id = tracks.project_id
      WHERE tracks.id = ai_analyses.track_id 
      AND projects.user_id::text = auth.uid()::text
    ))
  );

CREATE POLICY "Users can create AI analyses for their content" ON ai_analyses
  FOR INSERT WITH CHECK (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = ai_analyses.project_id 
      AND projects.user_id::text = auth.uid()::text
    )) OR
    (track_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tracks 
      JOIN projects ON projects.id = tracks.project_id
      WHERE tracks.id = ai_analyses.track_id 
      AND projects.user_id::text = auth.uid()::text
    ))
  );

-- 资产库表的RLS策略
CREATE POLICY "Users can view public assets and their own assets" ON assets
  FOR SELECT USING (is_public = true OR auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own assets" ON assets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own assets" ON assets
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own assets" ON assets
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 协作表的RLS策略
CREATE POLICY "Users can view collaborations they are part of" ON collaborations
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = collaborations.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Project owners can manage collaborations" ON collaborations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = collaborations.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

-- 授予权限给anon和authenticated角色
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON collaborations TO authenticated;

-- 允许anon角色查看公共资产
GRANT SELECT ON assets TO anon;

-- 授予序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;