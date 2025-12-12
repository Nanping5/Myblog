package ai

import "context"

// ChatMessage 聊天消息结构
// Role: 消息角色，可选值为 user(用户)、assistant(AI助手)、system(系统)
// Content: 消息内容
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatCompletionRequest 聊天完成请求
// Model: 模型名称，如 glm-4、deepseek-chat、qwen-turbo、moonshot-v1-8k
// Messages: 消息列表，包含对话历史
// Temperature: 温度参数，控制输出的随机性，范围0-2，默认0.7
// MaxTokens: 最大生成token数，控制响应长度
// Stream: 是否使用流式输出
type ChatCompletionRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream,omitempty"`
}

// ChatCompletionResponse 聊天完成响应
// ID: 响应唯一标识
// Object: 对象类型，通常为 "chat.completion"
// Model: 实际使用的模型名称
// Choices: 生成的回复选项列表
// Usage: Token使用统计
type ChatCompletionResponse struct {
	ID      string       `json:"id"`
	Object  string       `json:"object"`
	Model   string       `json:"model"`
	Choices []ChatChoice `json:"choices"`
	Usage   ChatUsage    `json:"usage"`
}

// ChatChoice 聊天选择
// Index: 选项索引
// Message: 生成的消息内容
// FinishReason: 结束原因，如 "stop"(正常结束)、"length"(达到长度限制)
type ChatChoice struct {
	Index        int         `json:"index"`
	Message      ChatMessage `json:"message"`
	FinishReason string      `json:"finish_reason"`
}

// ChatUsage Token使用情况
// PromptTokens: 输入消息消耗的token数
// CompletionTokens: 生成回复消耗的token数
// TotalTokens: 总消耗token数
type ChatUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// AIProvider AI提供商接口
// 所有AI服务提供商（GLM、DeepSeek、Qwen、Kimi、OpenAI等）都必须实现此接口
// 这样可以统一调用方式，方便扩展和切换不同的AI服务
type AIProvider interface {
	// ChatCompletion 执行聊天完成请求
	// ctx: 上下文，用于超时控制和取消操作
	// req: 聊天请求参数
	// 返回: 聊天响应或错误
	ChatCompletion(ctx context.Context, req *ChatCompletionRequest) (*ChatCompletionResponse, error)

	// GetModelName 获取当前使用的模型名称
	GetModelName() string

	// GetProviderName 获取提供商名称，如 "glm"、"deepseek"、"qwen"、"kimi"
	GetProviderName() string
}
