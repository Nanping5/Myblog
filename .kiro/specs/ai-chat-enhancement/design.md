# AI聊天功能完善 - 设计文档

## Overview

本设计文档描述了如何完善个人主页系统的AI聊天功能。系统采用分层架构，后端使用Go+Gin+GORM，前端使用React+TypeScript。核心设计理念是通过统一的接口抽象支持多种AI Provider，通过数据库配置实现灵活的模型管理，通过优化的前端界面提供良好的用户体验。

## Architecture

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Page    │  │ Settings     │  │ Message List │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Layer (Gin)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AI Handler                               │   │
│  │  - Chat()         - GetModels()                       │   │
│  │  - GetCharacters() - GetHistory()                     │   │
│  │  - ClearHistory()                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (AI Manager)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AI Manager                               │   │
│  │  - RegisterProvider()                                 │   │
│  │  - GetProvider()                                      │   │
│  │  - ChatCompletion()                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OpenAI     │  │   Claude     │  │   Future     │      │
│  │   Provider   │  │   Provider   │  │   Providers  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (GORM + MySQL)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AICharacter  │  │ AIProvider   │  │ ChatMessage  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **后端**: Go 1.21+, Gin, GORM v2, MySQL 8.0
- **前端**: React 18, TypeScript, Vite
- **AI服务**: 智谱GLM、DeepSeek、通义千问Qwen、Kimi（可选OpenAI、Claude）
- **部署**: Docker, Docker Compose

## Components and Interfaces

### 1. AI Service Interface (backend/internal/service/ai/interface.go)

统一的AI Provider接口定义，所有AI服务提供商都必须实现此接口。

```go
package ai

import "context"

// ChatMessage 聊天消息结构
type ChatMessage struct {
    Role    string `json:"role"`    // user, assistant, system
    Content string `json:"content"`
}

// ChatCompletionRequest 聊天完成请求
type ChatCompletionRequest struct {
    Model       string        `json:"model"`
    Messages    []ChatMessage `json:"messages"`
    Temperature float32       `json:"temperature,omitempty"`
    MaxTokens   int          `json:"max_tokens,omitempty"`
    Stream      bool         `json:"stream,omitempty"`
}

// ChatCompletionResponse 聊天完成响应
type ChatCompletionResponse struct {
    ID      string       `json:"id"`
    Object  string       `json:"object"`
    Model   string       `json:"model"`
    Choices []ChatChoice `json:"choices"`
    Usage   ChatUsage    `json:"usage"`
}

// ChatChoice 聊天选择
type ChatChoice struct {
    Index        int         `json:"index"`
    Message      ChatMessage `json:"message"`
    FinishReason string      `json:"finish_reason"`
}

// ChatUsage Token使用情况
type ChatUsage struct {
    PromptTokens     int `json:"prompt_tokens"`
    CompletionTokens int `json:"completion_tokens"`
    TotalTokens      int `json:"total_tokens"`
}

// AIProvider AI提供商接口
type AIProvider interface {
    ChatCompletion(ctx context.Context, req *ChatCompletionRequest) (*ChatCompletionResponse, error)
    GetModelName() string
    GetProviderName() string
}
```

### 2. 国产AI Provider实现

#### GLM Provider (backend/internal/service/ai/glm.go)
智谱AI的实现，支持GLM-4等模型。

#### DeepSeek Provider (backend/internal/service/ai/deepseek.go)
DeepSeek的实现，支持deepseek-chat等模型。

#### Qwen Provider (backend/internal/service/ai/qwen.go)
通义千问的实现，支持qwen-turbo、qwen-plus等模型。

#### Kimi Provider (backend/internal/service/ai/kimi.go)
Moonshot Kimi的实现，支持moonshot-v1等模型。

所有Provider都实现统一的AIProvider接口，负责将统一接口转换为各自特定的API格式。

```go
package ai

type GLMProvider struct {
    apiURL  string
    apiKey  string
    model   string
    client  *http.Client
}

type DeepSeekProvider struct {
    apiURL  string
    apiKey  string
    model   string
    client  *http.Client
}

type QwenProvider struct {
    apiURL  string
    apiKey  string
    model   string
    client  *http.Client
}

type KimiProvider struct {
    apiURL  string
    apiKey  string
    model   string
    client  *http.Client
}
```

### 3. Enhanced AI Handler (backend/internal/api/handlers/ai.go)

增强的AI处理器，支持从数据库加载配置，完善错误处理。

主要方法：
- `Chat(c *gin.Context)` - 处理聊天请求
- `GetModels(c *gin.Context)` - 获取可用模型列表
- `GetCharacters(c *gin.Context)` - 获取AI角色列表
- `GetHistory(c *gin.Context)` - 获取聊天历史
- `ClearHistory(c *gin.Context)` - 清空聊天历史
- `loadProvidersFromDB()` - 从数据库加载Provider配置

### 4. Database Models (backend/internal/models/ai.go)

数据模型已存在，需要添加StringArray类型支持：

```go
type StringArray []string

func (s *StringArray) Scan(value interface{}) error
func (s StringArray) Value() (driver.Value, error)
```

### 5. Frontend Chat Component (frontend/src/pages/Chat.tsx)

完整的聊天界面组件，包含：
- 消息列表显示
- 输入框和发送按钮
- 角色选择下拉框
- 模型选择下拉框
- 设置面板
- 清空历史功能
- 加载状态显示

### 6. Frontend Type Definitions (frontend/src/types/chat.ts)

TypeScript类型定义：

```typescript
export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AICharacter {
  id: number
  name: string
  description: string
  avatar?: string
  greeting_message: string
  personality_tags?: string[]
}

export interface AIModel {
  name: string
  provider: string
  display_name: string
}

export interface ChatResponse {
  reply: string
  session_id: string
  model: string
  token_usage: {
    prompt: number
    completion: number
    total: number
  }
}
```

## Data Models

### AICharacter (已存在)
- id: 主键
- name: 角色名称（唯一）
- description: 角色描述
- system_prompt: 系统提示词
- avatar: 头像URL
- personality_tags: 性格标签（JSON数组）
- greeting_message: 欢迎消息
- is_active: 是否启用
- created_at, updated_at: 时间戳

### AIProvider (已存在)
- id: 主键
- name: 提供商名称（唯一）
- display_name: 显示名称
- api_endpoint: API端点
- model_name: 模型名称
- max_tokens: 最大Token数
- temperature: 温度参数
- api_key_encrypted: 加密的API密钥
- is_active: 是否启用
- created_at, updated_at: 时间戳

### ChatMessage (已存在)
- id: 主键
- session_id: 会话ID（索引）
- user_ip: 用户IP
- character_id: AI角色ID
- provider_id: 提供商ID
- message_type: 消息类型（user/assistant/system）
- content: 消息内容
- token_count: Token数量
- created_at: 创建时间（索引）

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: AI Provider请求格式转换正确性
*For any* 统一格式的ChatCompletionRequest，各AI Provider（GLM、DeepSeek、Qwen、Kimi）转换后的请求应包含model、messages、temperature等必需字段
**Validates: Requirements 2.2**

### Property 2: AI Provider响应格式转换正确性
*For any* AI Provider返回的响应，转换为统一格式后应包含有效的choices和usage信息
**Validates: Requirements 2.3**

### Property 3: API错误处理完整性
*For any* API调用失败的情况（网络错误、超时、4xx/5xx状态码），系统应返回包含错误详情的error对象
**Validates: Requirements 2.4**

### Property 4: HTTP请求头正确性
*For any* AI Provider发起的请求，应包含Content-Type和Authorization（或对应的API密钥头）
**Validates: Requirements 2.5**

### Property 5: 角色系统提示词应用
*For any* 选定的AI角色，发送给AI的消息列表第一条应为system角色且内容为该角色的system_prompt
**Validates: Requirements 3.2**

### Property 6: 角色切换历史保持
*For any* 会话，切换AI角色前后，使用相同session_id查询应返回相同的历史消息
**Validates: Requirements 3.3**

### Property 7: 角色信息完整显示
*For any* 返回的AI角色，前端显示应包含name、description和greeting_message字段
**Validates: Requirements 3.4**

### Property 8: 模型Provider映射正确性
*For any* 用户选择的模型，系统应使用该模型对应的Provider名称调用AIManager
**Validates: Requirements 4.2**

### Property 9: 模型信息完整显示
*For any* 返回的AI模型，前端显示应包含name、provider和display_name字段
**Validates: Requirements 4.3**

### Property 10: 模型切换会话连续性
*For any* 会话，切换AI模型前后，session_id应保持不变
**Validates: Requirements 4.4**

### Property 11: 消息时间戳显示
*For any* 显示的消息，应包含timestamp字段且格式化为可读的时间字符串
**Validates: Requirements 5.3**

### Property 12: 聊天记录持久化
*For any* 发送的用户消息和AI回复，数据库中应存在对应的ChatMessage记录
**Validates: Requirements 6.1, 6.4**

### Property 13: 会话历史恢复
*For any* session_id，使用该ID查询历史记录应返回该会话的所有消息按时间排序
**Validates: Requirements 6.2**

### Property 14: 历史清空完整性
*For any* session_id，执行清空操作后，使用该ID查询应返回空列表
**Validates: Requirements 6.3**

### Property 15: 历史记录数量限制
*For any* 会话，返回的历史记录数量不应超过配置的最大值（如10条）
**Validates: Requirements 6.5**

### Property 16: Provider配置加载
*For any* 数据库中is_active=true的AIProvider记录，系统启动时应注册到AIManager
**Validates: Requirements 7.1**

### Property 17: 配置缺失降级
*For any* 未在数据库中配置的Provider，系统应尝试从环境变量读取配置
**Validates: Requirements 7.2**

### Property 18: API密钥加密存储
*For any* 保存到数据库的API密钥，api_key_encrypted字段应为加密后的值而非明文
**Validates: Requirements 7.3**

### Property 19: Provider参数应用
*For any* 配置的AIProvider，调用时应使用其temperature和max_tokens参数
**Validates: Requirements 7.4**

### Property 20: 配置动态加载
*For any* AIProvider配置的更新，重新调用loadProvidersFromDB后应使用新配置
**Validates: Requirements 7.5**

### Property 21: 错误日志完整性
*For any* API调用失败，日志应包含错误类型、错误消息和请求上下文信息
**Validates: Requirements 8.1**

### Property 22: 数据库事务回滚
*For any* 数据库操作失败，相关的所有数据库修改应被回滚
**Validates: Requirements 8.4**

### Property 23: Panic恢复处理
*For any* handler中发生的panic，应被中间件捕获并返回500状态码
**Validates: Requirements 8.5**

### Property 24: 设置变更即时生效
*For any* 用户在设置面板修改的角色或模型，下一次发送消息应使用新的设置
**Validates: Requirements 9.5**

### Property 25: 数据库迁移幂等性
*For any* 数据库状态，多次执行AutoMigrate应产生相同的表结构
**Validates: Requirements 10.4**

### Property 26: Token数量限制
*For any* 发送的请求，max_tokens参数应不超过配置的最大值
**Validates: Requirements 12.4**

## Error Handling

### 错误分类

1. **API错误**
   - 网络超时：返回"网络连接超时，请稍后重试"
   - 4xx错误：返回"请求参数错误"或"API密钥无效"
   - 5xx错误：返回"AI服务暂时不可用"
   - 解析错误：返回"响应格式错误"

2. **数据库错误**
   - 连接失败：记录日志，返回"数据库连接失败"
   - 查询失败：记录日志，返回"数据查询失败"
   - 写入失败：回滚事务，返回"数据保存失败"

3. **业务逻辑错误**
   - 角色不存在：返回"AI角色不存在"
   - Provider不存在：返回"AI模型配置错误"
   - 会话无效：返回"会话已过期"

4. **系统错误**
   - Panic：捕获并返回500错误
   - 配置错误：记录日志，使用默认配置

### 错误处理策略

```go
// 统一错误响应格式
type ErrorResponse struct {
    Error   string `json:"error"`
    Code    string `json:"code"`
    Details string `json:"details,omitempty"`
}

// 错误处理中间件
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                c.JSON(500, ErrorResponse{
                    Error: "Internal server error",
                    Code:  "INTERNAL_ERROR",
                })
            }
        }()
        c.Next()
    }
}
```

## Testing Strategy

### 单元测试

单元测试覆盖核心业务逻辑和工具函数：

1. **AI Provider测试**
   - GLM Provider的请求构建和响应解析
   - DeepSeek Provider的格式转换逻辑
   - Qwen Provider的格式转换逻辑
   - Kimi Provider的格式转换逻辑
   - 错误处理和超时处理

2. **AI Manager测试**
   - Provider注册和获取
   - 默认Provider设置
   - Provider不存在时的错误处理

3. **Handler测试**
   - 请求参数验证
   - 业务逻辑正确性
   - 错误响应格式

4. **前端组件测试**
   - 消息列表渲染
   - 用户交互响应
   - 状态管理正确性

### 属性测试（Property-Based Testing）

使用Go的testing/quick包或第三方库（如gopter）进行属性测试：

**测试框架**: gopter (https://github.com/leanovate/gopter)

**配置**: 每个属性测试运行至少100次迭代

**标记格式**: `// Feature: ai-chat-enhancement, Property X: [property description]`

属性测试覆盖通用规则和不变量：

1. **格式转换属性**
   - Property 1: AI Provider请求格式转换
   - Property 2: AI Provider响应格式转换

2. **数据持久化属性**
   - Property 12: 聊天记录持久化
   - Property 13: 会话历史恢复
   - Property 14: 历史清空完整性

3. **配置管理属性**
   - Property 16: Provider配置加载
   - Property 19: Provider参数应用

4. **错误处理属性**
   - Property 3: API错误处理
   - Property 21: 错误日志完整性
   - Property 23: Panic恢复处理

### 集成测试

集成测试验证组件间的协作：

1. **端到端聊天流程**
   - 用户发送消息 → AI回复 → 保存历史
   - 切换角色 → 历史保持 → 新角色回复
   - 切换模型 → 会话连续 → 不同Provider回复

2. **数据库集成**
   - 配置加载 → Provider注册 → 聊天功能
   - 历史保存 → 查询历史 → 清空历史

3. **前后端集成**
   - API调用 → 数据展示 → 用户交互

### 测试数据

**默认AI角色数据**:
```sql
INSERT INTO ai_characters (name, description, system_prompt, personality_tags, greeting_message) VALUES
('智能助手', '专业的技术顾问', '你是一个专业的技术顾问AI助手...', '["专业", "友好"]', '你好！我是小智，很高兴为你服务！'),
('创意伙伴', '富有创造力的AI伙伴', '你是一个富有创造力的AI伙伴...', '["创意", "活泼"]', '嘿！我是灵感，让我们一起创造些有趣的东西吧！');
```

**测试用Provider配置**:
```sql
INSERT INTO ai_providers (name, display_name, api_endpoint, model_name, max_tokens, temperature, is_active) VALUES
('glm', '智谱GLM-4', 'https://open.bigmodel.cn/api/paas/v4', 'glm-4', 4000, 0.7, true),
('deepseek', 'DeepSeek Chat', 'https://api.deepseek.com/v1', 'deepseek-chat', 4000, 0.7, true),
('qwen', '通义千问Turbo', 'https://dashscope.aliyuncs.com/api/v1', 'qwen-turbo', 4000, 0.7, true),
('kimi', 'Kimi Chat', 'https://api.moonshot.cn/v1', 'moonshot-v1-8k', 4000, 0.7, true);
```

## Implementation Notes

### 关键实现细节

1. **API密钥加密**
   - 使用AES-256-GCM加密算法
   - 密钥从环境变量ENCRYPTION_KEY读取
   - 加密后存储为Base64字符串

2. **会话管理**
   - Session ID格式: `session_{timestamp}_{random}`
   - 前端localStorage存储session_id
   - 后端通过session_id关联历史记录

3. **历史记录限制**
   - 默认返回最近10条消息
   - 按created_at ASC排序
   - 超过限制的旧消息不删除，只是不加载到上下文

4. **Provider配置热加载**
   - 提供ReloadProviders API
   - 管理员可以动态更新配置
   - 无需重启服务

5. **前端状态管理**
   - 使用React Hooks管理本地状态
   - 消息列表使用useState
   - 自动滚动使用useRef和useEffect
   - 避免不必要的重渲染

6. **错误重试机制**
   - API调用失败自动重试1次
   - 重试间隔1秒
   - 超过重试次数返回错误

## Performance Considerations

1. **数据库查询优化**
   - session_id和created_at字段建立索引
   - 限制历史记录查询数量
   - 使用连接池管理数据库连接

2. **HTTP请求优化**
   - 使用http.Client连接池
   - 设置合理的超时时间（30秒）
   - 复用TCP连接

3. **前端性能优化**
   - 消息列表虚拟滚动（如果消息很多）
   - 防抖输入事件
   - 懒加载历史消息

4. **缓存策略**
   - AI角色列表缓存5分钟
   - AI模型列表缓存5分钟
   - 减少数据库查询

## Security Considerations

1. **API密钥保护**
   - 数据库加密存储
   - 不在日志中输出
   - 不在API响应中返回

2. **输入验证**
   - 消息长度限制（最大10000字符）
   - Session ID格式验证
   - SQL注入防护（GORM自动处理）

3. **访问控制**
   - 管理员API需要JWT认证
   - 普通用户API限流
   - IP黑名单机制

4. **XSS防护**
   - 前端显示消息时转义HTML
   - 使用React的默认XSS防护
   - 不使用dangerouslySetInnerHTML

## Deployment

### 环境变量

```bash
# 数据库配置
DATABASE_DSN="root:password@tcp(127.0.0.1:3306)/personal_website?charset=utf8mb4&parseTime=True&loc=Local"

# 服务器配置
SERVER_PORT=":8080"
JWT_SECRET="your-secret-key"

# AI配置（可选，优先使用数据库配置）
GLM_API_KEY="your-glm-key"
GLM_API_URL="https://open.bigmodel.cn/api/paas/v4"
DEEPSEEK_API_KEY="your-deepseek-key"
DEEPSEEK_API_URL="https://api.deepseek.com/v1"
QWEN_API_KEY="your-qwen-key"
QWEN_API_URL="https://dashscope.aliyuncs.com/api/v1"
KIMI_API_KEY="your-kimi-key"
KIMI_API_URL="https://api.moonshot.cn/v1"

# 加密密钥
ENCRYPTION_KEY="your-32-byte-encryption-key"
```

### Docker部署

```yaml
services:
  backend:
    environment:
      - DATABASE_DSN=root:password@tcp(mysql:3306)/personal_website
      - GLM_API_KEY=${GLM_API_KEY}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - QWEN_API_KEY=${QWEN_API_KEY}
      - KIMI_API_KEY=${KIMI_API_KEY}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
```

### 数据库初始化

```go
// 在main.go中添加
db.AutoMigrate(&models.AICharacter{}, &models.AIProvider{}, &models.ChatMessage{})

// 初始化默认数据
initDefaultAICharacters(db)
initDefaultAIProviders(db)
```
