# 音乐制作软件部署指南

## 项目概述

这是一个基于React + Node.js + Supabase的音乐制作软件，支持多轨编辑、AI规避分析、素材库管理等功能。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: Vercel

## 部署前准备

### 1. Supabase 配置

1. 登录 [Supabase](https://supabase.com)
2. 创建新项目或使用现有项目
3. 获取以下配置信息：
   - Project URL
   - Anon Key
   - Service Role Key

### 2. 环境变量配置

复制 `.env.example` 文件为 `.env.local`，并填入实际值：

```bash
cp .env.example .env.local
```

必需的环境变量：
- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_ANON_KEY`: Supabase匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase服务角色密钥
- `JWT_SECRET`: JWT签名密钥（建议使用强随机字符串）
- `VITE_SUPABASE_URL`: 前端Supabase URL
- `VITE_SUPABASE_ANON_KEY`: 前端Supabase匿名密钥

## Vercel 部署步骤

### 1. 准备部署

```bash
# 安装依赖
npm install

# 检查TypeScript
npm run check

# 测试构建
npm run build
```

### 2. Vercel CLI 部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署到生产环境
vercel --prod
```

### 3. 环境变量配置

在Vercel Dashboard中配置以下环境变量：

1. 访问 Vercel 项目设置
2. 进入 "Environment Variables" 页面
3. 添加所有必需的环境变量

### 4. 域名配置

1. 在Vercel Dashboard中配置自定义域名（可选）
2. 更新环境变量中的URL配置

## 数据库初始化

部署完成后，需要初始化数据库表结构：

1. 访问Supabase Dashboard
2. 运行SQL编辑器中的初始化脚本
3. 配置行级安全策略（RLS）

## 验证部署

### 1. 功能测试

- [ ] 用户注册/登录
- [ ] 项目创建和管理
- [ ] 音频文件上传
- [ ] 多轨编辑器
- [ ] AI分析功能
- [ ] 素材库访问

### 2. 性能检查

- [ ] 页面加载速度
- [ ] API响应时间
- [ ] 音频处理性能

## 常见问题

### 1. 构建失败

- 检查TypeScript类型错误
- 确认所有依赖已正确安装
- 验证环境变量配置

### 2. API调用失败

- 检查Supabase连接配置
- 验证API路由配置
- 确认CORS设置

### 3. 音频功能异常

- 确认浏览器支持Web Audio API
- 检查音频文件格式兼容性
- 验证文件上传配置

## 监控和维护

### 1. 日志监控

- Vercel Functions日志
- Supabase数据库日志
- 前端错误监控

### 2. 性能优化

- 定期检查包大小
- 优化音频处理算法
- 数据库查询优化

### 3. 安全更新

- 定期更新依赖包
- 监控安全漏洞
- 备份数据库

## 支持

如遇到部署问题，请检查：
1. 环境变量配置是否正确
2. Supabase项目是否正常运行
3. Vercel构建日志中的错误信息

---

**注意**: 确保在生产环境中使用强密码和安全的JWT密钥。