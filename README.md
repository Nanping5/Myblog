# 个人主页项目

基于 Go + Gin + GORM + React + TypeScript 构建的个人主页系统，包含文章管理、项目展示、留言功能和AI聊天功能。

## 技术栈

### 后端
- Go 1.21+
- Gin Web框架
- GORM v2
- MySQL 8.0
- JWT认证

### 前端
- React 18
- TypeScript
- Vite
- Axios
- React Router

### 部署
- Docker
- Docker Compose
- Nginx

## 快速开始

### 使用Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问地址：
- 前端：http://localhost:3000
- 后端API：http://localhost:8080

### 本地开发

#### 后端

```bash
cd backend

# 安装依赖
go mod download

# 配置环境变量（可选）
export DATABASE_DSN="root:password@tcp(127.0.0.1:3306)/personal_website?charset=utf8mb4&parseTime=True&loc=Local"
export SERVER_PORT=":8080"
export JWT_SECRET="your-secret-key"

# 运行
go run cmd/server/main.go
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 功能特性

### 已实现
- ✅ 用户认证（JWT）
- ✅ 文章管理（CRUD）
- ✅ 项目展示
- ✅ 访客留言
- ✅ 文件上传
- ✅ AI聊天功能（支持多角色、多模型）

### AI聊天功能
- 支持多个AI角色切换（智能助手、创意伙伴、生活导师、幽默大师）
- 支持多个国产AI模型：
  - 智谱GLM-4（推荐）
  - DeepSeek Chat
  - 通义千问Qwen
  - Kimi (Moonshot)
  - OpenAI GPT（可选）
- 会话历史记录
- 实时对话
- 设置面板快速切换角色和模型

## 数据库初始化

首次运行时，GORM会自动创建数据库表。

如需手动初始化AI角色数据，可以执行：

```sql
INSERT INTO ai_characters (name, description, system_prompt, personality_tags, greeting_message) VALUES
('智能助手', '专业的技术顾问', '你是一个专业的技术顾问AI助手...', '["专业", "友好"]', '你好！我是小智，很高兴为你服务！');
```

## 配置说明

### 后端配置

环境变量：
- `DATABASE_DSN`: 数据库连接字符串
- `SERVER_PORT`: 服务器端口（默认:8080）
- `JWT_SECRET`: JWT密钥
- `UPLOAD_PATH`: 文件上传路径（默认./uploads）

### AI配置

支持通过环境变量或数据库配置AI服务。至少配置一个AI服务：

```bash
# 智谱GLM（推荐，国内访问快）
GLM_API_KEY=your-glm-api-key
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# 通义千问
QWEN_API_KEY=your-qwen-api-key
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Kimi
KIMI_API_KEY=your-kimi-api-key
KIMI_API_URL=https://api.moonshot.cn/v1
```

首次启动时，系统会自动创建默认的AI角色数据。

## API文档

### 认证
- POST /api/v1/auth/login - 登录
- POST /api/v1/auth/logout - 登出
- GET /api/v1/auth/profile - 获取用户信息
- PUT /api/v1/auth/profile - 更新用户信息

### 文章
- GET /api/v1/articles - 获取文章列表
- GET /api/v1/articles/:id - 获取单篇文章
- POST /api/v1/articles - 创建文章（需认证）
- PUT /api/v1/articles/:id - 更新文章（需认证）
- DELETE /api/v1/articles/:id - 删除文章（需认证）

### 项目
- GET /api/v1/projects - 获取项目列表
- GET /api/v1/projects/featured - 获取精选项目
- POST /api/v1/projects - 创建项目（需认证）
- PUT /api/v1/projects/:id - 更新项目（需认证）
- DELETE /api/v1/projects/:id - 删除项目（需认证）

### AI聊天
- GET /api/v1/ai/models - 获取可用模型
- GET /api/v1/ai/characters - 获取AI角色列表
- POST /api/v1/ai/chat - 发送聊天消息
- GET /api/v1/ai/history - 获取聊天历史
- DELETE /api/v1/ai/history - 清空聊天历史

## 注意事项

1. 生产环境请修改JWT_SECRET
2. 配置正确的数据库连接信息
3. AI功能需要配置相应的API密钥
4. 建议使用HTTPS部署

## 开发规范

- 代码遵循KISS原则，简单直接
- 错误处理要完善，别tm让程序裸奔
- 数据库查询要加索引，性能很重要
- API要做好参数校验，别信任用户输入

## License

MIT
