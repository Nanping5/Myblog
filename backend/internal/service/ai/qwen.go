package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// QwenProvider 通义千问AI服务提供商
type QwenProvider struct {
	apiURL string
	apiKey string
	model  string
	client *http.Client
}

// NewQwenProvider 创建Qwen Provider实例
// apiURL: API端点，如 https://dashscope.aliyuncs.com/compatible-mode/v1
// apiKey: API密钥
// model: 模型名称，如 qwen-turbo、qwen-plus、qwen-max
func NewQwenProvider(apiURL, apiKey, model string) *QwenProvider {
	return &QwenProvider{
		apiURL: apiURL,
		apiKey: apiKey,
		model:  model,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// qwenRequest 通义千问请求格式（兼容OpenAI格式）
type qwenRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream,omitempty"`
}

// qwenResponse 通义千问响应格式
type qwenResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index        int         `json:"index"`
		Message      ChatMessage `json:"message"`
		FinishReason string      `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// qwenErrorResponse 通义千问错误响应格式
type qwenErrorResponse struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error"`
}

// ChatCompletion 执行聊天完成请求
func (p *QwenProvider) ChatCompletion(ctx context.Context, req *ChatCompletionRequest) (*ChatCompletionResponse, error) {
	// 构建Qwen请求
	qwenReq := qwenRequest{
		Model:       p.model,
		Messages:    req.Messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      false,
	}

	// 序列化请求
	jsonReq, err := json.Marshal(qwenReq)
	if err != nil {
		log.Printf("[Qwen] 序列化请求失败: %v", err)
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	// 创建HTTP请求
	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.apiURL+"/chat/completions", bytes.NewBuffer(jsonReq))
	if err != nil {
		log.Printf("[Qwen] 创建请求失败: %v", err)
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

	// 发送请求
	resp, err := p.client.Do(httpReq)
	if err != nil {
		log.Printf("[Qwen] 请求失败: %v", err)
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[Qwen] 读取响应失败: %v", err)
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		var errResp qwenErrorResponse
		if err := json.Unmarshal(body, &errResp); err == nil && errResp.Error.Message != "" {
			log.Printf("[Qwen] API错误: %s - %s", errResp.Error.Type, errResp.Error.Message)
			return nil, fmt.Errorf("Qwen API错误: %s", errResp.Error.Message)
		}
		log.Printf("[Qwen] HTTP错误: %d, 响应: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("Qwen API错误: HTTP %d", resp.StatusCode)
	}

	// 解析响应
	var qwenResp qwenResponse
	if err := json.Unmarshal(body, &qwenResp); err != nil {
		log.Printf("[Qwen] 解析响应失败: %v, 响应: %s", err, string(body))
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 转换为统一格式
	result := &ChatCompletionResponse{
		ID:     qwenResp.ID,
		Object: qwenResp.Object,
		Model:  qwenResp.Model,
		Usage: ChatUsage{
			PromptTokens:     qwenResp.Usage.PromptTokens,
			CompletionTokens: qwenResp.Usage.CompletionTokens,
			TotalTokens:      qwenResp.Usage.TotalTokens,
		},
	}

	// 转换choices
	for _, choice := range qwenResp.Choices {
		result.Choices = append(result.Choices, ChatChoice{
			Index:        choice.Index,
			Message:      choice.Message,
			FinishReason: choice.FinishReason,
		})
	}

	log.Printf("[Qwen] 请求成功, 模型: %s, Token使用: %d", result.Model, result.Usage.TotalTokens)
	return result, nil
}

// GetModelName 获取模型名称
func (p *QwenProvider) GetModelName() string {
	return p.model
}

// GetProviderName 获取提供商名称
func (p *QwenProvider) GetProviderName() string {
	return "qwen"
}
