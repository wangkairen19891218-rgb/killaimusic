# Railway 部署指南

本项目后端为 Express 服务，适合部署到 Railway 作为常驻进程，避开 Vercel 函数的速率与入口限制。

## 一、准备工作
- 将仓库推送到 GitHub；或使用 Railway CLI 直接从本地部署。
- 准备 Supabase 与 JWT 的环境变量（见下文）。

## 二、Railway 创建服务
1. 在 Railway 控制台选择 `New Project` → `Deploy from GitHub` → 选择本仓库。
2. 框架选择 `Node.js`。
3. 设置构建与启动命令：
   - Build: `npm run build:api`
   - Start: `npm start` （等价于 `node api/dist/server.js`）

说明：`api/server.ts` 会监听 `process.env.PORT`，Railway 会自动注入 `PORT`，无需改代码。

## 三、环境变量
在 Railway 的 Variables 面板添加：

- `SUPABASE_URL`：你的 Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY`：Service Role Key（推荐）
- （或）`SUPABASE_ANON_KEY`：若暂时没有 service key，可先用 anon key，但受 RLS 限制
- `JWT_SECRET`：任意强随机密钥（例如通过密码生成器生成）
- `JWT_EXPIRES_IN`：如 `7d`
- `FRONTEND_URL`：`https://killaimusic.fun`
- `BACKEND_URL`：`https://<你的 Railway 域名>/api`

可选：`PORT` 无需设置，Railway 会注入；若设置需与注入一致。

## 四、部署与验证
部署完成后，获得公开地址，例如 `https://your-service.up.railway.app`。

验证步骤：
1. 健康检查：`GET https://your-service.up.railway.app/api/health` 应返回 200。
2. 预检：`OPTIONS https://your-service.up.railway.app/api/auth/login` 应返回 204/200（不应 500）。
3. 登录：
   - 演示账号：`email=demo@example.com`、`password=password` → 期望 200。
   - 如需切换你自定义的演示账号，请修改后端逻辑或在数据库中添加用户，并重新部署。

## 五、前端指向新后端
- 将前端环境变量 `BACKEND_URL` 改为 Railway 域名（例如 `https://your-service.up.railway.app/api`）。
- 后端 CORS 已允许 `https://killaimusic.fun`，前端可直接跨域访问。

## 六、注意事项
- 免费额度：Railway 免费层有资源/小时限制，适合测试与轻量生产；高负载请后续评估套餐。
- 进程与端口：确保只在启动阶段监听 `PORT`，构建阶段不要启动服务。
- 文件系统：容器文件系统为临时；本项目不依赖持久本地存储，不受影响。
- 日志：使用 Railway 面板查看实时日志，便于排查 500。

## 七、故障排查
- 预检仍 500：确认 `api/app.ts` 的 `app.options('*', cors())` 生效；确保 Start 使用 `node api/dist/server.js` 而不是函数式入口。
- 登录失败：若非演示账号，检查 Supabase 表 `users` 是否存在对应用户，且密码哈希正确；检查 Service Role Key 是否配置。